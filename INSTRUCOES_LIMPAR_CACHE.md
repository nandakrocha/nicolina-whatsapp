# 🔄 INSTRUÇÕES PARA FORÇAR ATUALIZAÇÃO - v2.4.0

## ✅ Sistema atualizado para versão 2.4.0

Todas as alterações foram aplicadas:
- ✅ Versão atualizada em `package.json` (2.4.0)
- ✅ Versão atualizada em `api.ts` (2.4.0)
- ✅ Banner de versão fixo no topo direito da tela
- ✅ Sistema de verificação automática de versão
- ✅ Arquivo centralizado de versão (`/src/app/version.ts`)
- ✅ Sistema de Configurações completo implementado

---

## 🚀 COMO FORÇAR A ATUALIZAÇÃO

### **Método 1: Hard Reload (Mais Rápido) ⚡**

1. **Abra o sistema Nicolina** no navegador
2. Pressione **Ctrl + Shift + R** (Windows/Linux)  
   ou **Cmd + Shift + R** (Mac)
3. Aguarde a página recarregar completamente

### **Método 2: Limpar Cache Completo 🧹**

#### **Chrome / Edge / Brave:**

1. Pressione **Ctrl + Shift + Delete** (ou **Cmd + Shift + Delete** no Mac)
2. Selecione:
   - ✅ **Imagens e arquivos em cache**
   - ✅ **Cookies e outros dados do site**
3. Intervalo de tempo: **Últimas 24 horas** (ou "Sempre")
4. Clique em **Limpar dados**
5. Feche o navegador completamente (feche todas as abas)
6. Abra novamente e acesse o Nicolina

#### **Firefox:**

1. Pressione **Ctrl + Shift + Delete**
2. Selecione:
   - ✅ **Cache**
   - ✅ **Cookies**
3. Intervalo: **Tudo**
4. Clique em **OK**
5. Reinicie o navegador

#### **Safari (Mac):**

1. Menu **Safari** → **Preferências** → **Avançado**
2. Marque **Mostrar menu Desenvolver**
3. Menu **Desenvolver** → **Limpar caches**
4. Reinicie o navegador

---

## ✅ VERIFICAÇÕES APÓS ATUALIZAR

Após limpar o cache e recarregar, você DEVE ver:

### **1. Banner Verde no Canto Superior Direito:**
```
✅ NICOLINA v2.4.0
```

### **2. Logs no Console (F12):**
Abra o Console do DevTools (F12) e procure por:
```
🚀 Nicolina - Gestão de Encomendas v2.4.0
📦 Módulo: App Principal
📅 Última atualização: 09/03/2026
⏰ Carregado em: [DATA E HORA ATUAL]
```

### **3. Botão de Configurações em Encomendas:**
- Vá para **Encomendas**
- Procure o botão **⚙️ Configurações** ao lado de "Cards" e "Lista"
- Clique para ver o Dialog de Configurações completo

---

## 🔍 VERIFICAÇÃO DE VERSÃO

Execute este comando no Console (F12) para verificar a versão:

```javascript
console.log(localStorage.getItem('nicolina_versao_atual'));
```

**Resultado esperado:** `"2.4.0"`

Se aparecer `"2.0.0"` ou outra versão antiga, o cache não foi limpo corretamente.

---

## 🚨 SE AINDA NÃO FUNCIONAR

### **Opção 1: Modo Anônimo/Privado**
1. Abra uma **janela anônima** (Ctrl + Shift + N no Chrome)
2. Acesse o sistema Nicolina
3. Verifique se o banner "v2.4.0" aparece
4. Se aparecer, o problema é cache no navegador normal

### **Opção 2: Limpar Storage Manualmente**
1. Abra o Console (F12)
2. Vá na aba **Application** (Chrome) ou **Storage** (Firefox)
3. No menu lateral esquerdo:
   - Expanda **Local Storage**
   - Clique com botão direito na URL do site
   - Escolha **Clear**
4. Faça o mesmo com **Session Storage**
5. Recarregue a página (F5)

### **Opção 3: Forçar Reload com JavaScript**
1. Abra o Console (F12)
2. Cole este comando:
```javascript
localStorage.removeItem('nicolina_versao_atual');
location.reload(true);
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

- [ ] Banner verde "v2.4.0" visível no canto superior direito
- [ ] Console mostra logs de inicialização v2.4.0
- [ ] Botão **⚙️ Configurações** aparece em Encomendas
- [ ] Dialog de Configurações abre ao clicar no botão
- [ ] Sistema salva configurações no LocalStorage
- [ ] Edição inline funciona na visualização Lista

---

## 💡 DICAS ADICIONAIS

### **Desabilitar Cache Durante Desenvolvimento:**
1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Marque a opção **Disable cache** (Chrome) ou **Desabilitar cache HTTP** (Firefox)
4. Deixe o DevTools aberto enquanto usa o sistema

### **Verificar Service Workers:**
1. Abra DevTools (F12)
2. Vá na aba **Application** → **Service Workers**
3. Se houver algum service worker registrado, clique em **Unregister**
4. Recarregue a página

---

## 📞 SUPORTE

Se após seguir todos os passos acima o sistema continuar mostrando v2.0.0:

1. Tire um **print do Console** (F12) mostrando os logs
2. Tire um **print da tela** mostrando o banner de versão
3. Informe qual **navegador e versão** está usando
4. Descreva qual método de limpeza de cache tentou

---

**Data de Atualização:** 09/03/2026  
**Versão Atual:** 2.4.0  
**Status:** ✅ Sistema atualizado e pronto para uso
