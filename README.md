# 🚀 Backend - Sistema de Pagamentos

Backend Node.js para processar pagamentos via **PIX** e **Cartão de Crédito**.

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

### 1. Configurar Contas de Pagamento

📖 **Leia o guia completo**: [CONFIGURACAO_CONTAS.md](./CONFIGURACAO_CONTAS.md)

Este guia explica passo a passo como:
- Criar conta no Stripe e adicionar sua conta bancária
- Escolher e configurar provedor PIX (Mercado Pago, Asaas ou Efi)
- Cadastrar sua chave PIX no banco
- Obter todas as credenciais necessárias

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env
```

**Mínimo necessário:**
```env
# STRIPE (para cartão)
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui

# PIX (escolha um provedor)
PIX_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui

# Sua chave PIX
PIX_KEY=seu-email@exemplo.com.br
PIX_RECEIVER_NAME=Seu Nome
```

## 🚀 Executar

### Desenvolvimento
```bash
npm start
```

O servidor rodará em: `http://localhost:3000`

### Produção
```bash
NODE_ENV=production npm start
```

## 📡 API Endpoints

### PIX
- `POST /pix/gerar` - Gera pagamento PIX
  ```json
  {
    "valor": 499,
    "deviceId": "abc123"
  }
  ```

### Stripe (Cartão)
- `POST /pagamento/criar-intent` - Cria Payment Intent
  ```json
  {
    "valor": 499,
    "deviceId": "abc123"
  }
  ```

### Assinaturas
- `POST /subscription/activate` - Ativa assinatura
- `POST /subscription/validate` - Valida assinatura
- `GET /subscription/info/:deviceId` - Info da assinatura

### Health Check
- `GET /health` - Status do servidor

## 🔒 Segurança

- Helmet.js para headers seguros
- Rate limiting para prevenir abuso
- CORS configurável
- Validação de inputs
- Variáveis de ambiente para credenciais

## 🧪 Testar

### Testar PIX (modo mock)
Sem configurar provedor, o sistema gera QR Codes de teste.

### Testar Stripe
Use cartões de teste:
- **Número**: 4242 4242 4242 4242
- **Data**: Qualquer futura
- **CVV**: Qualquer 3 dígitos

## 📊 Monitoramento

### Logs
O servidor imprime logs de:
- ✅ Pagamentos gerados
- ✅ Assinaturas ativadas
- ❌ Erros e exceções

### Dashboards
Acompanhe suas transações:
- **Stripe**: https://dashboard.stripe.com/
- **Mercado Pago**: https://www.mercadopago.com.br/
- **Asaas**: https://www.asaas.com/
- **Efi**: https://sejaefi.com.br/

## 🌐 Deploy

### Opções gratuitas com HTTPS:
- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **Heroku**: https://heroku.com/

### Configurar no deploy:
1. Configure as variáveis de ambiente
2. Atualize `CORS_ORIGIN` com o domínio do app
3. Use chaves de produção (sk_live_, APP_USR-prod-, etc.)
4. Configure webhook do Stripe (se usar)

## 📁 Estrutura

```
meu_backend_node/
├── config/
│   └── database.js          # Conexão MongoDB
├── controllers/
│   ├── pixController.js     # Lógica PIX (3 provedores)
│   ├── stripeController.js  # Lógica Stripe
│   └── subscriptionController.js
├── models/
│   └── Subscription.js      # Modelo de assinatura
├── routes/
│   ├── pix.js
│   ├── stripe.js
│   └── subscription.js
├── middleware/
│   └── auth.js              # Rate limiting
├── .env                     # Credenciais (não commitar!)
├── .env.example             # Template
├── index.js                 # Servidor Express
├── package.json
├── CONFIGURACAO_CONTAS.md   # Guia completo
└── README.md                # Este arquivo
```

## 💰 Taxas dos Provedores

### Stripe (Cartão)
- Taxa: ~3,99% + R$ 0,39/transação
- Repasse: Automático em 2-7 dias úteis

### Mercado Pago (PIX)
- Taxa: 3,99%
- Recebimento: Instantâneo (saldo MP)
- Transferência banco: D+1 (grátis)

### Asaas (PIX)
- Taxa: 1,99%
- Recebimento: D+1
- Sem mensalidade

### Efi (PIX)
- Taxa: 0,99% a 1,99%
- Recebimento: D+1
- Mensalidade: A partir de R$ 39,90

## 🐛 Troubleshooting

### "Stripe não configurado"
→ Configure `STRIPE_SECRET_KEY` no `.env`

### "Erro ao gerar PIX"
→ Verifique se escolheu um provedor e configurou as credenciais

### "Conexão recusada"
→ Inicie o MongoDB: `mongod`

### "CORS error"
→ Configure `CORS_ORIGIN` com o domínio do app

## 📚 Documentação dos Provedores

- **Stripe**: https://stripe.com/docs
- **Mercado Pago**: https://www.mercadopago.com.br/developers/pt
- **Asaas**: https://docs.asaas.com/
- **Efi**: https://dev.efipay.com.br/

## 🆘 Suporte

Problemas? Consulte:
1. [CONFIGURACAO_CONTAS.md](./CONFIGURACAO_CONTAS.md) - Guia completo
2. Documentação do provedor
3. Logs do servidor
4. Suporte do provedor (contatos no guia)

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB rodando
- [ ] Chaves de produção (não de teste)
- [ ] HTTPS configurado
- [ ] CORS configurado corretamente
- [ ] Conta bancária adicionada no Stripe
- [ ] Chave PIX cadastrada
- [ ] Webhooks configurados (opcional)
- [ ] Testado em modo produção
- [ ] Monitoramento ativo

---

**Pronto para receber pagamentos! 💚💰**
