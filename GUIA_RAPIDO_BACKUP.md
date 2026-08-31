# 📧 Guia Rápido - Backup Automático

## 🎯 O que você precisa fazer (em 7 passos):

### 1️⃣ Criar conta no EmailJS
- Site: https://www.emailjs.com/
- Clique em "Sign Up"
- Use seu email e crie uma senha
- ✅ **Resultado:** Você terá 200 emails grátis por mês

---

### 2️⃣ Conectar seu email (Gmail, Outlook, etc)
- No painel do EmailJS, vá em "Email Services"
- Clique em "Add New Service"
- Escolha Gmail (ou seu provedor)
- Autorize a conexão
- **⚠️ IMPORTANTE:** Quando aparecer "Este app não foi verificado":
  - Clique em **"Avançado"**
  - Clique em **"Ir para EmailJS (não seguro)"**
  - **MARQUE TODAS AS CAIXAS** de permissão
  - Especialmente: **"Enviar emails em seu nome"**
  - Clique em **"Permitir"**
- **COPIE O CÓDIGO:** `service_abc123`
- ✅ **Resultado:** EmailJS poderá enviar emails por você

---

### 3️⃣ Criar modelo do email
- Vá em "Email Templates"
- Clique em "Create New Template"
- Copie e cole o conteúdo (tem no sistema)
- **COPIE O CÓDIGO:** `template_xyz789`
- ✅ **Resultado:** Email bonito e profissional

---

### 4️⃣ Pegar sua chave
- Vá em "Account" → "General"
- Procure por "Public Key"
- **COPIE O CÓDIGO:** `user_abc123xyz`
- ✅ **Resultado:** Sua chave de identificação

---

### 5️⃣ Colocar no Firebase
- Abra: https://console.firebase.google.com
- Entre no projeto "nicolina-padaria"
- Vá em "Realtime Database"
- Cole os 3 códigos que você copiou
- ✅ **Resultado:** Sistema configurado no banco

---

### 6️⃣ Configurar no sistema Nicolina
- Abra o sistema Nicolina
- Vá em "💾 Backup e Restauração"
- Digite seu email (onde quer receber)
- Escolha o horário (ex: 23:00)
- Marque "Ativar backup automático"
- Clique em "Salvar"
- ✅ **Resultado:** Tudo pronto!

---

### 7️⃣ Testar
- Clique em "Enviar Backup Agora"
- Aguarde alguns segundos
- Verifique seu email
- ✅ **Resultado:** Backup recebido!

---

## 📋 Os 3 códigos que você precisa copiar:

| O que é? | Parece com isso | Onde pegar? |
|----------|-----------------|-------------|
| **Public Key** | `user_abc123xyz456` | EmailJS → Account → General |
| **Service ID** | `service_abc1234` | EmailJS → Email Services |
| **Template ID** | `template_xyz7890` | EmailJS → Email Templates |

---

## 🔥 Depois de configurar:

✅ **Backup diário automático** - Todo dia no horário que você escolheu
✅ **Zero trabalho** - Sistema faz sozinho
✅ **Seguro** - Arquivo salvo no email
✅ **Grátis** - 200 emails/mês (backup usa 30/mês)

---

## ❓ Problemas comuns:

### "Email não chegou"
→ Olhe no SPAM ou aba Promoções (Gmail)

### "EmailJS não configurado"
→ Verifique se colocou os 3 códigos no Firebase

### "Erro ao enviar"
→ Verifique se copiou os códigos completamente

### ⚠️ "Erro 412 Gmail_API: A solicitação não possuía escopos de autenticação suficientes"
**O que significa:** O Gmail não deu permissão completa

**Como resolver:**
1. No EmailJS, vá em "Email Services"
2. Clique no serviço Gmail que você criou
3. Clique em "Reconnect Service" ou "Disconnect"
4. Conecte novamente
5. Quando o Google pedir permissão, clique em "Avançado"
6. Clique em "Ir para EmailJS (não seguro)"
7. **MARQUE TODAS AS CAIXAS**, especialmente "Enviar emails em seu nome"
8. Clique em "Permitir"
9. ✅ Pronto! Tente enviar novamente

---

## 🆘 Precisa de ajuda detalhada?

No sistema Nicolina:
1. Vá em "💾 Backup e Restauração"
2. Clique no botão **"📖 Ver Passo a Passo Completo"**
3. Siga o guia visual interativo!

---

**✨ Configuração leva 10 minutos e funciona para sempre!**