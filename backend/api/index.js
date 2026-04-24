import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Zentrack API Server',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        env: {
            hasDbUrl: !!process.env.DB_URL,
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasGrokKey: !!process.env.GROK_API_KEY,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

export default app;
