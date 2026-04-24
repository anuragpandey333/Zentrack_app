import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import transactionRoutes from './src/routes/transactions.js';
import budgetRoutes from './src/routes/budget.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/user.js';
import notificationRoutes from './src/routes/notifications.js';
import reportsRoutes from './src/routes/reports.js';
import analyticsRoutes from './src/routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Zentrack API Server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;