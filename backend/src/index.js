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

const app=express();
const PORT=process.env.PORT || 8000;

// Prisma connects lazily on first query

// app level middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

app.get('/',(req,res)=>{
    res.send("Zentrack API is running...");
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});