# 🎯 INSTRUÇÕES PARA TESTAR A FUNCIONALIDADE DE CÓDIGOS

**Sistema Nicolina - Gestão de Encomendas v2.26.0**

---

## 📋 VISÃO GERAL

A versão 2.26.0 implementa suporte completo para **códigos de produtos e clientes**, permitindo:

✅ Cadastro rápido através de códigos  
✅ Preenchimento automático de dados  
✅ Busca por código ou nome  
✅ Exibição "Código - Nome" nas listas  
✅ Sincronização bidirecional entre código e nome

---

## 🚀 PASSO A PASSO PARA TESTE

### 1️⃣ ACESSAR A PÁGINA DE DADOS DE EXEMPLO

1. Abra o sistema Nicolina
2. No menu lateral, clique em **"✨ Dados de Exemplo"**
3. Você verá 3 abas: **Clientes**, **Produtos** e **Encomenda**

### 2️⃣ CADASTRAR CLIENTES COM CÓDIGOS

**Vá para a aba "Clientes"** e cadastre os seguintes clientes:

| Código | Nome | Telefone | E-mail |
|--------|------|----------|--------|
| **CLI001** | Maria Silva | (11) 98765-4321 | maria.silva@email.com |
| **CLI002** | Padaria São José | (11) 3456-7890 | contato@padariasaojose.com.br |
| **CLI003** | João Santos | (11) 91234-5678 | joao.santos@email.com |

**Como cadastrar:**
1. Clique em **"Clientes"** no menu lateral
2. Clique no botão **"Novo Cliente"**
3. Digite o **CÓDIGO** (ex: CLI001)
4. Preencha os demais dados
5. Clique em **"Salvar Cliente"**
6. Repita para os outros clientes

### 3️⃣ CADASTRAR PRODUTOS COM CÓDIGOS

**Vá para a aba "Produtos"** e cadastre os seguintes produtos:

#### Pães
| Código | Nome | Categoria | Peso (kg) | Preço |
|--------|------|-----------|-----------|-------|
| **P001** | Pão Francês | Pães | 0.05 | R$ 0,80 |
| **P002** | Pão de Forma Integral | Pães | 0.5 | R$ 8,50 |
| **P003** | Pão Italiano | Pães | 0.4 | R$ 12,00 |

#### Bolos
| Código | Nome | Categoria | Peso (kg) | Preço |
|--------|------|-----------|-----------|-------|
| **B001** | Bolo de Chocolate | Bolos | 1.5 | R$ 45,00 |
| **B002** | Bolo de Cenoura | Bolos | 1.2 | R$ 38,00 |
| **B003** | Bolo Red Velvet | Bolos | 2.0 | R$ 85,00 |

#### Doces
| Código | Nome | Categoria | Peso (kg) | Preço |
|--------|------|-----------|-----------|-------|
| **D001** | Brigadeiro Gourmet | Doces | 0.025 | R$ 3,50 |
| **D002** | Bem Casado | Doces | 0.03 | R$ 4,00 |

#### Salgados
| Código | Nome | Categoria | Peso (kg) | Preço |
|--------|------|-----------|-----------|-------|
| **S001** | Coxinha de Frango | Salgados | 0.08 | R$ 5,50 |
| **S002** | Pastel de Carne | Salgados | 0.12 | R$ 6,00 |

**Como cadastrar:**
1. Clique em **"Produtos"** no menu lateral
2. Clique no botão **"Novo Produto"**
3. Digite o **CÓDIGO** (ex: P001, B001, D001, S001)
4. Preencha os demais dados
5. Clique em **"Salvar Produto"**
6. Repita para os outros produtos

### 4️⃣ CRIAR ENCOMENDA USANDO CÓDIGOS

**Agora vamos criar uma encomenda usando APENAS os códigos!**

1. Clique em **"Encomendas"** no menu lateral
2. Clique em **"Nova Encomenda"**

#### Dados da Encomenda:

**Cliente:**
- Campo "Código Cliente": Digite **CLI001**
- ✨ O sistema preencherá automaticamente: **"Maria Silva"**
- ✨ O telefone também será preenchido: **(11) 98765-4321**

**Data e Hora:**
- Data: **15/03/2026**
- Hora: **10:00**

**Produtos:**

**PRODUTO 1:**
- Campo "Código Produto": Digite **B001**
- ✨ O sistema preencherá automaticamente: **"Bolo de Chocolate"**
- Quantidade: **2**
- Observação: **"1 bolo com 'Parabéns João' e 1 bolo sem escrita"**
- Clique em **"Adicionar Produto"**

**PRODUTO 2:**
- Campo "Código Produto": Digite **D001**
- ✨ O sistema preencherá automaticamente: **"Brigadeiro Gourmet"**
- Quantidade: **50**
- Observação: **"Metade tradicional, metade meio-amargo"**
- Clique em **"Adicionar Produto"**

**PRODUTO 3:**
- Campo "Código Produto": Digite **S001**
- ✨ O sistema preencherá automaticamente: **"Coxinha de Frango"**
- Quantidade: **30**
- Observação: **"Bem crocantes"**
- Clique em **"Adicionar Produto"**

**Revisar Totais:**
- ✅ Quantidade Total: **82 unidades**
- ✅ Peso Total: **6.65 kg**

3. Clique em **"Salvar Encomenda"**

### 5️⃣ VERIFICAR A ENCOMENDA NA LISTA

**Na lista de encomendas, você verá:**

- ✅ Cliente: **CLI001 - Maria Silva**
- ✅ Produtos: **B001 - Bolo de Chocolate**, **D001 - Brigadeiro Gourmet**, **S001 - Coxinha de Frango**
- ✅ Totais calculados automaticamente

### 6️⃣ TESTAR O FILTRO POR CÓDIGO

**No filtro de encomendas:**
1. Digite **"CLI001"** no filtro → Verá todas encomendas da Maria Silva
2. Digite **"B001"** no filtro → Verá todas encomendas com Bolo de Chocolate
3. Digite **"Maria"** no filtro → Também funciona! (busca por nome)

---

## ✨ VANTAGENS DO SISTEMA COM CÓDIGOS

### 🚀 Velocidade
- **Antes:** Digitar "Bolo de Chocolate com Cobertura de Brigadeiro"
- **Agora:** Digitar apenas **"B001"** e pronto!

### ✅ Precisão
- **Antes:** "Bolo chocolate", "Bolo de Chocolate", "bolo choco" (variações)
- **Agora:** Sempre **"B001 - Bolo de Chocolate"** (padronizado)

### 📦 Produção
- **Antes:** Lista mostra apenas nomes longos
- **Agora:** **"B001 - Bolo de Chocolate"** (código facilita identificação rápida)

### 🔍 Busca
- **Antes:** Busca apenas por nome completo
- **Agora:** Busca por **código OU nome** (flexível)

### 💼 Profissionalismo
- Sistema organizado como software de gestão empresarial
- Códigos facilitam inventário, relatórios e análises

---

## 🎯 CENÁRIOS DE TESTE ADICIONAIS

### Teste 1: Busca por Código
1. Vá em "Clientes"
2. Digite "CLI001" no filtro
3. ✅ Deve encontrar "Maria Silva"

### Teste 2: Busca por Nome
1. Vá em "Produtos"
2. Digite "Chocolate" no filtro
3. ✅ Deve encontrar "B001 - Bolo de Chocolate"

### Teste 3: Edição com Código
1. Edite uma encomenda
2. Troque o cliente digitando "CLI002"
3. ✅ Deve atualizar para "Padaria São José"

### Teste 4: Código Não Encontrado
1. Tente cadastrar encomenda com código "CLI999"
2. ✅ Sistema deve permitir salvar (campos opcionais)

### Teste 5: Sincronização
1. Cadastre produto com código "P999"
2. Depois cadastre cliente com nome "P999"
3. ✅ Cada um deve funcionar independentemente

---

## 📊 RELATÓRIOS E PRODUÇÃO

### Página de Produção
1. Vá em **"Produção"**
2. Veja as encomendas do dia
3. ✅ Produtos aparecem como **"Código - Nome"**
4. ✅ Facilita identificação rápida na produção

### Relatórios
1. Vá em **"Relatórios"**
2. Filtre por produto digitando código **"B001"**
3. ✅ Veja todas vendas desse produto

---

## 🔧 DICAS DE USO

💡 **Códigos Sugeridos:**
- Clientes: CLI001, CLI002, CLI003...
- Pães: P001, P002, P003...
- Bolos: B001, B002, B003...
- Doces: D001, D002, D003...
- Salgados: S001, S002, S003...

💡 **Flexibilidade:**
- Você pode usar qualquer formato de código
- Exemplos: "CLI-001", "CLIENTE001", "C1", etc.
- O importante é manter um padrão

💡 **Campos Opcionais:**
- Todos os campos são opcionais
- Você pode salvar sem preencher tudo
- Útil para pedidos rápidos por telefone

---

## 🎉 PRONTO!

Agora você já sabe usar todo o poder da funcionalidade de códigos no Sistema Nicolina!

**Versão:** 2.26.0  
**Data:** 10/03/2026  

---

**🍞 Sistema Nicolina - Gestão de Encomendas**  
*Desenvolvido para otimizar a produção da sua padaria*
