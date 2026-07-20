import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/shops — Browse nearby verified butcher shops
router.get('/shops', verifyToken, requireRole('customer'), async (req, res) => {
  const { city } = req.query;
  try {
    let query = `
      SELECT id, name, address, city, latitude, longitude, rating, verification_status, created_at
      FROM shops
      WHERE verification_status = 'verified'
    `;
    const params = [];
    if (city) {
      query += ` AND LOWER(city) = LOWER($1)`;
      params.push(city);
    }
    query += ` ORDER BY rating DESC`;

    const result = await pool.query(query, params);
    
    // Add mock distance and delivery time dynamically for prototype richness
    const shops = result.rows.map((shop, idx) => {
      // Create stable pseudo-random distance and delivery time based on shop ID
      const seed = shop.id * 13;
      const distance = ((seed % 35 + 10) / 10).toFixed(1) + ' km'; // e.g. 1.0 to 4.5 km
      const deliveryTime = (seed % 20 + 20) + ' mins'; // e.g. 20 to 40 mins
      return {
        ...shop,
        distance,
        delivery_time: deliveryTime
      };
    });

    res.json(shops);
  } catch (err) {
    console.error('Error fetching shops:', err);
    res.status(500).json({ error: 'Server error fetching shops' });
  }
});

// GET /api/shops/:shopId — View shop details
router.get('/shops/:shopId', verifyToken, requireRole('customer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, address, city, latitude, longitude, rating, verification_status, created_at
       FROM shops WHERE id = $1`,
      [req.params.shopId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const shop = result.rows[0];
    const seed = shop.id * 13;
    shop.distance = ((seed % 35 + 10) / 10).toFixed(1) + ' km';
    shop.delivery_time = (seed % 20 + 20) + ' mins';
    
    res.json(shop);
  } catch (err) {
    console.error('Error fetching shop detail:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shops/:shopId/products — View shop products, price, stock and market price
router.get('/shops/:shopId/products', verifyToken, requireRole('customer'), async (req, res) => {
  const shopId = req.params.shopId;
  try {
    // Get shop city first to look up correct market price
    const shopRes = await pool.query('SELECT city FROM shops WHERE id = $1', [shopId]);
    if (!shopRes.rows.length) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const city = shopRes.rows[0].city;

    // Fetch product stock and compare with market reference price for this shop's city
    const query = `
      SELECT 
        p.id AS product_id,
        p.name,
        p.category,
        p.unit,
        si.id AS inventory_id,
        si.available_quantity_kg,
        si.selling_price_per_kg,
        mp.reference_price_per_kg AS market_reference_price
      FROM products p
      JOIN shop_inventory si ON si.product_id = p.id
      LEFT JOIN market_prices mp ON mp.product_id = p.id AND LOWER(mp.city) = LOWER($2)
      WHERE si.shop_id = $1
      ORDER BY p.category, p.name
    `;
    const result = await pool.query(query, [shopId, city]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shop products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/orders — Place an order
router.post('/orders', verifyToken, requireRole('customer'), async (req, res) => {
  const { shop_id, delivery_address, items, payment_method } = req.body;
  
  if (!shop_id || !delivery_address || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify shop status
    const shopRes = await client.query('SELECT verification_status FROM shops WHERE id = $1', [shop_id]);
    if (!shopRes.rows.length) {
      throw new Error('Shop not found');
    }
    if (shopRes.rows[0].verification_status !== 'verified') {
      throw new Error('This shop is not verified and cannot take orders');
    }

    // 2. Validate stock and calculate total amount
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { product_id, quantity_kg, cutting_style, special_instruction } = item;
      
      if (!product_id || !quantity_kg || quantity_kg <= 0 || !cutting_style) {
        throw new Error('Invalid item details');
      }

      // Check stock and selling price
      const invRes = await client.query(
        `SELECT si.available_quantity_kg, si.selling_price_per_kg, p.name 
         FROM shop_inventory si
         JOIN products p ON p.id = si.product_id
         WHERE si.shop_id = $1 AND si.product_id = $2`,
        [shop_id, product_id]
      );

      if (!invRes.rows.length) {
        throw new Error(`Product ID ${product_id} not available at this shop`);
      }

      const shopProduct = invRes.rows[0];
      const stock = parseFloat(shopProduct.available_quantity_kg);
      const reqQty = parseFloat(quantity_kg);

      if (stock < reqQty) {
        throw new Error(`Insufficient stock for ${shopProduct.name}. Available: ${stock}kg, Requested: ${reqQty}kg`);
      }

      const itemTotal = reqQty * parseFloat(shopProduct.selling_price_per_kg);
      total_amount += itemTotal;

      validatedItems.push({
        product_id,
        quantity_kg: reqQty,
        price_per_kg: parseFloat(shopProduct.selling_price_per_kg),
        cutting_style,
        special_instruction: special_instruction || null
      });
    }

    // 3. Create the order (order_status defaults to 'New', stock NOT reduced yet)
    const paymentStatus = payment_method === 'UPI' ? 'paid' : 'pending';
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, shop_id, delivery_address, total_amount, payment_method, payment_status, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'New')
       RETURNING *`,
      [req.user.id, shop_id, delivery_address, total_amount, payment_method || 'COD', paymentStatus]
    );
    const order = orderRes.rows[0];

    // 4. Create order items (saving pricing at the time of order)
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity_kg, price_per_kg, cutting_style, special_instruction)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.quantity_kg, item.price_per_kg, item.cutting_style, item.special_instruction]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...order, items: validatedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', err.message);
    res.status(400).json({ error: err.message || 'Failed to place order' });
  } finally {
    client.release();
  }
});

// GET /api/orders/my-orders — View order history
router.get('/orders/my-orders', verifyToken, requireRole('customer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.delivery_address, o.total_amount, o.payment_method, o.payment_status, o.order_status, o.created_at,
              s.name AS shop_name, s.address AS shop_address
       FROM orders o
       JOIN shops s ON s.id = o.shop_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:orderId — Get specific order details
router.get('/orders/:orderId', verifyToken, async (req, res) => {
  try {
    const orderRes = await pool.query(
      `SELECT o.id, o.customer_id, o.shop_id, o.delivery_address, o.total_amount, o.payment_method, o.payment_status, o.order_status, o.created_at,
              s.name AS shop_name, s.address AS shop_address, u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN shops s ON s.id = o.shop_id
       JOIN users u ON u.id = o.customer_id
       WHERE o.id = $1`,
      [req.params.orderId]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Authorize: Customer can only view their own order; Butcher can view orders from their shop; Admin can view all
    if (req.user.role === 'customer' && order.customer_id != req.user.id) {
      return res.status(403).json({ error: 'Access denied: not your order' });
    }
    
    if (req.user.role === 'butcher') {
      const shopCheck = await pool.query('SELECT id FROM shops WHERE id = $1 AND owner_user_id = $2', [order.shop_id, req.user.id]);
      if (!shopCheck.rows.length) {
        return res.status(403).json({ error: 'Access denied: not your shop order' });
      }
    }

    // Fetch items
    const itemsRes = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity_kg, oi.price_per_kg, oi.cutting_style, oi.special_instruction,
              p.name AS product_name, p.category
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [req.params.orderId]
    );

    // Fetch review if exists
    const reviewRes = await pool.query(
      `SELECT id, rating, comment, created_at FROM reviews WHERE order_id = $1`,
      [req.params.orderId]
    );

    res.json({
      ...order,
      items: itemsRes.rows,
      review: reviewRes.rows[0] || null
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews — Submit review after delivery
router.post('/reviews', verifyToken, requireRole('customer'), async (req, res) => {
  const { order_id, rating, comment } = req.body;

  if (!order_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid review fields' });
  }

  try {
    // 1. Fetch order details to verify status
    const orderRes = await pool.query(
      'SELECT customer_id, shop_id, order_status FROM orders WHERE id = $1',
      [order_id]
    );

    if (!orderRes.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // 2. Customer must own the order
    if (order.customer_id != req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 3. Business rule: Do not allow review unless delivered!
    if (order.order_status !== 'Delivered') {
      return res.status(400).json({ error: 'You can only review shops after the order is Delivered' });
    }

    // 4. Create review
    const result = await pool.query(
      `INSERT INTO reviews (customer_id, shop_id, order_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (customer_id, order_id) 
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING *`,
      [req.user.id, order.shop_id, order_id, rating, comment || null]
    );

    // 5. Update shop rating average
    await pool.query(
      `UPDATE shops 
       SET rating = (SELECT COALESCE(AVG(rating), 0.00) FROM reviews WHERE shop_id = $1)
       WHERE id = $1`,
      [order.shop_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting review:', err);
    res.status(500).json({ error: 'Server error posting review' });
  }
});

export default router;
