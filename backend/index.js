import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import transactionRoutes from './src/routes/transactions.js';
import budgetRoutes from './src/routes/budget.js';
import aiRoutes from './src/routes/ai.js';
import userRoutes from './src/routes/user.js';
import notificationRoutes from './src/routes/notifications.js';
import { scheduleMonthlyReports } from './src/services/cronJobs.js';

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/',(req,res)=>{
    res.send("Zentrack API Server");
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    scheduleMonthlyReports();
});