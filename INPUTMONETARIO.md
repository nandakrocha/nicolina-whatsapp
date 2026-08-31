# 💰 InputMonetario - Guia de Uso

## 📖 Sobre

Componente de input monetário profissional para valores em Real (R$) com comportamento de edição otimizado.

**Criado por:** Sistema Nicolina  
**Arquivo:** `/src/app/components/InputMonetario.tsx`  
**Utilitários:** `/src/app/utils/mascaraMonetaria.ts`

---

## ✨ Características

### ✅ Comportamento Correto

- **onFocus**: Remove formatação, mostra valor editável (ex: "1.234,56" → "1234,56")
- **onChange**: Permite digitação livre, aceita apenas números e vírgula
- **onBlur**: Formata automaticamente no padrão pt-BR (ex: "50" → "50,00")

### 🎯 Vantagens

✅ Edição natural (não "briga" com o usuário)  
✅ Formatação automática ao sair do campo  
✅ Seleção automática do texto ao focar  
✅ Sempre 2 casas decimais  
✅ Vírgula como separador decimal  
✅ Ponto como separador de milhar (acima de 999)

---

## 🚀 Como Usar

### Exemplo Básico

```tsx
import { InputMonetario } from "../components/InputMonetario";

function MeuComponente() {
  const [preco, setPreco] = useState(0);

  return (
    <InputMonetario
      valor={preco}
      onChange={(novoValor) => setPreco(novoValor)}
      placeholder="0,00"
    />
  );
}
```

### Exemplo Completo com Label

```tsx
import { InputMonetario } from "../components/InputMonetario";
import { Label } from "./ui/label";

function FormularioProduto() {
  const [preco, setPreco] = useState(0);

  return (
    <div className="space-y-2">
      <Label htmlFor="preco">Preço Unitário (R$)</Label>
      <InputMonetario
        id="preco"
        valor={preco}
        onChange={(novoValor) => setPreco(novoValor)}
        placeholder="0,00"
        className="text-right"
      />
    </div>
  );
}
```

---

## 📋 Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `valor` | `number` | ✅ Sim | Valor numérico atual |
| `onChange` | `(valor: number) => void` | ✅ Sim | Callback chamado com novo valor |
| `placeholder` | `string` | ❌ Não | Placeholder (padrão: "0,00") |
| `className` | `string` | ❌ Não | Classes CSS adicionais |
| `id` | `string` | ❌ Não | ID do input |
| `disabled` | `boolean` | ❌ Não | Desabilita o input |

---

## 🔧 Arquivos Atualizados

Já implementado em:

1. ✅ `/src/app/pages/GerenciarProdutosOrcamento.tsx` - Campo de preço unitário
2. ✅ `/src/app/components/GeradorOrcamento.tsx` - Valor total do orçamento
3. ✅ `/src/app/pages/Produtos.tsx` - Campo de preço do produto

---

## 🧪 Testes de Comportamento

### Cenário 1: Digitação Normal
- **Entrada:** Usuário digita "50"
- **Durante:** Campo mostra "50"
- **Ao sair:** Campo formata para "50,00"

### Cenário 2: Edição de Valor Existente
- **Inicial:** Campo mostra "3,33"
- **Ao focar:** Campo muda para "3,33" (editável)
- **Usuário digita:** "50"
- **Ao sair:** Campo formata para "50,00" ✅

### Cenário 3: Valores com Decimal
- **Entrada:** Usuário digita "3,3"
- **Durante:** Campo mostra "3,3"
- **Ao sair:** Campo formata para "3,30"

### Cenário 4: Valores Grandes
- **Entrada:** Usuário digita "1234,56"
- **Durante:** Campo mostra "1234,56"
- **Ao sair:** Campo formata para "1.234,56"

---

## 🛠️ Funções Utilitárias

Disponíveis em `/src/app/utils/mascaraMonetaria.ts`:

```tsx
import {
  removerFormatacaoMonetaria,
  sanitizarInputMonetario,
  formatarMonetarioBlur,
  converterMascaraParaNumero,
  formatarNumeroParaMascara,
} from "../utils/mascaraMonetaria";
```

### `formatarNumeroParaMascara(numero: number): string`
Converte número para string formatada  
**Exemplo:** `1234.56` → `"1.234,56"`

### `converterMascaraParaNumero(valor: string): number`
Converte string formatada para número  
**Exemplo:** `"1.234,56"` → `1234.56`

### `removerFormatacaoMonetaria(valor: string): string`
Remove pontos de milhar  
**Exemplo:** `"1.234,56"` → `"1234,56"`

### `sanitizarInputMonetario(valor: string): string`
Remove caracteres inválidos durante digitação  
**Exemplo:** `"abc123,45xyz"` → `"123,45"`

### `formatarMonetarioBlur(valor: string): string`
Formata valor ao sair do campo (onBlur)  
**Exemplo:** `"50"` → `"50,00"`

---

## ⚠️ Importante

### ❌ NÃO FAZER

```tsx
// ❌ ERRADO - Usar type="number"
<Input type="number" step="0.01" />

// ❌ ERRADO - Aplicar máscara no onChange
onChange={(e) => {
  const formatado = aplicarMascara(e.target.value);
  setValue(formatado); // Causa bug de edição
}}
```

### ✅ FAZER

```tsx
// ✅ CORRETO - Usar InputMonetario
<InputMonetario
  valor={preco}
  onChange={(novoValor) => setPreco(novoValor)}
/>
```

---

## 🐛 Solução de Problemas

### Problema: Campo aceita letras
**Solução:** Verifique se está usando `InputMonetario`, não `Input` comum

### Problema: Formatação aparece durante digitação
**Solução:** Use `InputMonetario` que só formata no onBlur

### Problema: Editar valor existente gera valor errado
**Solução:** Esse era o bug original. `InputMonetario` resolve isso

---

## 📚 Referências

- Padrão pt-BR: `toLocaleString('pt-BR')`
- Separador decimal: vírgula (`,`)
- Separador de milhar: ponto (`.`)
- Casas decimais: sempre 2

---

**Desenvolvido para Nicolina - Gestão de Encomendas**  
_Sistema de padaria profissional com inputs monetários otimizados_
