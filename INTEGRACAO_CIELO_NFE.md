# Integração Cielo e Emissão de Nota Fiscal

Este documento detalha o processo completo de integração do gateway de pagamento Cielo e sistema de emissão de Notas Fiscais Eletrônicas (NF-e) para o aplicativo.

---

## 📋 Índice

1. [Integração Cielo](#integração-cielo)
2. [Emissão de Nota Fiscal](#emissão-de-nota-fiscal)
3. [Fluxo Completo](#fluxo-completo)
4. [Custos Estimados](#custos-estimados)
5. [Checklist de Implementação](#checklist-de-implementação)

---

## 🏦 Integração Cielo

### O que é a Cielo?

A Cielo é uma das maiores adquirentes de meios de pagamento do Brasil, oferecendo soluções para processamento de cartões de crédito e débito, PIX via cartão, e outros métodos de pagamento.

### Produtos Disponíveis

#### 1. **API 3.0 E-commerce (Recomendado)**
- **Descrição**: API REST para integração direta com sua aplicação
- **Vantagens**:
  - Controle total do fluxo de pagamento
  - Checkout integrado no app (sem redirecionamentos)
  - Suporte a cartão de crédito, débito, PIX
  - Recorrência nativa (ideal para assinaturas)
  - Tokenização de cartões
- **Desvantagens**:
  - Requer certificação PCI-DSS (se armazenar dados de cartão)
  - Implementação mais complexa

#### 2. **Cielo Checkout**
- **Descrição**: Página de pagamento hospedada pela Cielo
- **Vantagens**:
  - Implementação rápida e simples
  - Cielo cuida da segurança PCI-DSS
  - Interface pronta e responsiva
- **Desvantagens**:
  - Menos controle visual
  - Redireciona usuário para fora do app
  - Menor flexibilidade

#### 3. **Cielo LIO / Link de Pagamento**
- **Descrição**: Geração de links de pagamento
- **Vantagens**:
  - Extremamente simples
  - Sem necessidade de integração complexa
- **Desvantagens**:
  - Experiência de usuário inferior
  - Menos profissional

### Recomendação: API 3.0 E-commerce

Para um aplicativo de assinaturas, a **API 3.0** é a melhor escolha devido ao suporte nativo a recorrência e controle total do fluxo.

---

## 🔧 Pré-requisitos Cielo

### 1. Documentação Necessária

- **CNPJ** ativo e regularizado
- **Contrato social** ou documento equivalente
- **Documentos dos sócios** (RG, CPF, comprovante de residência)
- **Última alteração contratual** (se houver)
- **Faturamento mensal estimado**
- **Conta bancária PJ** para recebimento

### 2. Criar Conta Cielo

1. Acesse: https://www.cielo.com.br/
2. Escolha o plano adequado:
   - **Cielo Prever**: Para faturamento até R$ 200k/mês
   - **Cielo Gestão**: Para faturamento maior
3. Aguarde análise de crédito (2-5 dias úteis)
4. Após aprovação, receba credenciais de produção

### 3. Ambiente de Testes (Sandbox)

Antes da produção, utilize o ambiente sandbox:

- **URL Sandbox**: https://apisandbox.cieloecommerce.cielo.com.br
- **Credenciais de Teste**:
  ```
  MerchantId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  MerchantKey: XXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```
- **Cartões de Teste**: Disponíveis na documentação Cielo
- **Documentação**: https://developercielo.github.io/manual/cielo-ecommerce

---

## 💻 Implementação Técnica - Backend Node.js

### 1. Instalar SDK Cielo

```bash
cd meu_backend_node
npm install cielo --save
```

### 2. Configurar Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Cielo Credentials
CIELO_MERCHANT_ID=seu-merchant-id-aqui
CIELO_MERCHANT_KEY=sua-merchant-key-aqui
CIELO_ENVIRONMENT=sandbox  # ou 'production'

# URLs de Retorno
CIELO_RETURN_URL=https://seuapp.com/pagamento/retorno
CIELO_NOTIFICATION_URL=https://seuapp.com/webhook/cielo
```

### 3. Criar Serviço Cielo

Criar arquivo `services/cieloService.js`:

```javascript
import { Cielo } from 'cielo';

const cielo = new Cielo({
  merchantId: process.env.CIELO_MERCHANT_ID,
  merchantKey: process.env.CIELO_MERCHANT_KEY,
  sandbox: process.env.CIELO_ENVIRONMENT === 'sandbox',
  debug: process.env.NODE_ENV === 'development'
});

class CieloService {
  /**
   * Cria uma transação de cartão de crédito
   */
  async createCreditCardTransaction(data) {
    const transaction = {
      MerchantOrderId: data.orderId,
      Customer: {
        Name: data.customerName,
        Email: data.customerEmail,
        Identity: data.customerCpf,
        IdentityType: 'CPF',
        Mobile: data.customerPhone
      },
      Payment: {
        Type: 'CreditCard',
        Amount: Math.round(data.amount * 100), // Centavos
        Installments: data.installments || 1,
        SoftDescriptor: 'MaisVidaNossaVida', // Aparece na fatura
        CreditCard: {
          CardNumber: data.cardNumber,
          Holder: data.cardHolder,
          ExpirationDate: data.expirationDate, // MM/YYYY
          SecurityCode: data.cvv,
          Brand: data.cardBrand // Visa, Master, etc.
        }
      }
    };

    try {
      const response = await cielo.creditCard.transaction(transaction);
      return {
        success: response.Payment.Status === 2, // 2 = Autorizada
        transactionId: response.Payment.PaymentId,
        status: response.Payment.Status,
        returnCode: response.Payment.ReturnCode,
        returnMessage: response.Payment.ReturnMessage,
        authorizationCode: response.Payment.AuthorizationCode
      };
    } catch (error) {
      console.error('Erro na transação Cielo:', error);
      throw error;
    }
  }

  /**
   * Cria uma recorrência (assinatura)
   */
  async createRecurrentPayment(data) {
    const recurrent = {
      MerchantOrderId: data.orderId,
      Customer: {
        Name: data.customerName,
        Email: data.customerEmail,
        Identity: data.customerCpf,
        IdentityType: 'CPF'
      },
      Payment: {
        Type: 'CreditCard',
        Amount: Math.round(data.amount * 100),
        Installments: 1,
        SoftDescriptor: 'MaisVidaNossaVida',
        RecurrentPayment: {
          AuthorizeNow: true,
          StartDate: data.startDate, // YYYY-MM-DD
          EndDate: data.endDate, // YYYY-MM-DD (opcional)
          Interval: 'Monthly', // Monthly, Bimonthly, Quarterly, SemiAnnual, Annual
        },
        CreditCard: {
          CardNumber: data.cardNumber,
          Holder: data.cardHolder,
          ExpirationDate: data.expirationDate,
          SecurityCode: data.cvv,
          Brand: data.cardBrand
        }
      }
    };

    try {
      const response = await cielo.creditCard.recurrentPayment(recurrent);
      return {
        success: response.Payment.Status === 2,
        transactionId: response.Payment.PaymentId,
        recurrentPaymentId: response.Payment.RecurrentPayment.RecurrentPaymentId,
        status: response.Payment.Status
      };
    } catch (error) {
      console.error('Erro ao criar recorrência Cielo:', error);
      throw error;
    }
  }

  /**
   * Consulta status de uma transação
   */
  async checkTransactionStatus(paymentId) {
    try {
      const response = await cielo.consulting.sale(paymentId);
      return {
        status: response.Payment.Status,
        amount: response.Payment.Amount / 100,
        returnCode: response.Payment.ReturnCode,
        returnMessage: response.Payment.ReturnMessage
      };
    } catch (error) {
      console.error('Erro ao consultar transação:', error);
      throw error;
    }
  }

  /**
   * Cancela uma transação
   */
  async cancelTransaction(paymentId, amount = null) {
    try {
      const response = await cielo.creditCard.cancelTransaction(
        paymentId,
        amount ? Math.round(amount * 100) : null
      );
      return {
        success: response.Status === 10 || response.Status === 11, // 10=Cancelada, 11=Estornada
        status: response.Status
      };
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
      throw error;
    }
  }

  /**
   * Cancela uma recorrência
   */
  async cancelRecurrence(recurrentPaymentId) {
    try {
      await cielo.recurrentPayments.deactivate(recurrentPaymentId);
      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar recorrência:', error);
      throw error;
    }
  }
}

export default new CieloService();
```

### 4. Criar Controller de Pagamento Cielo

Criar arquivo `controllers/cieloController.js`:

```javascript
import cieloService from '../services/cieloService.js';
import nfeService from '../services/nfeService.js'; // Veremos a seguir

export const createPayment = async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerCpf,
      customerPhone,
      amount,
      cardNumber,
      cardHolder,
      expirationDate,
      cvv,
      cardBrand,
      installments
    } = req.body;

    // Criar transação na Cielo
    const result = await cieloService.createCreditCardTransaction({
      orderId,
      customerName,
      customerEmail,
      customerCpf,
      customerPhone,
      amount,
      cardNumber,
      cardHolder,
      expirationDate,
      cvv,
      cardBrand,
      installments
    });

    if (result.success) {
      // Pagamento aprovado - emitir nota fiscal
      try {
        const nfe = await nfeService.emitirNota({
          customerName,
          customerEmail,
          customerCpf,
          amount,
          description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
          transactionId: result.transactionId
        });

        return res.json({
          success: true,
          transactionId: result.transactionId,
          authorizationCode: result.authorizationCode,
          nfe: {
            numero: nfe.numero,
            chave: nfe.chave,
            pdf: nfe.urlPdf,
            xml: nfe.urlXml
          }
        });
      } catch (nfeError) {
        console.error('Erro ao emitir NF-e:', nfeError);
        // Pagamento foi aprovado, mas NF-e falhou
        // Pode reprocessar depois
        return res.json({
          success: true,
          transactionId: result.transactionId,
          authorizationCode: result.authorizationCode,
          nfe: { error: 'Erro ao emitir nota fiscal' }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: result.returnMessage,
        code: result.returnCode
      });
    }
  } catch (error) {
    console.error('Erro no pagamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar pagamento'
    });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerCpf,
      amount,
      cardNumber,
      cardHolder,
      expirationDate,
      cvv,
      cardBrand,
      startDate
    } = req.body;

    const result = await cieloService.createRecurrentPayment({
      orderId,
      customerName,
      customerEmail,
      customerCpf,
      amount,
      cardNumber,
      cardHolder,
      expirationDate,
      cvv,
      cardBrand,
      startDate
    });

    if (result.success) {
      return res.json({
        success: true,
        transactionId: result.transactionId,
        recurrentPaymentId: result.recurrentPaymentId,
        message: 'Assinatura criada com sucesso'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao criar assinatura'
      });
    }
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar assinatura'
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { recurrentPaymentId } = req.params;
    
    const result = await cieloService.cancelRecurrence(recurrentPaymentId);
    
    return res.json({
      success: result.success,
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar assinatura'
    });
  }
};

export const checkStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const result = await cieloService.checkTransactionStatus(paymentId);
    
    return res.json(result);
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar status'
    });
  }
};

export const webhook = async (req, res) => {
  try {
    // Cielo envia notificações POST sobre mudanças de status
    const { PaymentId, ChangeType } = req.body;
    
    console.log('Webhook Cielo recebido:', { PaymentId, ChangeType });
    
    // ChangeType pode ser:
    // 1 = RecurrenceCreated
    // 2 = RecurrenceUpdated
    // 3 = RecurrenceDisabled
    // 4 = RecurrenceFinished
    
    // Processar a notificação
    // Atualizar status no banco de dados
    // Emitir nota fiscal se necessário
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).send('Error');
  }
};
```

### 5. Criar Rotas Cielo

Criar arquivo `routes/cielo.js`:

```javascript
import express from 'express';
import * as cieloController from '../controllers/cieloController.js';

const router = express.Router();

// Criar pagamento único
router.post('/payment', cieloController.createPayment);

// Criar assinatura recorrente
router.post('/subscription', cieloController.createSubscription);

// Cancelar assinatura
router.delete('/subscription/:recurrentPaymentId', cieloController.cancelSubscription);

// Consultar status de pagamento
router.get('/status/:paymentId', cieloController.checkStatus);

// Webhook para notificações da Cielo
router.post('/webhook', cieloController.webhook);

export default router;
```

### 6. Registrar Rotas no `index.js`

```javascript
import cieloRoutes from './routes/cielo.js';

// ... outras configurações

app.use('/cielo', cieloRoutes);
```

---

## 💻 Implementação Técnica - App Flutter

### 1. Atualizar `payment_service.dart`

```dart
/// Cria pagamento com Cielo
static Future<Map<String, dynamic>> createCieloPayment({
  required double amount,
  required String customerName,
  required String customerEmail,
  required String customerCpf,
  required String customerPhone,
  required String cardNumber,
  required String cardHolder,
  required String expirationDate,
  required String cvv,
  required String cardBrand,
  int installments = 1,
}) async {
  final startTime = DateTime.now();
  appLogger.logPayment('Cielo', amount, 'iniciado');

  try {
    final deviceId = await DeviceService.getDeviceId();
    final orderId = 'order_${DateTime.now().millisecondsSinceEpoch}';

    final response = await http.post(
      Uri.parse('$_baseUrl/cielo/payment'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'orderId': orderId,
        'customerName': customerName,
        'customerEmail': customerEmail,
        'customerCpf': customerCpf,
        'customerPhone': customerPhone,
        'amount': amount,
        'cardNumber': cardNumber,
        'cardHolder': cardHolder,
        'expirationDate': expirationDate,
        'cvv': cvv,
        'cardBrand': cardBrand,
        'installments': installments,
        'deviceId': deviceId,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final duration = DateTime.now().difference(startTime);

      appLogger.logPayment('Cielo', amount, 'sucesso', data: {
        'transactionId': data['transactionId'],
        'hasNfe': data['nfe'] != null,
      });

      appLogger.logPerformance('Pagamento Cielo', duration);

      return {
        'success': true,
        'transactionId': data['transactionId'],
        'authorizationCode': data['authorizationCode'],
        'nfe': data['nfe'],
      };
    } else {
      final data = jsonDecode(response.body);
      appLogger.logPayment('Cielo', amount, 'erro', data: {
        'statusCode': response.statusCode,
        'message': data['message'],
      });

      return {
        'success': false,
        'error': data['message'] ?? 'Erro ao processar pagamento',
      };
    }
  } catch (e, stackTrace) {
    appLogger.error(
      'Erro ao criar pagamento Cielo: $e',
      error: e,
      stackTrace: stackTrace,
      data: {'amount': amount},
    );

    return {
      'success': false,
      'error': 'Erro de conexão: $e',
    };
  }
}

/// Cria assinatura recorrente com Cielo
static Future<Map<String, dynamic>> createCieloSubscription({
  required double amount,
  required String customerName,
  required String customerEmail,
  required String customerCpf,
  required String cardNumber,
  required String cardHolder,
  required String expirationDate,
  required String cvv,
  required String cardBrand,
}) async {
  // Implementação similar à createCieloPayment
  // mas chamando endpoint /cielo/subscription
}
```

### 2. Criar Widget de Formulário de Cartão

Criar arquivo `lib/widgets/credit_card_form.dart` para capturar dados do cartão de forma segura.

---

## 📄 Emissão de Nota Fiscal

### Provedores Recomendados

#### 1. **Focus NFe** (Mais Recomendado)

**Vantagens**:
- API REST simples e bem documentada
- Suporte a NF-e, NFS-e, NFC-e
- Ambiente sandbox gratuito
- Dashboard administrativo completo
- Suporte técnico responsivo

**Planos**:
- **Starter**: R$ 39/mês - até 100 notas
- **Business**: R$ 79/mês - até 500 notas
- **Enterprise**: R$ 149/mês - até 2000 notas

**Como Contratar**:
1. Acesse: https://focusnfe.com.br
2. Cadastre-se e escolha o plano
3. Configure certificado digital A1
4. Obtenha token de API

#### 2. **NFe.io**

**Vantagens**:
- Especializado em NF-e
- API REST moderna
- Pay-as-you-go (paga por nota)

**Custos**:
- R$ 0,25 por NF-e emitida
- Sem mensalidade

**Como Contratar**:
1. Acesse: https://nfe.io
2. Cadastre-se
3. Configure certificado digital
4. Obtenha API key

#### 3. **Tiny ERP**

**Vantagens**:
- Sistema completo de gestão
- Controle de estoque, pedidos, etc.
- API de automação

**Custos**:
- Plano Light: R$ 39/mês
- Plano Pro: R$ 99/mês

### Certificado Digital A1

**O que é?**
Certificado digital necessário para assinar eletronicamente as notas fiscais.

**Como Obter**:
1. Adquira de uma Autoridade Certificadora (AC):
   - Serasa
   - Certisign
   - Valid
   - Soluti
2. **Custo**: R$ 150-250/ano
3. **Tipos**:
   - **e-CPF**: Para empresas sem funcionários
   - **e-CNPJ**: Para empresas (recomendado)
4. **Formato A1**: Arquivo digital (.pfx) - ideal para APIs

**Processo**:
1. Escolha AC e compre online
2. Valide documentos e faça videoconferência
3. Receba certificado por e-mail (.pfx)
4. Instale em seu servidor/sistema

---

## 💻 Implementação NF-e - Backend

### 1. Instalar Cliente Focus NFe

```bash
npm install axios --save
```

### 2. Configurar Variáveis de Ambiente

Adicionar ao `.env`:

```env
# Focus NFe
FOCUS_NFE_TOKEN=seu-token-aqui
FOCUS_NFE_ENVIRONMENT=homologacao  # ou 'producao'

# Dados da Empresa
EMPRESA_CNPJ=00.000.000/0000-00
EMPRESA_RAZAO_SOCIAL=Sua Empresa LTDA
EMPRESA_NOME_FANTASIA=Sua Empresa
EMPRESA_INSCRICAO_ESTADUAL=000000000
EMPRESA_REGIME_TRIBUTARIO=1  # 1=Simples Nacional, 3=Normal
EMPRESA_LOGRADOURO=Rua Exemplo
EMPRESA_NUMERO=123
EMPRESA_BAIRRO=Centro
EMPRESA_MUNICIPIO=São Paulo
EMPRESA_UF=SP
EMPRESA_CEP=00000-000
EMPRESA_TELEFONE=(11) 0000-0000
EMPRESA_EMAIL=contato@suaempresa.com
```

### 3. Criar Serviço de NF-e

Criar arquivo `services/nfeService.js`:

```javascript
import axios from 'axios';

const FOCUS_API_URL = process.env.FOCUS_NFE_ENVIRONMENT === 'producao'
  ? 'https://api.focusnfe.com.br'
  : 'https://homologacao.focusnfe.com.br';

class NFeService {
  constructor() {
    this.client = axios.create({
      baseURL: FOCUS_API_URL,
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.FOCUS_NFE_TOKEN + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Emite uma NF-e de serviço (assinatura digital)
   */
  async emitirNota(dados) {
    const {
      customerName,
      customerEmail,
      customerCpf,
      amount,
      description,
      transactionId
    } = dados;

    // Referência única para a nota
    const ref = `nfe_${transactionId}_${Date.now()}`;

    const nfeData = {
      // Natureza da operação
      natureza_operacao: 'Venda de serviço',
      
      // Tipo de documento: 1 = Saída
      tipo_documento: '1',
      
      // Finalidade: 1 = Normal
      finalidade_emissao: '1',
      
      // Cliente
      cliente: {
        nome_completo: customerName,
        cpf: customerCpf.replace(/\D/g, ''),
        email: customerEmail,
        indicador_inscricao_estadual: '9', // 9 = Não contribuinte
      },
      
      // Itens (serviços)
      itens: [
        {
          numero_item: '1',
          codigo_produto: 'ASSINATURA-MENSAL',
          descricao: description,
          cfop: '5933', // Prestação de serviço tributado pelo ISSQN
          unidade_comercial: 'UN',
          quantidade_comercial: 1,
          valor_unitario_comercial: amount.toFixed(2),
          valor_bruto: amount.toFixed(2),
          
          // Impostos
          icms_situacao_tributaria: '400', // Não tributado pelo ICMS
          pis_situacao_tributaria: '49', // Outras operações de saída
          cofins_situacao_tributaria: '49',
        }
      ],
      
      // Forma de pagamento
      formas_pagamento: [
        {
          forma_pagamento: '03', // Cartão de crédito
          valor_pagamento: amount.toFixed(2),
        }
      ],
    };

    try {
      // Autoriza a NF-e
      const response = await this.client.post(`/v2/nfe?ref=${ref}`, nfeData);
      
      if (response.data.status === 'autorizado') {
        // Baixa PDF e XML
        const pdfUrl = `${FOCUS_API_URL}/v2/nfe/${ref}.pdf`;
        const xmlUrl = `${FOCUS_API_URL}/v2/nfe/${ref}.xml`;
        
        // Envia e-mail com a nota (opcional, Focus faz automaticamente)
        await this.enviarEmail(ref, customerEmail);
        
        return {
          success: true,
          numero: response.data.numero,
          serie: response.data.serie,
          chave: response.data.chave_nfe,
          urlPdf: pdfUrl,
          urlXml: xmlUrl,
          protocolo: response.data.protocolo,
        };
      } else {
        console.error('Erro ao autorizar NF-e:', response.data);
        throw new Error(response.data.mensagem_sefaz || 'Erro ao emitir nota');
      }
    } catch (error) {
      console.error('Erro ao emitir NF-e:', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Consulta status de uma NF-e
   */
  async consultarNota(ref) {
    try {
      const response = await this.client.get(`/v2/nfe/${ref}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar NF-e:', error);
      throw error;
    }
  }

  /**
   * Cancela uma NF-e (até 24h após emissão)
   */
  async cancelarNota(ref, justificativa) {
    try {
      const response = await this.client.delete(`/v2/nfe/${ref}`, {
        data: {
          justificativa: justificativa // Mínimo 15 caracteres
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar NF-e:', error);
      throw error;
    }
  }

  /**
   * Envia e-mail com a NF-e
   */
  async enviarEmail(ref, email) {
    try {
      await this.client.post(`/v2/nfe/${ref}/email`, {
        emails: [email]
      });
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar e-mail NF-e:', error);
      // Não lança erro, pois não é crítico
      return { success: false };
    }
  }
}

export default new NFeService();
```

### 4. Integrar com Controller Cielo

No `cieloController.js`, após pagamento aprovado:

```javascript
// Após sucesso no pagamento
if (result.success) {
  try {
    const nfe = await nfeService.emitirNota({
      customerName,
      customerEmail,
      customerCpf,
      amount,
      description: 'Assinatura Mensal - Mais Vida em Nossas Vidas',
      transactionId: result.transactionId
    });
    
    // Retorna dados do pagamento + NF-e
    return res.json({
      success: true,
      payment: result,
      nfe: nfe
    });
  } catch (nfeError) {
    // Pagamento OK, mas NF-e falhou
    // Pode reprocessar depois via job assíncrono
  }
}
```

---

## 🔄 Fluxo Completo

### Cenário 1: Pagamento Único

```
1. Usuário escolhe plano
2. Preenche formulário de cartão no app
3. App envia dados para backend
4. Backend processa com Cielo API
5. Cielo autoriza pagamento
6. Backend emite NF-e via Focus
7. Focus envia NF-e por e-mail ao cliente
8. Backend retorna sucesso ao app
9. App ativa assinatura localmente
```

### Cenário 2: Assinatura Recorrente

```
1. Usuário assina plano mensal
2. Backend cria recorrência na Cielo
3. Todo mês, Cielo cobra automaticamente
4. Cielo envia webhook ao backend
5. Backend emite NF-e automaticamente
6. Cliente recebe nota por e-mail
7. Sistema renova acesso no app
```

### Cenário 3: Cancelamento

```
1. Usuário cancela assinatura
2. App notifica backend
3. Backend cancela recorrência na Cielo
4. Não há mais cobranças futuras
5. Acesso expira na data de vencimento
```

---

## 💰 Custos Estimados

### Taxas Cielo

**Cartão de Crédito**:
- À vista: 2,99% a 4,99% por transação
- Parcelado: 3,99% a 6,99% por transação

**Recorrência**:
- Taxa reduzida: ~2,49% por transação
- Sem taxa de setup

**Outras Taxas**:
- Antecipação: 1,99% a 3,99% ao mês
- Chargeback: R$ 20,00 por ocorrência

### Custos de NF-e

**Focus NFe**:
- Plano Starter: R$ 39/mês (até 100 notas)
- Cada nota adicional: R$ 0,50

**Certificado Digital**:
- e-CNPJ A1: R$ 150-250/ano

**Contador** (opcional para configurações):
- Consultoria: R$ 200-500 (uma vez)

### Exemplo de Custo Mensal

Cenário: 200 assinaturas de R$ 29,90/mês

- **Receita bruta**: R$ 5.980,00
- **Taxa Cielo (2,99%)**: -R$ 178,74
- **Focus NFe**: -R$ 39,00 (plano) + R$ 50,00 (100 extras) = -R$ 89,00
- **Certificado digital** (mensal): -R$ 16,67
- **Receita líquida**: R$ 5.695,59

**Custo por transação**: ~R$ 1,42 (4,75% do valor)

---

## ✅ Checklist de Implementação

### Fase 1: Preparação (1-2 semanas)

- [ ] Abrir conta Cielo (aguardar aprovação)
- [ ] Contratar certificado digital e-CNPJ A1
- [ ] Contratar Focus NFe (ou outro provedor)
- [ ] Configurar empresa no Focus (CNPJ, endereço, etc.)
- [ ] Obter credenciais sandbox Cielo
- [ ] Obter token sandbox Focus NFe

### Fase 2: Desenvolvimento Backend (1 semana)

- [ ] Instalar dependências (cielo, axios)
- [ ] Criar `services/cieloService.js`
- [ ] Criar `services/nfeService.js`
- [ ] Criar `controllers/cieloController.js`
- [ ] Criar `routes/cielo.js`
- [ ] Configurar variáveis de ambiente
- [ ] Implementar webhook Cielo
- [ ] Testar em sandbox

### Fase 3: Desenvolvimento Flutter (1 semana)

- [ ] Atualizar `payment_service.dart`
- [ ] Criar widget de formulário de cartão
- [ ] Implementar validação de dados de cartão
- [ ] Adicionar loading states
- [ ] Implementar tratamento de erros
- [ ] Adicionar logs de transações
- [ ] Testar integração end-to-end

### Fase 4: Testes (1 semana)

- [ ] Testar pagamentos de teste Cielo
- [ ] Testar recorrência
- [ ] Testar cancelamentos
- [ ] Testar emissão de NF-e em homologação
- [ ] Validar XMLs gerados
- [ ] Testar fluxo completo app → backend → Cielo → Focus
- [ ] Testar webhook de recorrência
- [ ] Corrigir bugs encontrados

### Fase 5: Produção (1 semana)

- [ ] Obter credenciais produção Cielo
- [ ] Obter token produção Focus NFe
- [ ] Configurar certificado digital em produção
- [ ] Atualizar variáveis de ambiente para produção
- [ ] Deploy backend em servidor seguro (HTTPS obrigatório)
- [ ] Configurar URLs de webhook em produção
- [ ] Fazer testes finais com valores reais pequenos
- [ ] Monitorar primeiras transações

### Fase 6: Pós-Produção

- [ ] Documentar processos de suporte
- [ ] Configurar alertas de erro
- [ ] Implementar dashboard de transações
- [ ] Treinar equipe de suporte
- [ ] Configurar backup de dados
- [ ] Planejar auditoria mensal de NF-e
- [ ] Implementar relatório fiscal mensal

---

## 📚 Documentação Oficial

- **Cielo E-commerce**: https://developercielo.github.io/manual/cielo-ecommerce
- **Focus NFe**: https://focusnfe.com.br/doc/
- **NFe.io**: https://nfe.io/docs
- **Certificados Digitais**: https://www.iti.gov.br/
- **Nota Fiscal Paulista**: https://www.nfp.fazenda.sp.gov.br/

---

## ⚠️ Considerações Importantes

### Segurança

1. **Nunca armazene dados de cartão completos**
   - Use tokenização da Cielo
   - Armazene apenas últimos 4 dígitos (para exibição)

2. **HTTPS obrigatório**
   - Backend deve ter certificado SSL válido
   - Webhook URLs devem ser HTTPS

3. **Validação de dados**
   - Valide CPF/CNPJ antes de enviar
   - Valide número de cartão (algoritmo de Luhn)
   - Valide data de validade

4. **PCI-DSS Compliance**
   - Siga guidelines da Cielo
   - Não logue dados sensíveis
   - Use ambiente isolado para processar cartões

### Fiscal

1. **Regime tributário**
   - Configure corretamente no Focus NFe
   - Simples Nacional tem alíquotas diferentes

2. **CFOP correto**
   - Serviços digitais: 5933 (dentro do estado) ou 6933 (fora do estado)
   - Consulte contador

3. **ISSQN**
   - Tributo municipal sobre serviços
   - Alíquota varia por cidade (2% a 5%)
   - Configure no Focus NFe

4. **Backup de XMLs**
   - Guarde XMLs por 5 anos (obrigatório)
   - Focus NFe mantém, mas faça backup próprio

### Operacional

1. **Monitoramento**
   - Configure alertas para falhas de pagamento
   - Configure alertas para falhas de NF-e
   - Monitore taxa de recusa de cartões

2. **Suporte**
   - Tenha processo para reemissão de NF-e
   - Tenha processo para estornos
   - Tenha FAQ sobre pagamentos

3. **Reconciliação**
   - Faça reconciliação diária de transações
   - Compare Cielo vs banco de dados
   - Compare NF-e emitidas vs pagamentos

---

## 🆘 Suporte

### Cielo
- **Suporte Técnico**: 4002-5472 (capitais) / 0800-570-8472
- **E-mail**: cieloecommerce@cielo.com.br
- **Documentação**: https://developercielo.github.io

### Focus NFe
- **Suporte**: suporte@acras.com.br
- **WhatsApp**: (19) 99769-6600
- **Documentação**: https://focusnfe.com.br/doc/

### Certificado Digital
- **Serasa**: 0800 773 7272
- **Certisign**: 0800 771 9555
- **Valid**: 0800 979 2000

---

## 📝 Notas Finais

Esta integração requer:
- **Conhecimento técnico**: Médio a avançado
- **Tempo estimado**: 4-6 semanas (incluindo aprovações)
- **Investimento inicial**: R$ 500-1000 (certificado + testes)
- **Investimento mensal**: R$ 40-150 (dependendo do volume)

**Recomendação**: Comece com ambiente sandbox, teste exaustivamente antes de produção, e considere contratar consultoria especializada para a configuração fiscal inicial.

---

**Documento criado em**: 18/11/2025  
**Versão**: 1.0  
**Projeto**: Mais Vida em Nossas Vidas
