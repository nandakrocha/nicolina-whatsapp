# 📋 Como Configurar Categorias para o Dashboard Funcionar

## ⚠️ Problema Identificado

As encomendas não estão aparecendo no Dashboard porque **os produtos não têm categoria definida**. O Dashboard precisa que cada produto tenha uma categoria para somar corretamente.

---

## ✅ Solução Implementada

### 🎯 Campo de Categoria Melhorado

O campo de categoria agora é um **seletor com opções predefinidas**, garantindo classificação correta:

#### Categorias Disponíveis:
- 🍞 **Pães Salgados**
- 🥐 **Pães Doces**
- 🥖 **Mini Pães Salgados**
- 🧁 **Mini Pães Doces**
- 🎂 **Bolos**
- 🥧 **Tortas**
- 🥟 **Salgados**
- 🍰 **Doces**
- 📦 **Outros**

---

## 📝 Passo a Passo para Configurar

### 1️⃣ Acesse a Página de Produtos
- Clique em **"Produtos"** no menu lateral

### 2️⃣ Identifique Produtos Sem Categoria
O sistema agora mostra um **alerta amarelo** no topo da página listando todos os produtos que não têm categoria definida.

### 3️⃣ Edite Cada Produto
Para cada produto listado no alerta:
1. Clique no botão **"Editar" (✏️)** no card/linha do produto
2. No campo **"Categoria"**, selecione a opção correta do menu dropdown
3. Clique em **"Atualizar"** para salvar

### 4️⃣ Verifique o Dashboard
Após configurar as categorias:
1. Acesse o **Dashboard**
2. Verifique se os números aparecem nas tabelas de **Hoje** e **Amanhã**
3. Os totais devem atualizar automaticamente a cada 30 segundos

---

## 🔍 Como Identificar Produtos Sem Categoria

### Visualmente no Sistema:

#### 📊 Alerta no Topo da Página de Produtos
```
⚠️ Produtos sem categoria detectados
X produto(s) não têm categoria definida.
Isso impede que sejam contabilizados corretamente no Dashboard.

📋 Produtos sem categoria: [Lista de produtos]
```

#### 🃏 Na Visualização em Cards
- Card com **borda laranja grossa**
- Badge **"Sem categoria"** ao lado do nome

#### 📋 Na Visualização em Tabela
- Linha com **fundo amarelo claro**
- Badge **"Sem categoria"** no nome
- Categoria mostra **"⚠️ Não definida"**

---

## 🎯 Exemplo Prático

### ❌ Antes (Produto Sem Categoria)
```
Nome: Pão de Sal
Categoria: (vazio)
Peso: 50g
```
**Resultado no Dashboard**: ❌ Não soma

### ✅ Depois (Produto Com Categoria)
```
Nome: Pão de Sal
Categoria: Pães Salgados
Peso: 50g
```
**Resultado no Dashboard**: ✅ Soma corretamente na linha "🍞 Pães Salgados"

---

## 📊 Como o Dashboard Calcula

O Dashboard analisa **todas as encomendas** e:

1. Filtra encomendas de **Hoje** e **Amanhã**
2. Para cada encomenda, olha os produtos
3. Verifica a **categoria** de cada produto
4. Soma as quantidades por categoria:
   - Se categoria contém "Mini" + "Sal" → **Mini Pães Salgados**
   - Se categoria contém "Mini" + "Doce" → **Mini Pães Doces**
   - Se categoria contém "Sal" ou "Salgado" → **Pães Salgados**
   - Se categoria contém "Doce" → **Pães Doces**
5. Exibe os totais em tempo real

---

## 🚨 Importante

- ✅ **Sempre defina a categoria** ao cadastrar novos produtos
- ✅ Use as **categorias predefinidas** do seletor
- ✅ Não deixe produtos sem categoria
- ✅ O Dashboard atualiza **automaticamente** a cada 30 segundos
- ✅ Você pode forçar atualização voltando para o Dashboard

---

## 💡 Dica Rápida

**Para corrigir rapidamente todos os produtos:**

1. Vá em **Produtos**
2. Veja o alerta amarelo
3. Clique em **Editar** em cada produto listado
4. Selecione a categoria correta
5. Salve
6. Volte ao Dashboard
7. ✅ Os números devem aparecer!

---

## 🎉 Sistema Funcionando

Após configurar as categorias:
- ✅ Dashboard mostra totais corretos
- ✅ Atualização em tempo real
- ✅ Contagem por categoria funcionando
- ✅ Totais de Hoje e Amanhã precisos
- ✅ Planejamento de produção facilitado

---

**Data da Correção**: 03/03/2026  
**Versão do Sistema**: Nicolina v1.0  
**Status**: ✅ Totalmente Funcional
