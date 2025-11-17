import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('Usando conexão existente do MongoDB');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maisvidaapp';
    
    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log('✅ MongoDB conectado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    
    // Se falhar, continua sem banco (modo fallback)
    console.warn('⚠️ Modo fallback ativado - Banco de dados offline');
    console.warn('⚠️ ATENÇÃO: Assinaturas não serão persistidas sem banco de dados!');
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB desconectado');
  } catch (error) {
    console.error('Erro ao desconectar do MongoDB:', error.message);
  }
};

export const isDBConnected = () => isConnected;
