import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budget.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/user.js';

const app=express();
const PORT=process.env.PORT || 8000;

// Prisma connects lazily on first query

// app level middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);

app.get('/',(req,res)=>{
    res.send("Zentrack API is running...");
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});