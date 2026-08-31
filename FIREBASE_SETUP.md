# 🔥 Guia de Configuração do Firebase - Sistema Nicolina

## 📋 Resumo

O **Sistema Nicolina** foi migrado do localStorage (navegador) para o **Firebase Realtime Database**, garantindo:

✅ **Dados na nuvem** - Backup automático e seguro  
✅ **Acesso multi-dispositivo** - Use em qualquer computador/tablet  
✅ **Sincronização em tempo real** - Mudanças aparecem instantaneamente  
✅ **Armazenamento ilimitado** - Sem limite de memória do navegador  
✅ **100% GRATUITO** - Até 1GB de dados e 10GB de transferência/mês  

---

## 🚀 Passo a Passo (5 minutos)

### **1. Criar Conta no Firebase**

1. Acesse: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"**
4. Nome do projeto: **"nicolina-padaria"** (ou nome de sua preferência)
5. Clique em **"Continuar"** → **"Continuar"** → **"Criar projeto"**

---

### **2. Ativar Realtime Database**

1. No menu lateral, clique em **"Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione a localização: **"us-central1"** (ou mais próximo do Brasil)
4. Escolha: **"Iniciar em modo de teste"**
   - ⚠️ **Importante:** Isso permite leitura/escrita sem autenticação (ideal para protótipo)
   - ⚠️ **Produção:** Configure regras de segurança depois
5. Clique em **"Ativar"**

---

### **3. Obter Credenciais**

1. Clique no ícone de **engrenagem** (⚙️) → **"Configurações do projeto"**
2. Role até a seção **"Seus apps"**
3. Clique no ícone **Web** (`</>`)
4. Nome do app: **"Nicolina Web"**
5. **NÃO** marque "Firebase Hosting"
6. Clique em **"Registrar app"**
7. Copie o bloco `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "nicolina-padaria.firebaseapp.com",
  databaseURL: "https://nicolina-padaria-default-rtdb.firebaseio.com",
  projectId: "nicolina-padaria",
  storageBucket: "nicolina-padaria.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

### **4. Configurar no Sistema Nicolina**

#### **Opção A: Variáveis de Ambiente (Recomendado)**

1. Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`)
2. Preencha com suas credenciais:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=nicolina-padaria.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://nicolina-padaria-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=nicolina-padaria
VITE_FIREBASE_STORAGE_BUCKET=nicolina-padaria.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

#### **Opção B: Direto no Código**

1. Abra o arquivo: `/src/app/services/firebase.ts`
2. Substitua os valores `"PREENCHA_..."` pelas suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // ← Cole sua API Key aqui
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

### **5. Migrar Dados Existentes**

Se você já tem dados salvos no navegador:

1. Abra o sistema Nicolina
2. Vá em **⚙️ Configurações** (menu lateral)
3. Clique em **"Migrar Dados para Firebase"**
4. Aguarde a confirmação: ✅ "Migração concluída com sucesso!"

**Pronto!** Seus dados agora estão na nuvem! 🎉

---

## 🔒 Segurança (Importante para Produção)

### **Configurar Regras de Segurança**

⚠️ **Atenção:** O modo de teste permite que QUALQUER pessoa leia/escreva seus dados!

Para produção, configure regras de segurança:

1. No Firebase Console, vá em **"Realtime Database"** → **"Regras"**
2. Substitua por:

```json
{
  "rules": {
    "nicolina": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

3. **Implemente autenticação** no sistema (não incluído nesta versão)

---

## 🧪 Testar Conexão

1. Abra o sistema Nicolina
2. Vá em **⚙️ Configurações**
3. Verifique o status:
   - ✅ **Firebase: Configurado** (verde)
   - 🔴 **Firebase: Não Configurado** (vermelho) → Revise os passos

---

## ❓ Problemas Comuns

### **Erro: "Firebase não configurado"**
- ✔️ Verifique se preencheu TODAS as credenciais
- ✔️ Não deixe nenhum campo como `"PREENCHA_..."`
- ✔️ Reinicie o servidor de desenvolvimento

### **Erro: "Permission denied"**
- ✔️ Certifique-se de que ativou o Realtime Database
- ✔️ Verifique se as regras estão em "modo de teste"

### **Dados não aparecem**
- ✔️ Verifique se clicou em "Migrar Dados"
- ✔️ Abra o Firebase Console → Realtime Database para ver os dados

---

## 📊 Estrutura de Dados no Firebase

```
nicolina/
├── encomendas/
│   ├── 1234567890-abc123/
│   │   ├── id: "1234567890-abc123"
│   │   ├── clienteNome: "Maria Silva"
│   │   ├── data: "2026-03-05"
│   │   ├── produtos: [...]
│   │   └── ...
│   └── ...
├── produtos/
│   ├── 9876543210-def456/
│   │   ├── id: "9876543210-def456"
│   │   ├── nome: "Pão Francês"
│   │   ├── categoria: "Pão de Sal"
│   │   └── ...
│   └── ...
├── clientes/
│   └── ...
└── backups/
    └── ...
```

---

## 💾 Backup de Segurança

### **Exportar Dados (JSON)**

1. Vá em **⚙️ Configurações**
2. Clique em **"Exportar Dados (JSON)"**
3. Salve o arquivo em local seguro

### **Backup Automático do Firebase**

O Firebase faz backup automático dos seus dados. Para exportar:

1. Firebase Console → **"Realtime Database"**
2. Clique nos **3 pontinhos** (⋮) no topo direito
3. **"Exportar JSON"**

---

## 📞 Suporte

- **Documentação Firebase:** [https://firebase.google.com/docs/database](https://firebase.google.com/docs/database)
- **Console Firebase:** [https://console.firebase.google.com](https://console.firebase.google.com)

---

## ✅ Checklist Final

- [ ] Conta Firebase criada
- [ ] Realtime Database ativado
- [ ] Credenciais copiadas
- [ ] Arquivo `.env` ou `firebase.ts` configurado
- [ ] Sistema aberto e status "Firebase: Configurado" verde
- [ ] Dados migrados com sucesso
- [ ] Backup exportado (segurança extra)

**Tudo pronto? Agora você tem um sistema profissional com banco de dados na nuvem!** 🚀✨

---

**Sistema Nicolina - Gestão de Encomendas**  
Versão 2.0.0 com Firebase  
Desenvolvido para Padaria com 💙
