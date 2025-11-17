import Subscription from '../models/Subscription.js';
import { generateDeviceToken } from '../middleware/auth.js';
import { isDBConnected } from '../config/database.js';

/**
 * Ativa assinatura após pagamento bem-sucedido
 */
export const activateSubscription = async (req, res) => {
  try {
    // Verifica se banco de dados está conectado
    if (!isDBConnected()) {
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Banco de dados offline. Tente novamente em alguns minutos.',
        code: 'DB_OFFLINE'
      });
    }

    const { deviceId, transactionId, paymentMethod, amount, deviceInfo } = req.body;

    // Validações
    if (!deviceId || !transactionId || !paymentMethod || !amount) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        required: ['deviceId', 'transactionId', 'paymentMethod', 'amount']
      });
    }

    // Verifica se já existe assinatura para este dispositivo
    let subscription = await Subscription.findOne({ deviceId });

    // Calcula data de expiração (30 dias a partir de hoje)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    if (subscription) {
      // Atualiza assinatura existente
      subscription.transactionId = transactionId;
      subscription.paymentMethod = paymentMethod;
      subscription.amount = amount;
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.expiryDate = expiryDate;
      if (deviceInfo) subscription.deviceInfo = deviceInfo;
      
      await subscription.save();
    } else {
      // Cria nova assinatura
      subscription = new Subscription({
        deviceId,
        transactionId,
        paymentMethod,
        amount,
        status: 'active',
        expiryDate,
        deviceInfo,
      });
      
      await subscription.save();
    }

    // Gera token JWT para o dispositivo
    const token = generateDeviceToken(deviceId);

    res.status(201).json({
      success: true,
      message: 'Assinatura ativada com sucesso',
      subscription: {
        deviceId: deviceId.substring(0, 8) + '...', // Não expõe ID completo
        status: subscription.status,
        expiryDate: subscription.expiryDate,
        daysRemaining: Math.ceil((subscription.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
      },
      token,
    });

  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro ao processar assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Valida se assinatura está ativa
 */
export const validateSubscription = async (req, res) => {
  try {
    // Verifica se banco de dados está conectado
    if (!isDBConnected()) {
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Banco de dados offline',
        code: 'DB_OFFLINE'
      });
    }

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID não fornecido' });
    }

    const subscription = await Subscription.findOne({ deviceId });

    if (!subscription) {
      return res.status(200).json({
        isActive: false,
        status: 'free',
        message: 'Nenhuma assinatura encontrada',
      });
    }

    // Verifica se está ativa
    const isActive = subscription.isActive();

    // Atualiza status se expirou
    if (!isActive && subscription.status === 'active') {
      subscription.status = 'expired';
      await subscription.save();
    }

    res.json({
      isActive,
      status: subscription.status,
      expiryDate: subscription.expiryDate,
      daysRemaining: isActive 
        ? Math.ceil((subscription.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        : 0,
    });

  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro ao validar assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtém informações da assinatura
 */
export const getSubscriptionInfo = async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID não fornecido' });
    }

    const subscription = await Subscription.findOne({ deviceId });

    if (!subscription) {
      return res.status(404).json({ 
        error: 'Assinatura não encontrada',
        isActive: false,
      });
    }

    const isActive = subscription.isActive();

    res.json({
      isActive,
      status: subscription.status,
      startDate: subscription.startDate,
      expiryDate: subscription.expiryDate,
      daysRemaining: isActive 
        ? Math.ceil((subscription.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        : 0,
      paymentMethod: subscription.paymentMethod,
      createdAt: subscription.createdAt,
    });

  } catch (error) {
    console.error('Erro ao obter informações:', error);
    res.status(500).json({ 
      error: 'Erro ao obter informações da assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cancela assinatura
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID não fornecido' });
    }

    const subscription = await Subscription.findOne({ deviceId });

    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ 
      error: 'Erro ao cancelar assinatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
