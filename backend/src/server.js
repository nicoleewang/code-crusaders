import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import v1Routes from './routes/v1/server.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/v1', v1Routes);

const PORT = process.env.PORT || 5558;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));