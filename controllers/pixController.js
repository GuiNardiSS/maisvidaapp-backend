
import axios from 'axios';

/**
 * Gera um pagamento PIX
 * Suporta múltiplos provedores: Mercado Pago, Asaas, Efi (Gerencianet)
 */
export const gerarPix = async (req, res) => {
  try {
    const { valor, deviceId } = req.body;

    // Validação
    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const provider = process.env.PIX_PROVIDER || 'mock';
    
    console.log(`[PIX] Gerando pagamento de R$ ${(valor / 100).toFixed(2)} via ${provider}`);

    let result;

    // Seleciona o provedor configurado
    switch (provider) {
      case 'mercadopago':
        result = await gerarPixMercadoPago(valor, deviceId);
        break;
      
      case 'asaas':
        result = await gerarPixAsaas(valor, deviceId);
        break;
      
      case 'efi':
        result = await gerarPixEfi(valor, deviceId);
        break;
      
      default:
        // Mock para testes (sem provedor real)
        result = gerarPixMock(valor, deviceId);
        console.log('[PIX] Usando modo MOCK - Configure um provedor real no .env');
    }

    res.json(result);

  } catch (error) {
    console.error('[PIX] Erro ao gerar pagamento:', error.message);
    res.status(500).json({ 
      error: 'Erro ao gerar pagamento PIX',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * MERCADO PAGO - https://www.mercadopago.com.br/developers
 */
async function gerarPixMercadoPago(valor, deviceId) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado no .env');
  }

  const response = await axios.post(
    'https://api.mercadopago.com/v1/payments',
    {
      transaction_amount: valor / 100, // Converte centavos para reais
      description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      payment_method_id: 'pix',
      external_reference: deviceId,
      payer: {
        email: 'cliente@email.com',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    imagemQrCode: response.data.point_of_interaction.transaction_data.qr_code_base64,
    copiaECola: response.data.point_of_interaction.transaction_data.qr_code,
    transactionId: response.data.id,
    expiresAt: response.data.date_of_expiration,
  };
}

/**
 * ASAAS - https://www.asaas.com/
 */
async function gerarPixAsaas(valor, deviceId) {
  const apiKey = process.env.ASAAS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurado no .env');
  }

  const response = await axios.post(
    'https://www.asaas.com/api/v3/payments',
    {
      customer: 'cus_000000000000', // Cliente default ou criar dinamicamente
      billingType: 'PIX',
      value: valor / 100,
      dueDate: new Date().toISOString().split('T')[0],
      description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      externalReference: deviceId,
    },
    {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  // Busca o QR Code
  const qrCodeResponse = await axios.get(
    `https://www.asaas.com/api/v3/payments/${response.data.id}/pixQrCode`,
    {
      headers: { 'access_token': apiKey },
    }
  );

  return {
    imagemQrCode: qrCodeResponse.data.encodedImage,
    copiaECola: qrCodeResponse.data.payload,
    transactionId: response.data.id,
    expiresAt: response.data.dueDate,
  };
}

/**
 * EFI (antigo Gerencianet) - https://sejaefi.com.br/
 */
async function gerarPixEfi(valor, deviceId) {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('EFI_CLIENT_ID ou EFI_CLIENT_SECRET não configurado no .env');
  }

  // Autenticação OAuth
  const authResponse = await axios.post(
    'https://api-pix.gerencianet.com.br/oauth/token',
    {
      grant_type: 'client_credentials',
    },
    {
      auth: {
        username: clientId,
        password: clientSecret,
      },
    }
  );

  const accessToken = authResponse.data.access_token;

  // Cria cobrança PIX
  const txid = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  const response = await axios.put(
    `https://api-pix.gerencianet.com.br/v2/cob/${txid}`,
    {
      calendario: {
        expiracao: 3600, // 1 hora
      },
      devedor: {
        nome: 'Cliente',
      },
      valor: {
        original: (valor / 100).toFixed(2),
      },
      chave: process.env.PIX_KEY, // SUA CHAVE PIX
      solicitacaoPagador: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      infoAdicionais: [
        {
          nome: 'Device ID',
          valor: deviceId,
        },
      ],
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Gera QR Code
  const qrCodeResponse = await axios.get(
    `https://api-pix.gerencianet.com.br/v2/loc/${response.data.loc.id}/qrcode`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  return {
    imagemQrCode: qrCodeResponse.data.imagemQrcode,
    copiaECola: response.data.pixCopiaECola,
    transactionId: txid,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

/**
 * MOCK - Para testes sem provedor real
 */
function gerarPixMock(valor, deviceId) {
  const pixKey = process.env.PIX_KEY || 'seu-email@exemplo.com.br';
  const receiverName = process.env.PIX_RECEIVER_NAME || 'Mais Vida App';
  const receiverCity = process.env.PIX_RECEIVER_CITY || 'Sao Paulo';
  
  // Gera um código PIX fictício (formato real simplificado)
  const copiaECola = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${(valor / 100).toFixed(2)}5802BR5913${receiverName}6009${receiverCity}62070503***6304ABCD`;

  // Em produção, aqui seria um QR Code real base64
  const qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return {
    imagemQrCode: qrCodeBase64,
    copiaECola: copiaECola,
    transactionId: `mock_${Date.now()}_${deviceId.substring(0, 8)}`,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hora
    isMock: true, // Indica que é teste
  };
}
