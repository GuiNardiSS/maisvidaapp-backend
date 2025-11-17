
import Stripe from 'stripe';

/**
 * Cria um Payment Intent do Stripe para pagamento com cartão
 * O dinheiro será depositado na conta bancária configurada no Stripe Dashboard
 * 
 * IMPORTANTE: Configure sua conta bancária em:
 * https://dashboard.stripe.com/settings/payouts
 */
export const criarPaymentIntent = async (req, res) => {
  try {
    // Verifica se a chave do Stripe está configurada
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey || stripeKey === 'sk_test_SUA_CHAVE_SECRETA_AQUI') {
      return res.status(500).json({ 
        error: 'Stripe não configurado',
        message: 'Configure STRIPE_SECRET_KEY no arquivo .env'
      });
    }

    const stripe = new Stripe(stripeKey);
    const { valor, deviceId } = req.body;

    // Validação
    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    console.log(`[STRIPE] Criando Payment Intent de R$ ${(valor / 100).toFixed(2)}`);

    // Cria o Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: valor, // Valor em centavos (499 = R$ 4,99)
      currency: 'brl',
      
      // Métodos de pagamento automáticos (cartão)
      automatic_payment_methods: { 
        enabled: true 
      },
      
      // Metadados para rastreamento
      metadata: {
        deviceId: deviceId || 'unknown',
        productType: 'subscription',
        planType: 'monthly',
        description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      },
      
      // Descrição que aparece na fatura do cliente
      description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      
      // Receipt email (opcional)
      // receipt_email: 'cliente@email.com',
      
      // Statement descriptor (nome que aparece na fatura do cartão)
      statement_descriptor: 'Mais Vida App',
      statement_descriptor_suffix: 'Assinatura',
    });

    console.log(`[STRIPE] Payment Intent criado: ${paymentIntent.id}`);

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('[STRIPE] Erro ao criar Payment Intent:', error.message);
    
    res.status(500).json({ 
      error: 'Erro ao criar pagamento',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Webhook para receber notificações do Stripe
 * Configure em: https://dashboard.stripe.com/webhooks
 */
export const webhookStripe = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Processa o evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`[STRIPE] Pagamento confirmado: ${paymentIntent.id}`);
        console.log(`[STRIPE] Device ID: ${paymentIntent.metadata.deviceId}`);
        // Aqui você pode ativar a assinatura automaticamente
        break;

      case 'payment_intent.payment_failed':
        console.log(`[STRIPE] Pagamento falhou: ${event.data.object.id}`);
        break;

      default:
        console.log(`[STRIPE] Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[STRIPE] Erro no webhook:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
