import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import butcherRoutes from './routes/butcher.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'FreshCut Connect API', timestamp: new Date() }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/butcher', butcherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', customerRoutes); // Mounts /shops, /orders, /reviews

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
