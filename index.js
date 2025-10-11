
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import stripeRoutes from './routes/stripe.js';
import pixRoutes from './routes/pix.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/pagamento', stripeRoutes);
app.use('/pix', pixRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API rodando na porta ${port}`));
