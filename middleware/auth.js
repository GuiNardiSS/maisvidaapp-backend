import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Secret para JWT (em produção, usar variável de ambiente forte)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Gera token JWT para um dispositivo
 * Não requer login, apenas device ID
 */
export const generateDeviceToken = (deviceId) => {
  return jwt.sign(
    { 
      deviceId,
      type: 'device',
      timestamp: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Token válido por 30 dias
  );
};

/**
 * Middleware para validar token JWT (opcional)
 * Permite requisições sem token, mas valida se presente
 */
export const optionalAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    // Sem token é ok, continua
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.deviceId = decoded.deviceId;
    req.tokenValid = true;
  } catch (error) {
    // Token inválido, mas não bloqueia
    req.tokenValid = false;
  }
  
  next();
};

/**
 * Middleware para validar token JWT (obrigatório)
 * Bloqueia se não tiver token válido
 */
export const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token de autenticação não fornecido',
      code: 'NO_TOKEN' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.deviceId = decoded.deviceId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN' 
    });
  }
};

/**
 * Rate limiter para proteger contra ataques
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 requisições por 15 min
  message: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para validações
 */
export const validationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 requisições por minuto
  message: 'Muitas requisições. Tente novamente em breve.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter geral para API
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Máximo 30 requisições por minuto
  message: 'Limite de requisições excedido',
  standardHeaders: true,
  legacyHeaders: false,
});
