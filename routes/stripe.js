
import { Router } from 'express';
import { criarPaymentIntent } from '../controllers/stripeController.js';
const router = Router();
router.post('/', criarPaymentIntent);
export default router;
