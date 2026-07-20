import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users — admin lists all users
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, phone, created_at FROM users WHERE id=$1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
