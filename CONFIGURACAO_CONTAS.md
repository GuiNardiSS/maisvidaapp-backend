# 💰 Guia de Configuração de Contas de Pagamento

## 📋 Visão Geral

Este guia explica como configurar suas contas bancárias para receber pagamentos via **PIX** e **Cartão de Crédito**.

---

## 💳 CARTÃO DE CRÉDITO (Stripe)

### Passo 1: Criar Conta no Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Preencha seus dados:
   - Email
   - Nome completo
   - País: **Brasil**
   - Senha

3. Confirme seu email

### Passo 2: Completar Cadastro da Empresa

1. No Dashboard, vá em **Settings** (Configurações)
2. Preencha:
   - **Business details**: Nome da empresa ou seu nome
   - **Business type**: Individual ou Company
   - **CPF/CNPJ**
   - **Endereço**

### Passo 3: Adicionar Conta Bancária

1. Vá em: **Settings > Payouts** (Configurações > Repasses)
2. Clique em **Add bank account** (Adicionar conta bancária)
3. Preencha:
   - **Nome do banco**: Ex: Banco do Brasil, Itaú, Nubank, etc.
   - **Agência**: Número da agência (sem dígito)
   - **Conta**: Número da conta (com dígito)
   - **Tipo de conta**: Corrente ou Poupança
   - **CPF/CNPJ do titular**

4. Confirme os dados
5. **PRONTO!** O Stripe depositará automaticamente os pagamentos nesta conta

### Passo 4: Obter a Chave de API

1. Vá em: **Developers > API keys**
2. Você verá duas chaves:
   - **Publishable key** (pk_test_...) - Não é necessária no backend
   - **Secret key** (sk_test_...) - **COPIE ESTA!**

3. Cole no arquivo `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_AQUI
   ```

### Passo 5: Ativar Modo Produção (Quando estiver pronto)

1. No canto superior esquerdo, mude de **Test mode** para **Live mode**
2. Vá novamente em **Developers > API keys**
3. Copie a nova **Secret key** (agora começa com `sk_live_`)
4. Atualize o `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_live_SUA_CHAVE_REAL
   ```

### 📊 Como Funciona o Repasse

- **Frequência**: Automática a cada 2-7 dias úteis
- **Taxa do Stripe**: ~3,99% + R$ 0,39 por transação
- **Moeda**: Real (BRL)
- **Recebimento**: Diretamente na conta bancária cadastrada

### 🔔 Configurar Webhooks (Opcional - Recomendado)

Para receber notificações automáticas de pagamentos:

1. Vá em: **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/pagamento/webhook`
4. Eventos: Selecione `payment_intent.succeeded`
5. Copie o **Signing secret** (whsec_...)
6. Adicione no `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET
   ```

---

## 💚 PIX (3 Opções Principais)

Você pode escolher entre 3 provedores de pagamento PIX. Todos depositam diretamente na sua conta.

### Opção 1: MERCADO PAGO (Recomendado para Iniciantes)

#### Passo 1: Criar Conta

1. Acesse: https://www.mercadopago.com.br/
2. Clique em **Criar conta**
3. Preencha seus dados e confirme o email

#### Passo 2: Adicionar Conta Bancária

1. No app Mercado Pago, vá em **Perfil**
2. **Transferir dinheiro > Conta bancária**
3. Adicione sua conta:
   - Banco
   - Agência
   - Conta (com dígito)
   - CPF/CNPJ

#### Passo 3: Obter Token de Acesso

1. Acesse: https://www.mercadopago.com.br/developers
2. Vá em **Suas aplicações**
3. Clique em **Criar aplicação**
4. Preencha:
   - Nome: "Mais Vida App"
   - Produto: Checkout Pro
   - Integração: PIX
5. Após criar, copie o **Access Token** (começa com `APP_USR-`)
6. Cole no `.env`:
   ```env
   PIX_PROVIDER=mercadopago
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-SEU_TOKEN_AQUI
   ```

#### Taxas e Prazos
- **Taxa**: 3,99% por transação
- **Recebimento**: Instantâneo (fica no saldo do Mercado Pago)
- **Transferência para banco**: D+1 (dia seguinte) - GRÁTIS

---

### Opção 2: ASAAS (Ótimo para Pequenos Negócios)

#### Passo 1: Criar Conta

1. Acesse: https://www.asaas.com/
2. Clique em **Criar conta grátis**
3. Preencha:
   - Nome/Empresa
   - CPF/CNPJ
   - Email e Telefone
4. Confirme seu email

#### Passo 2: Completar Cadastro

1. Faça login no painel
2. Complete o cadastro:
   - Dados pessoais/empresa
   - Endereço
   - Dados bancários

#### Passo 3: Adicionar Conta Bancária

1. Vá em **Configurações > Conta bancária**
2. Adicione sua conta:
   - Banco
   - Agência
   - Conta
   - Tipo (Corrente/Poupança)

#### Passo 4: Obter API Key

1. Vá em **Integrações > API Key**
2. Clique em **Gerar nova API Key**
3. Copie a chave (começa com `$aact_`)
4. Cole no `.env`:
   ```env
   PIX_PROVIDER=asaas
   ASAAS_API_KEY=SUA_API_KEY_AQUI
   ```

#### Taxas e Prazos
- **Taxa**: 1,99% por transação PIX
- **Recebimento**: D+1 (dia seguinte)
- **Sem mensalidade**

---

### Opção 3: EFI (antigo Gerencianet) - Profissional

#### Passo 1: Criar Conta

1. Acesse: https://sejaefi.com.br/
2. Clique em **Criar conta**
3. Preencha o cadastro completo

#### Passo 2: Configurar Conta

1. Adicione sua conta bancária
2. Passe pela verificação de documentos
3. Aguarde aprovação (1-3 dias úteis)

#### Passo 3: Gerar Credenciais

1. Vá em **API > Minhas Aplicações**
2. Clique em **Criar nova aplicação**
3. Configure:
   - Nome: "Mais Vida App"
   - Produto: PIX
4. Copie:
   - **Client ID**
   - **Client Secret**
5. Baixe o **Certificado** (.p12)
6. Coloque o certificado na pasta do backend
7. Configure o `.env`:
   ```env
   PIX_PROVIDER=efi
   EFI_CLIENT_ID=SEU_CLIENT_ID
   EFI_CLIENT_SECRET=SEU_CLIENT_SECRET
   EFI_CERTIFICATE_PATH=./certificado-producao.p12
   PIX_KEY=sua-chave-pix@email.com
   ```

#### Taxas e Prazos
- **Taxa**: 0,99% a 1,99% (depende do volume)
- **Recebimento**: D+1
- **Mensalidade**: Planos a partir de R$ 39,90/mês

---

## 🔑 Configurar sua Chave PIX

Independente do provedor, você precisa cadastrar uma chave PIX para receber. Faça isso no app do seu banco:

1. Abra o app do seu banco
2. Procure por **PIX > Minhas chaves**
3. Cadastre uma chave (escolha uma):
   - ✉️ **Email**: seu-email@exemplo.com
   - 📱 **Telefone**: +5511999999999
   - 📄 **CPF/CNPJ**: 12345678900
   - 🎲 **Chave aleatória**: gerada pelo banco

4. Após cadastrar, adicione no `.env`:
   ```env
   PIX_KEY=sua-chave@email.com
   PIX_KEY_TYPE=email
   PIX_RECEIVER_NAME=Seu Nome ou Empresa
   PIX_RECEIVER_DOCUMENT=12345678900
   PIX_RECEIVER_CITY=Sao Paulo
   ```

---

## ⚙️ Configuração Final do .env

Exemplo completo (escolha apenas um provedor PIX):

```env
# STRIPE (Cartão)
STRIPE_SECRET_KEY=sk_test_51KxYz...

# MERCADO PAGO (Opção 1)
PIX_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-123456...

# OU ASAAS (Opção 2)
# PIX_PROVIDER=asaas
# ASAAS_API_KEY=$aact_123456...

# OU EFI (Opção 3)
# PIX_PROVIDER=efi
# EFI_CLIENT_ID=Client_Id_123
# EFI_CLIENT_SECRET=Client_Secret_456
# EFI_CERTIFICATE_PATH=./certificado.p12

# Sua Chave PIX
PIX_KEY=contato@maisvidaapp.com.br
PIX_KEY_TYPE=email
PIX_RECEIVER_NAME=Mais Vida em Nossas Vidas
PIX_RECEIVER_DOCUMENT=12345678900
PIX_RECEIVER_CITY=Sao Paulo

# Outras configurações
PORT=3000
MONGODB_URI=mongodb://localhost:27017/maisvidaapp
NODE_ENV=development
```

---

## 🧪 Testar os Pagamentos

### Modo Teste (Sem dinheiro real)

1. Use as chaves de teste (sk_test_, APP_USR-test-, etc.)
2. Inicie o backend:
   ```bash
   cd meu_backend_node
   npm start
   ```
3. Execute o app Flutter:
   ```bash
   flutter run
   ```
4. Tente fazer um pagamento de teste

### Cartão de Teste (Stripe)

Use estes números de cartão para teste:
- **Número**: 4242 4242 4242 4242
- **Data**: Qualquer data futura (ex: 12/28)
- **CVV**: Qualquer 3 dígitos (ex: 123)
- **Nome**: Qualquer nome

### PIX de Teste

Em modo teste, o sistema gera QR Codes fictícios. Clique em "Já paguei" para simular.

---

## 🚀 Colocar em Produção

### 1. Ativar Modo Produção

No Stripe:
- Mude para **Live mode**
- Atualize as chaves no `.env`

No Mercado Pago/Asaas/Efi:
- Use as credenciais de produção
- Verifique se a conta está aprovada

### 2. Configurar HTTPS

Os provedores exigem HTTPS em produção:
```bash
# Use um serviço como:
- Heroku (grátis com HTTPS)
- Railway (grátis com HTTPS)
- Render (grátis com HTTPS)
- AWS/Google Cloud (pago)
```

### 3. Atualizar URL no Flutter

Em `payment_service.dart`, mude:
```dart
static const String _baseUrl = 'https://seu-dominio.com';
```

---

## 💡 Dicas Importantes

1. **NUNCA commite as chaves no Git!**
   - O `.env` deve estar no `.gitignore`
   - Use variáveis de ambiente em produção

2. **Use modo teste primeiro**
   - Teste tudo antes de ativar produção
   - Verifique se os repasses estão funcionando

3. **Configure webhooks**
   - Automatiza a confirmação de pagamentos
   - Reduz trabalho manual

4. **Monitore as transações**
   - Acesse os dashboards dos provedores
   - Acompanhe taxas e repasses

5. **Backup das chaves**
   - Salve suas credenciais em local seguro
   - Use um gerenciador de senhas

---

## 📞 Suporte dos Provedores

**Stripe**
- Email: support@stripe.com
- Documentação: https://stripe.com/docs

**Mercado Pago**
- Chat: No app
- Documentação: https://www.mercadopago.com.br/developers/pt

**Asaas**
- Chat: No painel
- Email: suporte@asaas.com
- WhatsApp: (16) 3336-1234

**Efi**
- Email: suporte@sejaefi.com.br
- WhatsApp: (31) 3956-2525
- Documentação: https://dev.efipay.com.br/

---

## ✅ Checklist Final

- [ ] Conta no Stripe criada e verificada
- [ ] Conta bancária adicionada no Stripe
- [ ] Chave de API do Stripe copiada
- [ ] Provedor PIX escolhido e conta criada
- [ ] Credenciais PIX obtidas
- [ ] Chave PIX cadastrada no banco
- [ ] Arquivo `.env` configurado
- [ ] Backend testado em modo teste
- [ ] Pagamentos testados no app
- [ ] Pronto para produção! 🎉
