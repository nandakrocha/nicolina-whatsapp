# 📧 Configuração do Backup Automático por Email

O sistema Nicolina agora possui backup automático totalmente integrado com Firebase + EmailJS.

## 🎯 Passo a Passo DETALHADO para Configurar

---

### 📌 **ETAPA 1: Criar Conta no EmailJS (100% Gratuito)**

#### O que é EmailJS?
É um serviço que permite enviar emails diretamente do seu navegador, sem precisar de servidor. Perfeito para nosso sistema de backup!

#### Passos:

1. **Acesse:** https://www.emailjs.com/
2. **Clique em "Sign Up"** (botão laranja no canto superior direito)
3. **Preencha:**
   - Email: seu email pessoal ou profissional
   - Password: crie uma senha forte
4. **Clique em "Sign Up"**
5. **Confirme seu email** - Vá na sua caixa de entrada e clique no link de confirmação
6. **Faça login** em https://dashboard.emailjs.com

✅ **Pronto!** Você já tem uma conta EmailJS com **200 emails gratuitos por mês** (suficiente para backup diário + testes)

---

### 📌 **ETAPA 2: Adicionar Serviço de Email**

#### O que é um "Serviço"?
É a conexão do EmailJS com sua conta de email (Gmail, Outlook, etc.) para enviar os emails.

#### ⚠️ **ATENÇÃO - ERRO 412 DO GMAIL**

Se você receber o erro:
```
412 Gmail_API: A solicitação não possuía escopos de autenticação suficientes
```

**Significa que:** O Gmail não deu permissão completa para o EmailJS enviar emails.

**SOLUÇÃO:**
1. No EmailJS, vá em **"Email Services"**
2. Clique no serviço Gmail que você criou
3. Clique em **"Reconnect Service"** ou **"Disconnect"** e conecte novamente
4. Quando a janela do Google abrir, clique em **"Avançado"**
5. Clique em **"Ir para EmailJS (não seguro)"**
6. **MARQUE TODAS AS CAIXAS** de permissão
7. Especialmente: **"Enviar emails em seu nome"**
8. Clique em **"Permitir"** ou **"Continuar"**

#### Passos:

1. **No painel do EmailJS,** clique em **"Email Services"** no menu lateral esquerdo
2. **Clique em "Add New Service"** (botão azul)
3. **Escolha seu provedor de email:**
   - 📧 **Gmail** (recomendado) - se você usa @gmail.com
   - 📧 **Outlook/Hotmail** - se você usa @outlook.com ou @hotmail.com
   - 📧 **Yahoo** - se você usa @yahoo.com
   - 📧 **Outro** - para outros provedores

#### 📧 **Se escolheu GMAIL (recomendado):**

4. **Clique em "Gmail"**
5. **Clique em "Connect Account"**
6. **Uma janela do Google vai abrir** pedindo para você fazer login
7. **Faça login** com a conta Gmail que você quer usar para enviar os backups

#### ⚡ **PASSO CRÍTICO - PERMISSÕES:**

8. **Quando aparecer "Este app não foi verificado":**
   - Clique em **"Avançado"** (link pequeno embaixo)
   - Clique em **"Ir para EmailJS (não seguro)"** (pode aparecer em inglês: "Go to EmailJS (unsafe)")

9. **MARQUE TODAS AS CAIXAS DE PERMISSÃO:**
   - ✅ Ver mensagens e configurações de email
   - ✅ **Enviar emails em seu nome** ← **ESSENCIAL!**
   - ✅ Gerenciar rascunhos
   - ✅ Todas as outras opções que aparecerem

10. **Clique em "Permitir"** ou **"Allow"**

11. **Dê um nome ao serviço** (ex: "Nicolina Backup")
12. **Clique em "Create Service"**

#### 📝 **IMPORTANTE - COPIE O SERVICE ID:**

Após criar, você verá uma tela com informações do serviço.

**COPIE o Service ID** - ele parece algo assim: `service_abc1234`

Exemplo:
```
Service ID: service_8xk2p9m
```

✅ **Guarde esse código!** Você vai precisar dele depois.

---

### 📌 **ETAPA 3: Criar Template de Email**

#### O que é um "Template"?
É o modelo/layout do email que será enviado com o backup. Vamos criar um email bonito e profissional!

#### Passos:

1. **No painel do EmailJS,** clique em **"Email Templates"** no menu lateral esquerdo
2. **Clique em "Create New Template"** (botão azul)
3. **Você verá um editor de template**

#### 📝 **Configure o Template:**

**Campo "Template Name"** (nome interno, só você vê):
```
Backup Nicolina
```

**Campo "Subject"** (assunto do email):
```
{{subject}}
```
*Não mude isso! O sistema vai preencher automaticamente*

**Campo "From Name"** (nome de quem envia):
```
Sistema Nicolina
```

**Campo "From Email"** (deixe como está, ou coloque):
```
nicolina@backup.com
```
*Não precisa existir, é só para aparecer bonito*

**Campo "Reply To"** (deixe vazio ou coloque seu email real)

**Campo "Content" (corpo do email)** - COPIE E COLE EXATAMENTE ISSO:

```
Olá! 👋

Este é o backup automático do sistema Nicolina - Gestão de Encomendas.

📅 Data do Backup: {{data_backup}} às {{hora_backup}}

📊 Resumo dos Dados Salvos:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 📦 Encomendas: {{total_encomendas}}
• 🍞 Produtos cadastrados: {{total_produtos}}
• 👥 Clientes: {{total_clientes}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📎 Nome do arquivo: {{filename}}

⚠️ IMPORTANTE: O arquivo de backup está anexado a este email em formato JSON.
Guarde este arquivo em local seguro (Google Drive, Dropbox, etc.)

🔄 COMO RESTAURAR ESTE BACKUP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Acesse o sistema Nicolina
2. Clique em "💾 Backup e Restauração" no menu lateral
3. Clique no botão "Restaurar"
4. Selecione o arquivo JSON anexado neste email
5. Confirme a restauração
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Este backup foi gerado automaticamente pelo sistema.
🔒 Mantenha seus backups em local seguro.
🍞 Obrigado por usar o Sistema Nicolina!

--
Este é um email automático. Não responda esta mensagem.
Sistema Nicolina - Gestão de Encomendas de Padaria
```

4. **Clique em "Save"** (botão azul no canto superior direito)

#### 📝 **IMPORTANTE - COPIE O TEMPLATE ID:**

Após salvar, você verá o template criado na lista.

**COPIE o Template ID** - ele parece algo assim: `template_xyz7890`

Exemplo:
```
Template ID: template_k3m9x2n
```

✅ **Guarde esse código!** Você vai precisar dele depois.

---

### 📌 **ETAPA 4: Obter sua Chave Pública (Public Key)**

#### O que é a "Public Key"?
É a chave de identificação da sua conta. Ela permite que o sistema Nicolina se conecte ao EmailJS.

#### Passos:

1. **No painel do EmailJS,** clique em **"Account"** no menu lateral esquerdo
2. **Clique em "General"** (se não estiver já selecionado)
3. **Role a página para baixo** até encontrar a seção **"API Keys"**
4. **Procure por "Public Key"**

Você verá algo assim:
```
Public Key: user_abc123xyz456
```

#### 📝 **COPIE A PUBLIC KEY:**

Exemplo:
```
user_8xKm2pP9nQ3rT5vW
```

✅ **Guarde esse código!** Você vai precisar dele agora.

---

### 📌 **ETAPA 5: Salvar as Credenciais no Firebase**

Agora você tem **3 códigos importantes:**
1. ✅ **Service ID** (ex: `service_8xk2p9m`)
2. ✅ **Template ID** (ex: `template_k3m9x2n`)
3. ✅ **Public Key** (ex: `user_8xKm2pP9nQ3rT5vW`)

#### Passos:

1. **Acesse o Firebase Console:** https://console.firebase.google.com
2. **Clique no projeto** `nicolina-padaria`
3. **No menu lateral esquerdo,** clique em **"Realtime Database"**
4. **Você verá a árvore de dados do Firebase**
5. **Clique na raiz** (onde está escrito `nicolina-padaria-default-rtdb` ou similar)

#### 🗂️ **Criar a Estrutura de Dados:**

**Opção A - Criar Manualmente (passo a passo):**

1. Se ainda não existir, crie a pasta `nicolina`:
   - Clique no ícone **"+"** ao lado da raiz
   - Digite: `nicolina`
   - Pressione Enter

2. Dentro de `nicolina`, crie a pasta `configuracoes`:
   - Clique no ícone **"+"** ao lado de `nicolina`
   - Digite: `configuracoes`
   - Pressione Enter

3. Dentro de `configuracoes`, crie a pasta `emailjs`:
   - Clique no ícone **"+"** ao lado de `configuracoes`
   - Digite: `emailjs`
   - Pressione Enter

4. Dentro de `emailjs`, adicione os 3 campos:

   **Campo 1:**
   - Clique no **"+"** ao lado de `emailjs`
   - Nome: `publicKey`
   - Valor: Cole sua Public Key (ex: `user_8xKm2pP9nQ3rT5vW`)
   - Clique em **"Add"**

   **Campo 2:**
   - Clique no **"+"** ao lado de `emailjs` novamente
   - Nome: `serviceId`
   - Valor: Cole seu Service ID (ex: `service_8xk2p9m`)
   - Clique em **"Add"**

   **Campo 3:**
   - Clique no **"+"** ao lado de `emailjs` novamente
   - Nome: `templateId`
   - Valor: Cole seu Template ID (ex: `template_k3m9x2n`)
   - Clique em **"Add"**

**Opção B - Importar JSON (mais rápido):**

1. No Firebase Realtime Database, clique nos **três pontinhos (⋮)** no topo
2. Clique em **"Import JSON"**
3. Cole este código (SUBSTITUA os valores pelos seus códigos):

```json
{
  "nicolina": {
    "configuracoes": {
      "emailjs": {
        "publicKey": "COLE_SUA_PUBLIC_KEY_AQUI",
        "serviceId": "COLE_SEU_SERVICE_ID_AQUI",
        "templateId": "COLE_SEU_TEMPLATE_ID_AQUI"
      }
    }
  }
}
```

**Exemplo com valores reais:**
```json
{
  "nicolina": {
    "configuracoes": {
      "emailjs": {
        "publicKey": "user_8xKm2pP9nQ3rT5vW",
        "serviceId": "service_8xk2p9m",
        "templateId": "template_k3m9x2n"
      }
    }
  }
}
```

4. Clique em **"Import"**

#### ✅ **Verifique se ficou correto:**

A estrutura final deve estar assim:
```
📁 nicolina
  └─ 📁 configuracoes
      └─ 📁 emailjs
          ├─ 📄 publicKey: "user_..."
          ├─ 📄 serviceId: "service_..."
          └─ 📄 templateId: "template_..."
```

---

### 📌 **ETAPA 6: Configurar no Sistema Nicolina**

Agora vamos configurar o sistema para usar o EmailJS!

#### Passos:

1. **Abra o sistema Nicolina** no navegador
2. **No menu lateral,** clique em **"💾 Backup e Restauração"**
3. **Você verá a seção "Backup Automático por Email"**

#### 📝 **Preencha os campos:**

**Campo "Email para Backup":**
- Digite o email onde você quer RECEBER os backups
- Exemplo: `seu.email@gmail.com`
- ⚠️ Pode ser diferente do email que você configurou no EmailJS!

**Campo "Horário do Backup Diário":**
- Escolha o horário que você quer receber o backup todo dia
- Exemplo: `23:00` (11 da noite)
- Recomendado: escolha um horário que o computador esteja ligado

**Checkbox "Ativar backup automático diário":**
- ✅ Marque esta opção para ativar o backup automático

4. **Clique em "Salvar Configurações"**

✅ **Pronto!** O sistema está configurado!

---

### 📌 **ETAPA 7: TESTAR O BACKUP**

Vamos testar se tudo está funcionando!

#### Passos:

1. **Na mesma página de Backup,** clique no botão **"Enviar Backup Agora"**
2. **Aguarde** alguns segundos
3. **Você verá uma mensagem de sucesso:** ✅ "Backup enviado com sucesso para seu@email.com!"
4. **Vá no seu email** (o que você configurou no campo "Email para Backup")
5. **Procure um email** com assunto: "🍞 Backup Automático Nicolina - [data]"
6. **Abra o email** e verifique:
   - ✅ Corpo do email formatado
   - ✅ Estatísticas (quantidade de encomendas, produtos, clientes)
   - ✅ Arquivo JSON anexado

⚠️ **Se o email não chegou:**
- Verifique a caixa de **SPAM/Lixo Eletrônico**
- Gmail geralmente coloca na aba **"Promoções"** ou **"Atualizações"**
- Aguarde até 5 minutos (às vezes demora um pouco)

---

## 📚 **RESUMO DOS CÓDIGOS QUE VOCÊ PRECISA**

| Código | Onde encontrar | Exemplo | Onde usar |
|--------|---------------|---------|-----------|
| **Public Key** | EmailJS → Account → General → API Keys | `user_8xKm2pP9nQ3rT5vW` | Firebase |
| **Service ID** | EmailJS → Email Services → [seu serviço] | `service_8xk2p9m` | Firebase |
| **Template ID** | EmailJS → Email Templates → [seu template] | `template_k3m9x2n` | Firebase |
| **Email Destinatário** | Escolha livre | `backup@suapadaria.com` | Sistema Nicolina |
| **Horário** | Escolha livre | `23:00` | Sistema Nicolina |

---

## ✅ **CHECKLIST FINAL**

Marque conforme você for completando:

- [ ] Criar conta no EmailJS
- [ ] Conectar serviço de email (Gmail/Outlook)
- [ ] Copiar Service ID
- [ ] Criar template de email
- [ ] Copiar Template ID
- [ ] Copiar Public Key
- [ ] Salvar as 3 credenciais no Firebase
- [ ] Configurar email destinatário no sistema
- [ ] Configurar horário do backup
- [ ] Ativar backup automático
- [ ] Testar com "Enviar Backup Agora"
- [ ] Verificar se recebeu o email

---

## 🆘 **SOLUÇÃO DE PROBLEMAS**

### ❌ Erro: "EmailJS não configurado"

**Causa:** As credenciais não foram salvas corretamente no Firebase

**Solução:**
1. Vá no Firebase Console
2. Acesse Realtime Database
3. Verifique se existe a estrutura: `nicolina/configuracoes/emailjs`
4. Verifique se os 3 campos existem: `publicKey`, `serviceId`, `templateId`
5. Verifique se não há espaços em branco nos valores

---

### ❌ Email não chegou

**Causas possíveis:**

**1. Email foi para SPAM:**
- Verifique a pasta Spam/Lixo Eletrônico
- Marque como "Não é spam"

**2. Email está em outra aba (Gmail):**
- Verifique as abas "Promoções" e "Atualizações"
- Mova para "Principal" se necessário

**3. Credenciais incorretas:**
- Verifique se o Service ID está correto
- Verifique se o Template ID está correto
- Verifique se a Public Key está correta

**4. Limite excedido:**
- EmailJS gratuito tem limite de 200 emails/mês
- Verifique seu uso em: EmailJS → Account → Usage

---

### ❌ Erro ao enviar / erro 400 ou 403

**Causa:** Public Key ou Service ID incorretos

**Solução:**
1. No EmailJS, vá em Account → General
2. Copie novamente a Public Key (certifique-se de copiar tudo)
3. Vá em Email Services
4. Verifique o Service ID do seu serviço
5. Atualize no Firebase

---

### ❌ Template não está formatado

**Causa:** Template ID incorreto ou template mal configurado

**Solução:**
1. No EmailJS, vá em Email Templates
2. Abra seu template
3. Verifique se o conteúdo está correto
4. Copie novamente o Template ID
5. Atualize no Firebase

---

## 📊 **COMO FUNCIONA O BACKUP AUTOMÁTICO**

### 🕐 Backup Diário:

1. **Todo dia no horário configurado** (ex: 23:00)
2. O sistema **verifica automaticamente** se já passou da hora
3. Se sim e ainda não enviou hoje:
   - Cria um backup completo (encomendas + produtos + clientes)
   - Salva no Firebase
   - Envia por email automaticamente
4. **Tudo em segundo plano!** Você nem percebe

### 💾 Backup Manual:

1. Você clica em "Criar Backup"
2. O sistema cria e salva no Firebase
3. Você pode baixar ou restaurar depois

### 📧 Enviar Backup Agora:

1. Você clica em "Enviar Backup Agora"
2. Sistema cria backup
3. Salva no Firebase
4. Envia por email imediatamente

---

## 🎁 **LIMITES E BENEFÍCIOS**

### EmailJS GRATUITO:
- ✅ 200 emails por mês
- ✅ 1 backup diário = ~30 emails/mês
- ✅ Sobram 170 emails para testes!
- ✅ Sem cartão de crédito
- ✅ Sem expiração

### Firebase GRATUITO:
- ✅ 1 GB de armazenamento
- ✅ Backups salvos na nuvem
- ✅ Histórico completo
- ✅ Restauração com 1 clique

---

## 📞 **LINKS ÚTEIS**

- 🌐 EmailJS: https://www.emailjs.com
- 🌐 Painel EmailJS: https://dashboard.emailjs.com
- 🌐 Firebase Console: https://console.firebase.google.com
- 📖 Documentação EmailJS: https://www.emailjs.com/docs
- 🎥 Vídeo tutorial EmailJS: https://www.youtube.com/results?search_query=emailjs+tutorial

---

✅ **TUDO 100% GRATUITO E SEM BACKEND!** 🚀🍞