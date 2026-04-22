import express from 'express';
import morgan from 'morgan';

const app = express();
const PORT = 8000;

// app level middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.get('/',(req,res)=>{
    res.send("Hello from Express server");
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});