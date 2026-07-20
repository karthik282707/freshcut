import express from 'express';
import pool from '../db/pool.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/payment/process — mock payment processing
router.post('/process', verifyToken, async (req, res) => {
    const { order_id, method } = req.body;
    try {
        const payment = await pool.query(
            `UPDATE payments SET status='paid', method=$1, gateway_ref=$2
       WHERE order_id=$3 RETURNING *`,
            [method || 'mock', `MOCK-${Date.now()}`, order_id]
        );
        if (!payment.rows.length) return res.status(404).json({ error: 'Payment record not found' });

        // Simulate payment gateway response
        res.json({
            success: true,
            payment: payment.rows[0],
            message: 'Payment processed successfully (mock)'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// GET /api/payment/:orderId — get payment status
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payments WHERE order_id=$1', [req.params.orderId]);
        if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
