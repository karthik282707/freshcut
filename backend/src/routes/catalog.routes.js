import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

// GET /api/catalog/shops/:shopId — products with stock, price, and market price comparison
router.get('/shops/:shopId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
         p.id, p.name, p.cutting_styles, p.unit,
         mc.name AS category, mc.id AS category_id,
         i.stock_qty, i.selling_price, i.updated_at,
         mp.reference_price AS market_reference_price
       FROM products p
       JOIN inventory i ON i.product_id = p.id AND i.shop_id = p.shop_id
       JOIN meat_categories mc ON mc.id = p.category_id
       LEFT JOIN market_prices mp ON mp.category_id = p.category_id
       WHERE p.shop_id = $1 AND i.stock_qty > 0
       ORDER BY mc.name, p.name`,
            [req.params.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/catalog/products/:id
router.get('/products/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, mc.name AS category, i.stock_qty, i.selling_price, mp.reference_price AS market_reference_price
       FROM products p
       JOIN meat_categories mc ON mc.id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.id AND i.shop_id = p.shop_id
       LEFT JOIN market_prices mp ON mp.category_id = p.category_id
       WHERE p.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
