# ⚖️ InputPeso - Guia de Uso

## 📖 Sobre

Componente de input para **PESO EM KILOGRAMA (kg)** com formatação brasileira.

**IMPORTANTE:** Este componente NÃO é para valores monetários! Para dinheiro, use `InputMonetario`.

**Criado por:** Sistema Nicolina  
**Arquivo:** `/src/app/components/InputPeso.tsx`  
**Utilitários:** `/src/app/utils/mascaraPeso.ts`

---

## 🎯 Diferença entre InputPeso e InputMonetario

| Característica | InputPeso (⚖️ kg) | InputMonetario (💰 R$) |
|----------------|-------------------|------------------------|
| **Uso** | Quantidade, Peso | Preço, Valor Total |
| **Casas decimais** | 3 (padrão kg) | 2 (padrão R$) |
| **Exemplo** | 3,330 kg | R$ 49,95 |
| **Formatação** | 50 → 50,000 | 50 → 50,00 |
| **Unidade** | kg ou un | R$ (reais) |

---

## ✨ Características

### ✅ Comportamento Correto

- **onFocus**: Remove formatação excessiva
- **onChange**: Permite digitação livre (números e vírgula)
- **onBlur**: Formata automaticamente com 3 casas decimais (kg)

### 🎯 Formatação Automática

```
Digitação → Ao sair do campo
1        → 1,000 kg
1,5      → 1,500 kg
1,60     → 1,600 kg
3,33     → 3,330 kg
50       → 50,000 kg
50,00    → 50,000 kg
```

---

## 🚀 Como Usar

### Exemplo Básico

```tsx
import { InputPeso } from "../components/InputPeso";

function MeuComponente() {
  const [quantidade, setQuantidade] = useState(0);

  return (
    <InputPeso
      valor={quantidade}
      onChange={(novoValor) => setQuantidade(novoValor)}
      unidade="kg"
    />
  );
}
```

### Exemplo Completo - Cálculo de Valor Total

```tsx
import { InputPeso } from "../components/InputPeso";
import { InputMonetario } from "../components/InputMonetario";

function ItemOrcamento() {
  const [quantidade, setQuantidade] = useState(0); // kg
  const [precoUnitario, setPrecoUnitario] = useState(15.00); // R$/kg
  const valorTotal = quantidade * precoUnitario;

  return (
    <div className="space-y-4">
      {/* Campo de PESO (kg) */}
      <div>
        <label>Quantidade (kg)</label>
        <InputPeso
          valor={quantidade}
          onChange={(novaQtd) => setQuantidade(novaQtd)}
          unidade="kg"
        />
      </div>

      {/* Campo de DINHEIRO (R$) */}
      <div>
        <label>Preço Unitário (R$/kg)</label>
        <InputMonetario
          valor={precoUnitario}
          onChange={(novoPreco) => setPrecoUnitario(novoPreco)}
        />
      </div>

      {/* Cálculo automático */}
      <div>
        <strong>Valor Total:</strong> R$ {valorTotal.toFixed(2)}
      </div>
    </div>
  );
}
```

---

## 📋 Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `valor` | `number` | ✅ Sim | Valor numérico da quantidade |
| `onChange` | `(valor: number) => void` | ✅ Sim | Callback com novo valor |
| `unidade` | `"kg" \| "un"` | ❌ Não | Unidade (padrão: "kg") |
| `placeholder` | `string` | ❌ Não | Placeholder (padrão: "0,000") |
| `className` | `string` | ❌ Não | Classes CSS adicionais |
| `id` | `string` | ❌ Não | ID do input |
| `disabled` | `boolean` | ❌ Não | Desabilita o input |

---

## 📐 Unidades Suportadas

### 🔹 kg (Kilograma)
- **Formato:** 3 casas decimais
- **Exemplo:** 3,330 kg
- **Uso:** Produtos vendidos por peso

### 🔹 un (Unidade)
- **Formato:** Número inteiro
- **Exemplo:** 5 un
- **Uso:** Produtos vendidos por unidade

```tsx
// Produto vendido por kg
<InputPeso valor={3.33} onChange={setQtd} unidade="kg" />
// Exibe: 3,330

// Produto vendido por unidade
<InputPeso valor={5} onChange={setQtd} unidade="un" />
// Exibe: 5
```

---

## 🧮 Exemplo Real: Orçamento de Padaria

```tsx
function ItemOrcamentoPadaria() {
  // Estados separados: PESO vs DINHEIRO
  const [quantidadeKg, setQuantidadeKg] = useState(3.33); // ⚖️ PESO
  const [precoKg, setPrecoKg] = useState(15.00);          // 💰 DINHEIRO

  // Cálculo: kg × R$/kg = R$
  const valorTotal = quantidadeKg * precoKg;

  return (
    <div className="border p-4 rounded">
      <h3>Pão de Sal</h3>

      {/* ⚖️ QUANTIDADE (kg) */}
      <div className="mb-2">
        <label>Quantidade</label>
        <InputPeso
          valor={quantidadeKg}
          onChange={setQuantidadeKg}
          unidade="kg"
        />
        <small>kg (peso)</small>
      </div>

      {/* 💰 PREÇO (R$/kg) */}
      <div className="mb-2">
        <label>Preço Unitário</label>
        <InputMonetario
          valor={precoKg}
          onChange={setPrecoKg}
        />
        <small>R$ por kg</small>
      </div>

      {/* 💰 VALOR TOTAL (R$) */}
      <div className="font-bold text-lg">
        Total: R$ {valorTotal.toFixed(2)}
      </div>

      {/* Exemplo de cálculo:
          3,330 kg × R$ 15,00/kg = R$ 49,95
      */}
    </div>
  );
}
```

---

## 🔧 Funções Utilitárias

Disponíveis em `/src/app/utils/mascaraPeso.ts`:

```tsx
import {
  formatarNumeroParaPeso,
  converterPesoParaNumero,
  removerFormatacaoPeso,
  sanitizarInputPeso,
  formatarPesoBlur,
  isPesoValido,
} from "../utils/mascaraPeso";
```

### `formatarNumeroParaPeso(numero: number): string`
Converte número para string formatada  
**Exemplo:** `3.33` → `"3,330"`

### `converterPesoParaNumero(valor: string): number`
Converte string formatada para número  
**Exemplo:** `"3,330"` → `3.33`

### `formatarPesoBlur(valor: string): string`
Formata valor ao sair do campo (onBlur)  
**Exemplo:** `"50"` → `"50,000"`

### `isPesoValido(peso: number): boolean`
Valida se o peso é um número válido e não-negativo

---

## 🧪 Testes de Comportamento

### Cenário 1: Editar 3,33 para 50,00
```
Inicial: 3,330 kg
Ao focar: "3,33" (editável)
Digita: "50"
Ao sair: "50,000" ✅
```

### Cenário 2: Digitar Decimal Incompleto
```
Digita: "1,6"
Ao sair: "1,600" ✅
```

### Cenário 3: Digitar Inteiro
```
Digita: "50"
Ao sair: "50,000" ✅
```

### Cenário 4: Unidade (un)
```
Unidade: "un"
Digita: "5,7"
Ao sair: "6" (arredonda) ✅
```

---

## ⚠️ Importante - Separação de Conceitos

### ❌ ERRADO - Misturar peso com dinheiro

```tsx
// ❌ NÃO FAÇA ISSO
<InputMonetario valor={quantidade} /> // Quantidade não é dinheiro!
<InputPeso valor={preco} />           // Preço não é peso!
```

### ✅ CORRETO - Usar componente apropriado

```tsx
// ✅ FAÇA ASSIM
<InputPeso valor={quantidade} unidade="kg" />     // Para peso
<InputMonetario valor={preco} />                   // Para dinheiro
<InputMonetario valor={valorTotal} />              // Para dinheiro
```

---

## 📊 Tabela de Referência Rápida

| O que você quer? | Use este componente | Exemplo |
|------------------|---------------------|---------|
| Quantidade em kg | `InputPeso` | 3,330 kg |
| Quantidade em un | `InputPeso` unidade="un" | 5 un |
| Preço em R$ | `InputMonetario` | R$ 15,00 |
| Valor total em R$ | `InputMonetario` | R$ 49,95 |
| Proporção % | `Input` type="number" | 25% |

---

## 🔧 Implementado em:

✅ `/src/app/components/GeradorOrcamento.tsx` - Campo de quantidade dos itens

---

## 🐛 Solução de Problemas

### Problema: Quantidade mostra 2 decimais ao invés de 3
**Solução:** Verifique se está usando `InputPeso`, não `Input` comum

### Problema: Quantidade aceita vírgula mas não formata
**Solução:** Use `InputPeso` que formata automaticamente no onBlur

### Problema: Ao editar quantidade, valor fica errado
**Solução:** Esse era o bug original. `InputPeso` resolve isso

---

**Desenvolvido para Nicolina - Gestão de Encomendas**  
_Sistema profissional com separação correta entre PESO (kg) e DINHEIRO (R$)_
