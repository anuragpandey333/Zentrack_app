import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';

const app=express();
const PORT=process.env.PORT || 8000;

// database connection
import mongoose from 'mongoose';
mongoose.connect(process.env.DB_URL).then(()=>{
    console.log("Database connected successfully");
}).catch((err)=>{
    console.log("Database not conected",err);
});

// app level middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/',(req,res)=>{
    res.send("Zentrack API is running...");
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});