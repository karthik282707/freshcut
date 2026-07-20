import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/shops?city=Chennai — find verified shops by city
router.get('/', async (req, res) => {
    const { city } = req.query;
    try {
        const result = await pool.query(
            `SELECT s.*, u.name AS owner_name, u.phone AS owner_phone
       FROM shops s
       JOIN users u ON u.id = s.owner_id
       WHERE s.status = 'verified' ${city ? "AND LOWER(s.city) = LOWER($1)" : ""}
       ORDER BY s.rating_avg DESC`,
            city ? [city] : []
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/shops/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.name AS owner_name, u.phone AS owner_phone
       FROM shops s JOIN users u ON u.id = s.owner_id
       WHERE s.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Shop not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/shops — butcher registers a shop
router.post('/', verifyToken, requireRole('butcher'), async (req, res) => {
    const { name, description, address, city, latitude, longitude, opens_at, closes_at } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO shops (owner_id, name, description, address, city, latitude, longitude, opens_at, closes_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [req.user.id, name, description, address, city, latitude || null, longitude || null, opens_at || '06:00', closes_at || '20:00']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/shops/owner/mine — butcher's own shop
router.get('/owner/mine', verifyToken, requireRole('butcher'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM shops WHERE owner_id=$1', [req.user.id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/shops/:id/verify — admin verifies/suspends
router.patch('/:id/verify', verifyToken, requireRole('admin'), async (req, res) => {
    const { status } = req.body; // 'verified' | 'suspended' | 'pending'
    try {
        const result = await pool.query(
            'UPDATE shops SET status=$1 WHERE id=$2 RETURNING *',
            [status, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Shop not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/shops/admin/all — admin sees all shops
router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.name AS owner_name, u.email AS owner_email
       FROM shops s JOIN users u ON u.id = s.owner_id
       ORDER BY s.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
