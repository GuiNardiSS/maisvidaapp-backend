
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import stripeRoutes from './routes/stripe.js';
import pixRoutes from './routes/pix.js';
import subscriptionRoutes from './routes/subscription.js';
import { connectDB } from './config/database.js';
import { generalLimiter } from './middleware/auth.js';

dotenv.config();
const app = express();

// Conecta ao MongoDB
connectDB();

// Segurança - Helmet protege contra vulnerabilidades comuns
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON
app.use(express.json());

// Rate limiting geral
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Rotas
app.use('/pagamento', stripeRoutes);
app.use('/pix', pixRoutes);
app.use('/subscription', subscriptionRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ API rodando na porta ${port}`);
  console.log(`🔒 Segurança: Helmet + Rate Limiting ativados`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
