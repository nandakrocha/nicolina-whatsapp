# 📝 Edição de Orçamentos - Sistema Nicolina

## 🎯 Comportamento Correto Implementado

O sistema agora diferencia corretamente entre **CRIAR** e **ATUALIZAR** orçamentos.

---

## ✅ Novo Comportamento

### 1️⃣ **Criar Novo Orçamento**

Quando você preenche o formulário pela primeira vez:

```
1. Preencher dados do cliente
2. Adicionar itens
3. Clicar em "Salvar Orçamento"
   ↓
   RESULTADO: Novo orçamento criado ✅
```

**Botão exibido:** `Salvar Orçamento`

---

### 2️⃣ **Abrir Orçamento Existente**

Quando você clica no botão "Abrir" de um orçamento salvo:

```
1. Orçamento é carregado no formulário
2. Indicador visual aparece: "Editando orçamento existente"
3. Você pode:
   - NÃO alterar nada → Salvar (mantém o mesmo)
   - ALTERAR dados → Salvar (atualiza o mesmo)
   ↓
   RESULTADO: Mesmo orçamento atualizado ✅
   (NÃO cria duplicata)
```

**Botão exibido:** `Atualizar Orçamento`

---

### 3️⃣ **Criar Novo Após Editar**

Se você estava editando e quer criar um novo:

```
1. Clique no botão "Novo Orçamento" (azul)
2. Formulário é limpo
3. Indicador de edição desaparece
4. Preencha novos dados
5. Clique em "Salvar Orçamento"
   ↓
   RESULTADO: Novo orçamento criado ✅
```

---

## 🎨 Indicadores Visuais

### 📍 Quando está EDITANDO um orçamento existente:

```
┌─────────────────────────────────────────────────┐
│ 💼 Gerador de Orçamento Proporcional            │
│ Configure as proporções...                      │
│                                                  │
│ 🟠 ● Editando orçamento existente               │ ← Indicador
│                                                  │
│ [Novo Orçamento]  [Gerenciar]  [Imprimir]...   │ ← Botão azul
└─────────────────────────────────────────────────┘
```

**Características:**
- ✅ Badge laranja pulsante
- ✅ Texto: "Editando orçamento existente"
- ✅ Botão "Novo Orçamento" aparece (azul)
- ✅ Botão salvar muda para "Atualizar Orçamento"

### 📍 Quando está CRIANDO um novo orçamento:

```
┌─────────────────────────────────────────────────┐
│ 💼 Gerador de Orçamento Proporcional            │
│ Configure as proporções...                      │
│                                                  │
│ [Gerenciar]  [Imprimir]  [Resumo]  [Histórico] │
└─────────────────────────────────────────────────┘
```

**Características:**
- ✅ SEM badge de edição
- ✅ SEM botão "Novo Orçamento"
- ✅ Botão salvar mostra "Salvar Orçamento"

---

## 🔧 Exemplos Práticos

### Exemplo 1: Editar Quantidade de Produto

```
ANTES (ERRADO):
1. Abrir orçamento: Pão de Sal - 3,330 kg
2. Alterar para: 5,000 kg
3. Salvar
   ↓
   ❌ CRIAVA novo orçamento (duplicata)

AGORA (CORRETO):
1. Abrir orçamento: Pão de Sal - 3,330 kg
2. Alterar para: 5,000 kg
3. Salvar
   ↓
   ✅ ATUALIZA o mesmo orçamento (sem duplicata)
```

---

### Exemplo 2: Abrir, Ver e Fechar

```
ANTES (ERRADO):
1. Abrir orçamento apenas para visualizar
2. NÃO alterar nada
3. Salvar
   ↓
   ❌ CRIAVA duplicata do mesmo orçamento

AGORA (CORRETO):
1. Abrir orçamento apenas para visualizar
2. NÃO alterar nada
3. Salvar
   ↓
   ✅ MANTÉM o mesmo orçamento (sem duplicata)
```

---

### Exemplo 3: Editar e Criar Novo

```
1. Abrir orçamento existente (Cliente: Padaria ABC)
2. Indicador: "Editando orçamento existente" 🟠
3. Clicar em "Novo Orçamento" (botão azul)
4. Formulário limpa
5. Indicador desaparece
6. Preencher novo cliente (Cliente: Padaria XYZ)
7. Salvar
   ↓
   ✅ CRIA novo orçamento para Padaria XYZ
   ✅ Orçamento da Padaria ABC continua inalterado
```

---

## 🔍 Como Funciona Tecnicamente

### Estado de Controle

```tsx
const [orcamentoEmEdicaoId, setOrcamentoEmEdicaoId] = useState<string | null>(null);
```

**null** = Criando novo orçamento  
**"abc123"** = Editando orçamento existente (ID)

---

### Função Reabrir Orçamento

```tsx
const reabrirOrcamento = (orcamento: OrcamentoHistorico) => {
  // 1. Guarda ID do orçamento
  setOrcamentoEmEdicaoId(orcamento.id); // ← IMPORTANTE!

  // 2. Carrega dados no formulário
  setClienteSelecionado(orcamento.clienteId);
  setDataInicial(orcamento.dataInicial);
  // ... etc
};
```

---

### Função Salvar Orçamento

```tsx
const salvarOrcamento = async () => {
  // Validações...

  // Se estiver editando (tem ID), ATUALIZA
  if (orcamentoEmEdicaoId) {
    await orcamentosAPI.atualizar(orcamentoEmEdicaoId, orcamento);
    toast.success("Orçamento atualizado com sucesso!");
  }
  // Caso contrário, CRIA novo
  else {
    await orcamentosAPI.criar(orcamento);
    toast.success("Orçamento salvo com sucesso!");
  }

  // Limpa ID após salvar
  setOrcamentoEmEdicaoId(null);
};
```

---

### Função Novo Orçamento

```tsx
const novoOrcamento = () => {
  // Limpa ID de edição
  setOrcamentoEmEdicaoId(null); // ← Volta para modo "criar"

  // Limpa formulário
  setClienteSelecionado("");
  setItens([]);
  // ... etc

  toast.success("Formulário limpo! Você pode criar um novo orçamento.");
};
```

---

## 📊 Fluxograma

```
┌─────────────────────────────────────────────────────┐
│ ORÇAMENTOS SALVOS                                   │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│ │ Orçamento 1 │  │ Orçamento 2 │  │ Orçamento 3 │ │
│ │ [Abrir]     │  │ [Abrir]     │  │ [Abrir]     │ │
│ └─────────────┘  └─────────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ Clicar "Abrir"
                       ↓
        ┌──────────────────────────────┐
        │ Formulário de Orçamento      │
        │ [Editando orçamento...]  🟠  │
        │                               │
        │ Cliente: Padaria ABC          │
        │ Items: Pão - 3,330 kg        │
        │                               │
        │ [Novo] [Salvar/Atualizar]    │
        └───────┬──────────┬────────────┘
                │          │
      Clicar    │          │ Clicar
      "Novo"    │          │ "Atualizar"
                │          │
                ↓          ↓
        ┌───────────┐  ┌──────────────┐
        │ Limpa     │  │ ATUALIZA     │
        │ formulário│  │ mesmo        │
        │           │  │ orçamento ✅ │
        │ Modo:     │  │              │
        │ CRIAR     │  │ ID mantido   │
        │ NOVO ✅   │  └──────────────┘
        └───────────┘
```

---

## 🎯 Benefícios

### ✅ Antes vs Agora

| Situação | ANTES (Bug) | AGORA (Correto) |
|----------|-------------|-----------------|
| Abrir e salvar sem alterar | ❌ Cria duplicata | ✅ Mantém mesmo |
| Abrir e alterar quantidade | ❌ Cria novo | ✅ Atualiza mesmo |
| Abrir e salvar várias vezes | ❌ 10 duplicatas | ✅ 1 orçamento atualizado |
| Editar e criar novo | ❌ Impossível distinguir | ✅ Botão "Novo Orçamento" |

---

## 🚀 Resultado Final

### ✅ **Não há mais duplicatas acidentais**
### ✅ **Edição funciona corretamente**
### ✅ **Indicadores visuais claros**
### ✅ **Botão dinâmico (Salvar/Atualizar)**
### ✅ **Separação clara: Criar vs Editar**

---

**Desenvolvido para Nicolina - Gestão de Encomendas**  
_Sistema profissional com controle inteligente de orçamentos_
