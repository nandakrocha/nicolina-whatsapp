# ⚙️ CONFIGURAÇÕES DE ENCOMENDAS - v2.4.0

## ✅ IMPLEMENTADO

Foi adicionado um sistema completo de **Configurações** na página de Encomendas, com persistência em LocalStorage.

---

## 🎯 COMO ACESSAR

1. Vá para a página **Encomendas**
2. Clique no botão **⚙️ Configurações** (ao lado dos botões Tabela/Cards)
3. Um dialog abrirá com todas as opções disponíveis

---

## 📋 OPÇÕES DISPONÍVEIS

### 👁️ **EXIBIÇÃO**

#### 1. Mostrar Peso dos Produtos
- **Descrição:** Exibir informações de peso unitário e total
- **Padrão:** Ativado
- **Quando desativado:** Oculta as colunas de peso nas tabelas e cards

#### 2. Mostrar Código dos Produtos
- **Descrição:** Exibir código junto ao nome do produto
- **Padrão:** Ativado
- **Quando desativado:** Mostra apenas o nome, sem o código

#### 3. Modo Compacto
- **Descrição:** Reduzir espaçamentos para visualizar mais informações
- **Padrão:** Desativado
- **Quando ativado:** Reduz padding e margens em cards e tabelas

---

### ⚡ **COMPORTAMENTO**

#### 1. Confirmar Exclusão
- **Descrição:** Solicitar confirmação antes de excluir encomendas
- **Padrão:** Ativado
- **Quando desativado:** Exclui diretamente sem confirmação (CUIDADO!)

#### 2. Itens por Página (Tabela)
- **Descrição:** Quantidade de encomendas exibidas por vez
- **Padrão:** 10
- **Range:** 5 a 100
- **Incremento:** 5
- **Uso Futuro:** Para implementar paginação

---

### 🕐 **HORÁRIOS PADRÃO**

#### 1. Início do Expediente
- **Descrição:** Horário de abertura da padaria
- **Padrão:** 08:00
- **Uso:** Filtros rápidos e sugestões de horário

#### 2. Fim do Expediente
- **Descrição:** Horário de fechamento da padaria
- **Padrão:** 18:00
- **Uso:** Filtros rápidos e validações

---

## 💾 **PERSISTÊNCIA**

Todas as configurações são salvas em:
```
localStorage.getItem("nicolina_config_encomendas")
```

**Estrutura do JSON:**
```json
{
  "itensPorPagina": 10,
  "mostrarPeso": true,
  "mostrarCodigo": true,
  "confirmarExclusao": true,
  "modoCompacto": false,
  "horaInicioPadrao": "08:00",
  "horaFimPadrao": "18:00"
}
```

---

## 🔄 **CARREGAMENTO**

As configurações são carregadas automaticamente ao abrir a página:

1. **useEffect** chama `carregarConfiguracoes()` na montagem do componente
2. Se não existir configuração salva, usa valores padrão
3. Aplica as configurações imediatamente

---

## 💾 **SALVAMENTO**

Ao clicar em "Salvar Configurações":

1. Cria objeto com todas as configurações atuais
2. Salva no `localStorage`
3. Exibe toast de sucesso: "⚙️ Configurações salvas com sucesso!"
4. Fecha o dialog automaticamente

---

## 🎨 **INTERFACE**

### **Botões de Toggle**
- ✓ Ativado = Botão azul (variant="default")
- ✗ Desativado = Botão cinza outline (variant="outline")

### **Seções**
- 👁️ Exibição
- ⚡ Comportamento
- 🕐 Horários Padrão

### **Dica**
Banner azul no final com:
> 💡 Dica: As configurações são salvas automaticamente no seu navegador e aplicadas imediatamente.

---

## 🚀 **PRÓXIMOS PASSOS (SUGESTÕES)**

### **1. Aplicar as Configurações na Interface**

Atualmente, as configurações são salvas mas **não estão sendo aplicadas**. Para implementar:

#### **configMostrarPeso**
```tsx
{configMostrarPeso && (
  <>
    <th>Peso Un.</th>
    <th>Peso Total</th>
  </>
)}
```

#### **configMostrarCodigo**
```tsx
{configMostrarCodigo && produto.codigo 
  ? `${produto.codigo} - ${produto.nome}` 
  : produto.nome
}
```

#### **configModoCompacto**
```tsx
<Card className={configModoCompacto ? "p-2" : "p-6"}>
```

#### **configConfirmarExclusao**
```tsx
const excluirEncomenda = (id: string) => {
  if (configConfirmarExclusao) {
    // Mostrar AlertDialog
  } else {
    // Excluir direto
    excluirDireto(id);
  }
};
```

### **2. Adicionar Mais Configurações**

- 🌙 **Tema padrão** (claro/escuro/auto)
- 🔔 **Som de notificações**
- 📧 **Email para backup automático**
- ⏰ **Intervalo de horários** (15min, 30min, 1h)
- 📊 **Visualização padrão** (cards ou tabela)
- 🎨 **Cor de destaque** (personalizar cor primária)

### **3. Adicionar Reset de Configurações**

```tsx
<Button 
  variant="destructive" 
  onClick={resetarConfiguracoes}
>
  🔄 Restaurar Padrão
</Button>
```

---

## 📸 **PREVIEW DA INTERFACE**

```
┌────────────────────────────────────────────────┐
│  ⚙️ Configurações de Encomendas         [X]    │
├────────────────────────────────────────────────┤
│  Personalize a aparência e comportamento       │
│                                                │
│  👁️ Exibição                                   │
│  ───────────────────────────────────────────   │
│  Mostrar Peso dos Produtos                     │
│  Exibir informações de peso unitário e total   │
│                              [✓ Ativado]       │
│                                                │
│  Mostrar Código dos Produtos                   │
│  Exibir código junto ao nome do produto        │
│                              [✓ Ativado]       │
│                                                │
│  Modo Compacto                                 │
│  Reduzir espaçamentos                          │
│                              [✗ Desativado]    │
│                                                │
│  ⚡ Comportamento                               │
│  ───────────────────────────────────────────   │
│  Confirmar Exclusão                            │
│  Solicitar confirmação antes de excluir        │
│                              [✓ Ativado]       │
│                                                │
│  Itens por Página (Tabela)                     │
│  Quantidade de encomendas exibidas por vez     │
│  [10]                                          │
│                                                │
│  🕐 Horários Padrão                            │
│  ───────────────────────────────────────────   │
│  Início: [08:00]    Fim: [18:00]               │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │ 💡 Dica: As configurações são salvas   │   │
│  │ automaticamente no seu navegador       │   │
│  └────────────────────────────────────────┘   │
│                                                │
│  [⚙️ Salvar Configurações]  [Cancelar]         │
└────────────────────────────────────────────────┘
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [x] Criar estados para todas configurações
- [x] Criar função `carregarConfiguracoes()`
- [x] Criar função `salvarConfiguracoes()`
- [x] Adicionar botão "Configurações" no header
- [x] Criar Dialog de Configurações
- [x] Adicionar todas as opções de exibição
- [x] Adicionar todas as opções de comportamento
- [x] Adicionar configurações de horários
- [x] Adicionar persistência em localStorage
- [x] Adicionar toast de confirmação
- [x] Adicionar ícones e emojis
- [ ] Aplicar configurações na interface real
- [ ] Adicionar opção de reset
- [ ] Adicionar mais configurações avançadas

---

**Versão:** 2.4.0  
**Data:** 09/03/2026  
**Status:** ✅ **INTERFACE COMPLETA - FALTAM APLICAÇÕES**  
**Próximo:** Aplicar as configurações na renderização dos componentes
