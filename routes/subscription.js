import { Router } from 'express';
import { 
  activateSubscription, 
  validateSubscription, 
  getSubscriptionInfo,
  cancelSubscription 
} from '../controllers/subscriptionController.js';
import { optionalAuth, paymentLimiter, validationLimiter } from '../middleware/auth.js';

const router = Router();

// Ativa assinatura após pagamento
router.post('/activate', paymentLimiter, activateSubscription);

// Valida se assinatura está ativa
router.post('/validate', validationLimiter, validateSubscription);

// Obtém informações da assinatura
router.get('/info', optionalAuth, getSubscriptionInfo);

// Cancela assinatura
router.post('/cancel', optionalAuth, cancelSubscription);

export default router;
