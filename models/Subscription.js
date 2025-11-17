import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'card'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  deviceInfo: {
    platform: String,
    model: String,
    version: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para atualizar updatedAt
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para verificar se está ativa
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.expiryDate > new Date();
};

// Método para renovar assinatura
subscriptionSchema.methods.renew = function(months = 1) {
  const newExpiry = new Date(this.expiryDate);
  newExpiry.setMonth(newExpiry.getMonth() + months);
  this.expiryDate = newExpiry;
  this.status = 'active';
  return this.save();
};

export default mongoose.model('Subscription', subscriptionSchema);
