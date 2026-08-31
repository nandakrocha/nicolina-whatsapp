# 🍞 Nicolina – Sistema de Gestão de Encomendas

Sistema completo de gestão de encomendas para padarias, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## ✨ Características Principais

### 🎨 Interface Moderna e Intuitiva
- Menu lateral fixo sempre visível (desktop) e responsivo (mobile)
- Design profissional com paleta de cores customizada (#084d6e)
- Modo claro e modo escuro
- Animações suaves e transições elegantes
- Emojis para identificação visual rápida

### 📦 Gestão Completa de Encomendas
- **Formulário expansível** sem pop-ups, diretamente na tela
- **Campos 100% opcionais** - salve encomendas incompletas
- **Cálculo automático** de peso total em gramas e quilos
- **Status dinâmicos**: Pendente, Em Produção, Pronto, Entregue, Cancelado
- **Edição inline** - altere status diretamente na lista
- **Duplicação rápida** de encomendas
- **Impressão individual** formatada para cada encomenda
- **Filtros avançados**: por status, data, cliente, produto
- **Ordenação múltipla**: data, cliente, peso
- **Busca em tempo real**
- **Exportação para Excel (CSV)**

### 📊 Dashboard Inteligente
- **Totais por categoria** (Pão de Sal, Pão Doce, Mini Sal, Mini Doce, Outros)
- **Separação automática** por Hoje e Amanhã
- **Gráfico de barras**: Produção próximos 7 dias
- **Gráfico de pizza**: Distribuição por status
- **Top 5 produtos** mais vendidos
- **Alertas de encomendas pendentes**
- **Resumo geral** com estatísticas

### 📈 Relatórios Avançados
- **Filtros personalizados**: data, hora, cliente, produto
- **Períodos rápidos**: Hoje, Amanhã, Semana, Mês, Todos
- **Gráfico de linha**: Encomendas ao longo do tempo
- **Gráfico de barras**: Peso total por data
- **Cálculos automáticos**: total, peso, média
- **Exportação Excel**
- **Impressão completa**

### 🍞 Cadastro de Produtos
- **Tabela dinâmica** com edição inline
- Campos: código, nome, peso por unidade, status ativo/inativo
- **Criação rápida** diretamente na tabela
- Ordenação alfabética automática

### 👥 Cadastro de Clientes
- **Tabela dinâmica** com edição inline
- Campos: nome, telefone, email, endereço
- **Criação rápida** diretamente na tabela
- Ordenação alfabética automática

### 💾 Backup Completo
- **Backup manual** com um clique
- **Histórico completo** de backups
- **Download em JSON**
- **Restauração fácil** com confirmação
- **Sincronização automática** com servidor

### ⚙️ Configurações Personalizáveis
- Nome da empresa
- Intervalo de sincronização
- Notificações ativadas/desativadas
- Backup automático
- Exibição de emojis

### 🔄 Sincronização em Tempo Real
- **Atualização automática** a cada 3 segundos (configurável)
- **Funciona em múltiplos dispositivos** simultaneamente
- **Indicador visual** de status de conexão
- **100% online** desde o início

### 📱 Totalmente Responsivo
- Layout adaptado para desktop, tablet e mobile
- Menu hambúrguer no mobile
- Touch gestures otimizados
- Grid responsivo em todas as telas

## 🚀 Tecnologias Utilizadas

- **React** 18.3.1
- **TypeScript**
- **React Router** 7.13.0 (Data Mode)
- **Tailwind CSS** 4.x
- **Motion (Framer Motion)** para animações
- **Recharts** para gráficos
- **Radix UI** para componentes acessíveis
- **Supabase** para backend
- **Lucide React** para ícones
- **Next Themes** para modo escuro
- **Sonner** para notificações

## 📋 Estrutura do Projeto

```
/src
  /app
    /components
      - Layout.tsx (Menu lateral e estrutura principal)
      - AjudaRapida.tsx (Modal de ajuda com atalhos)
      - IndicadorSincronizacao.tsx (Status de conexão)
      - DataInitializer.tsx (Dados iniciais)
      - Loading.tsx (Componentes de carregamento)
      /ui (Componentes Radix UI)
    /pages
      - DashboardMelhorado.tsx
      - EncomendasMelhorado.tsx
      - Produtos.tsx
      - Clientes.tsx
      - RelatoriosMelhorado.tsx
      - Backup.tsx
      - Configuracoes.tsx
    /hooks
      - useAPI.ts (API e sincronização)
    - App.tsx (Componente principal)
    - routes.ts (Configuração de rotas)
  /styles
    - theme.css (Tema customizado)
    - fonts.css
    - index.css
    - tailwind.css
/supabase
  /functions
    /server
      - index.tsx (Backend Hono)
      - kv_store.tsx (Banco de dados)
```

## 🎯 Funcionalidades Especiais

### Atalhos de Teclado
- **Ctrl/Cmd + H**: Abrir ajuda
- **ESC**: Fechar modais
- **Enter**: Adicionar produto no formulário

### Dados Iniciais
O sistema cria automaticamente:
- **8 produtos** (Pão de Sal Francês, Italiano, Pão Doce, Mini Pão, etc.)
- **5 clientes** de exemplo

### Inteligência do Sistema
- **Categorização automática** de produtos
- **Cálculos automáticos** de peso
- **Sugestões de top produtos**
- **Previsão de produção** para próximos 7 dias

## 🔐 Backend e Dados

### Estrutura de Dados

**Encomenda:**
```typescript
{
  id: string
  data?: string
  hora?: string
  clienteId?: string
  clienteNome?: string
  observacao?: string
  produtos?: ProdutoEncomenda[]
  pesoTotalGramas?: number
  pesoTotalKg?: number
  status?: "pendente" | "em_producao" | "pronto" | "entregue" | "cancelado"
  criadoEm: string
  atualizadoEm: string
}
```

**Produto:**
```typescript
{
  id: string
  codigo?: string
  nome: string
  pesoPorUnidadeKg: number
  ativo?: boolean
  criadoEm: string
  atualizadoEm: string
}
```

**Cliente:**
```typescript
{
  id: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  criadoEm: string
  atualizadoEm: string
}
```

### API Routes

**Encomendas:**
- GET `/encomendas` - Listar todas
- GET `/encomendas/:id` - Buscar por ID
- POST `/encomendas` - Criar
- PUT `/encomendas/:id` - Atualizar
- DELETE `/encomendas/:id` - Excluir

**Produtos:**
- GET `/produtos` - Listar todos
- GET `/produtos/:id` - Buscar por ID
- POST `/produtos` - Criar
- PUT `/produtos/:id` - Atualizar
- DELETE `/produtos/:id` - Excluir

**Clientes:**
- GET `/clientes` - Listar todos
- GET `/clientes/:id` - Buscar por ID
- POST `/clientes` - Criar
- PUT `/clientes/:id` - Atualizar
- DELETE `/clientes/:id` - Excluir

**Backup:**
- POST `/backup` - Criar backup
- GET `/backups` - Listar backups
- GET `/backups/:timestamp` - Buscar backup
- POST `/backups/:timestamp/restore` - Restaurar backup

## 📱 Uso do Sistema

### 1. Adicionar uma Encomenda
1. Clique em "Nova Encomenda"
2. Preencha os dados (data, hora, cliente)
3. Adicione produtos com quantidade
4. O peso é calculado automaticamente
5. Clique em "Salvar Encomenda"

### 2. Acompanhar Produção
1. Acesse o Dashboard
2. Visualize totais por categoria
3. Confira encomendas pendentes
4. Veja os gráficos de previsão

### 3. Gerar Relatórios
1. Acesse a página de Relatórios
2. Aplique os filtros desejados
3. Visualize os gráficos
4. Exporte para Excel ou imprima

### 4. Fazer Backup
1. Acesse a página de Backup
2. Clique em "Criar Backup"
3. O backup é criado instantaneamente
4. Baixe ou restaure quando necessário

## 🎨 Personalização

### Cores Principais
- **Primary**: #084d6e (Azul escuro)
- **Sidebar**: #084d6e
- **Background**: Branco/Preto (modo claro/escuro)

### Ajustar Intervalo de Sincronização
1. Acesse Configurações
2. Altere "Intervalo de Sincronização"
3. Escolha entre 1s, 3s, 5s, 10s ou 30s
4. Salve e recarregue a página

## 🛠️ Manutenção

### Limpar Dados
```javascript
// No console do navegador
localStorage.clear()
// Recarregue a página
```

### Reinicializar Dados
```javascript
// No console do navegador
localStorage.removeItem('nicolina_inicializado')
// Recarregue a página
```

## 🌟 Melhorias Futuras Sugeridas

- [ ] Notificações push
- [ ] Integração com WhatsApp
- [ ] Relatório de lucro
- [ ] Gestão de estoque
- [ ] Sistema de pedidos online
- [ ] App mobile nativo
- [ ] Impressora térmica
- [ ] QR Code para pedidos

## 📄 Licença

Sistema desenvolvido para uso interno da padaria.

## 🤝 Suporte

Para suporte, acesse a Central de Ajuda (botão flutuante no canto inferior direito) ou pressione **Ctrl+H**.

---

**Desenvolvido com ❤️ e 🍞**
