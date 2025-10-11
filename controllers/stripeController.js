
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const criarPaymentIntent = async (req, res) => {
  try {
    const { valor } = req.body;
    const pi = await stripe.paymentIntents.create({
      amount: valor, // 1990 = R$ 19,90
      currency: 'brl',
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: pi.client_secret });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
};
