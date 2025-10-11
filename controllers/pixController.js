
import axios from 'axios';

export const gerarPix = async (req, res) => {
  try {
    const { valor } = req.body;

    // Exemplo de proxy para um PSP: ajuste para o seu provedor real.
    const r = await axios.post(process.env.PIX_API_URL, {
      valor,
      descricao: 'Assinatura Premium'
    }, {
      headers: {
        'client_id': process.env.PIX_CLIENT_ID,
        'client_secret': process.env.PIX_CLIENT_SECRET
      }
    });

    res.json({
      imagemQrCode: r.data.imagemQrCode, // base64 data URL
      copiaECola: r.data.copiaECola
    });
  } catch (e) {
    console.error(e.response?.data || e.message);
    // Mock de resposta caso você ainda não tenha um PSP configurado.
    res.json({
      imagemQrCode: 'data:image/png;base64,',
      copiaECola: '0002012658PIX-EXEMPLO-COLOQUE-SEU-PSP520400005303986540419.905802BR5920Mais Vida App6009Sao Paulo62070503***6304ABCD'
    });
  }
};
