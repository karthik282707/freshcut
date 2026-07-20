import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/inventory/shop/:shopId — butcher sees own inventory
router.get('/shop/:shopId', verifyToken, requireRole('butcher'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.id AS product_id, p.name, p.cutting_styles, p.unit,
              mc.name AS category, i.id AS inventory_id,
              i.stock_qty, i.selling_price, i.updated_at
       FROM products p
       JOIN inventory i ON i.product_id = p.id
       JOIN meat_categories mc ON mc.id = p.category_id
       WHERE p.shop_id = $1
       ORDER BY mc.name, p.name`,
            [req.params.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/inventory/:productId — update stock & price
router.put('/:productId', verifyToken, requireRole('butcher'), async (req, res) => {
    const { stock_qty, selling_price, shop_id } = req.body;
    try {
        // Verify ownership
        const shopCheck = await pool.query('SELECT id FROM shops WHERE id=$1 AND owner_id=$2', [shop_id, req.user.id]);
        if (!shopCheck.rows.length) return res.status(403).json({ error: 'Not your shop' });

        const result = await pool.query(
            `INSERT INTO inventory (product_id, shop_id, stock_qty, selling_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, shop_id)
       DO UPDATE SET stock_qty=$3, selling_price=$4, updated_at=NOW()
       RETURNING *`,
            [req.params.productId, shop_id, stock_qty, selling_price]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/inventory/products — butcher adds a product to their shop
router.post('/products', verifyToken, requireRole('butcher'), async (req, res) => {
    const { shop_id, category_id, name, cutting_styles, unit, stock_qty, selling_price } = req.body;
    try {
        const shopCheck = await pool.query('SELECT id FROM shops WHERE id=$1 AND owner_id=$2', [shop_id, req.user.id]);
        if (!shopCheck.rows.length) return res.status(403).json({ error: 'Not your shop' });

        const product = await pool.query(
            `INSERT INTO products (shop_id, category_id, name, cutting_styles, unit)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [shop_id, category_id, name, JSON.stringify(cutting_styles || ['Whole', 'Curry Cut', 'Boneless', 'Minced']), unit || 'kg']
        );
        const prod = product.rows[0];
        await pool.query(
            `INSERT INTO inventory (product_id, shop_id, stock_qty, selling_price) VALUES ($1,$2,$3,$4)`,
            [prod.id, shop_id, stock_qty || 0, selling_price || 0]
        );
        res.status(201).json(prod);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
