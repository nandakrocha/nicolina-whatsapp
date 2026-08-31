# 🔔 Sistema de Notificações Automáticas

## Versão 2.88.0 - 📱 NOTIFICAÇÕES EM BACKGROUND

Sistema automático de notificações que dispara lembretes **30 minutos antes** (configurável) do horário de cada pedido.

**✨ NOVO: Funciona mesmo com o aplicativo FECHADO no celular!**

## 📋 Funcionalidades

### ✅ Automático
- Não requer configuração manual
- Ativa automaticamente ao iniciar o sistema
- Sincroniza com todas as encomendas cadastradas

### ⏰ Agendamento Inteligente
- Calcula automaticamente X minutos antes do horário do pedido (configurável: 5-120 min)
- Recalcula quando um horário é editado
- Suporta múltiplos horários por pedido
- Evita duplicatas (cada notificação dispara apenas uma vez)

### 🔔 Notificações
- **Toast visual** no canto superior da tela
- **Som de alerta configurável** (bipe)
- **Push notification do navegador** (mesmo com app fechado!)
- **📱 Service Worker em background** - Funciona no celular mesmo fechado!
- Exibe:
  - Nome do cliente
  - Horário do pedido
  - Resumo dos produtos (primeiros 3 itens)

### 🔄 Sincronização
- Monitora mudanças nas encomendas em tempo real
- Atualiza automaticamente ao criar/editar/excluir pedidos
- Reprocessa a cada 5 minutos para garantir sincronia
- Service Worker verifica a cada 1 minuto (background)

### 💾 Persistência
- Armazena histórico de notificações no localStorage
- Notificações agendadas no IndexedDB (background)
- Limpa automaticamente notificações antigas (>7 dias)
- Sobrevive a recarregamentos da página

## 🎯 Como Funciona

### Exemplo Prático

```
Pedido cadastrado:
- Cliente: João Silva
- Data: 18/03/2026
- Horário: 06:00
- Produtos: 10x Pão Francês, 5x Café

Sistema automaticamente:
1. Calcula: 06:00 - 30 min = 05:30
2. Agenda notificação para 05:30
3. Às 05:30, dispara:
   "⏰ Pedido próximo do horário!"
   "João Silva - 06:00"
   "10x Pão Francês, 5x Café"
```

### Se o horário for editado:

```
Horário alterado de 06:00 para 07:00:

Sistema automaticamente:
1. Cancela notificação das 05:30
2. Recalcula: 07:00 - 30 min = 06:30
3. Agenda nova notificação para 06:30
```

## 🔧 Arquitetura Técnica

### Arquivos Criados

1. **`/src/app/services/notificacoes.ts`**
   - Gerenciamento de agendamento
   - Cálculo de horários
   - Controle de duplicatas
   - Persistência no localStorage
   - Armazenamento de notificações no IndexedDB

2. **`/src/app/hooks/useNotificacoesPedidos.ts`**
   - Hook React para integração
   - Monitora mudanças em encomendas
   - Reprocessamento periódico

3. **`/src/app/App.tsx` (modificado)**
   - Integração silenciosa do hook
   - Carregamento de encomendas
   - Sincronização com eventos do sistema

### Integração

```typescript
// App.tsx
import { useNotificacoesPedidos } from "./hooks/useNotificacoesPedidos";

const [encomendas, setEncomendas] = useState([]);

// Ativa notificações automáticas
useNotificacoesPedidos({ encomendas });
```

## 🎮 Uso

### Não requer ação do usuário!

O sistema funciona automaticamente. Apenas:

1. **Cadastre um pedido** com data e horário
2. **Aguarde** - o sistema agenda automaticamente
3. **Receba a notificação** 30 minutos antes

### Permissões do Navegador

Na primeira vez, o navegador pode solicitar permissão para notificações push:

- **Clique em "Permitir"** para receber notificações mesmo com o sistema minimizado
- **Ou ignore** - as notificações ainda funcionarão dentro do sistema (toasts)

## 📊 Logs do Console

O sistema registra todas as ações no console:

```
🔔 Sistema de Notificações Automáticas iniciado
🔄 Processando 15 encomenda(s) para notificações...
⏰ Notificação agendada: João Silva - 06:00 (em 45 min)
⏰ Notificação agendada: Maria Santos - 08:00 (em 165 min)
✅ 30 notificação(ões) processada(s)
```

Quando uma notificação dispara:

```
🔔 Notificação disparada: João Silva - 06:00
```

## 🛡️ Segurança e Confiabilidade

- ✅ Não altera nenhum dado do sistema
- ✅ Não interfere com funcionalidades existentes
- ✅ Funciona totalmente no frontend (sem backend necessário)
- ✅ Tolerante a falhas (erros são silenciados)
- ✅ Performance otimizada (não sobrecarrega o sistema)

## 🔕 Desabilitando (se necessário)

Para desabilitar temporariamente:

```typescript
// App.tsx
useNotificacoesPedidos({ 
  encomendas, 
  habilitado: false  // ← Desabilita
});
```

## 📝 Notas Importantes

1. **Timezone**: Usa o fuso horário local do navegador
2. **Pedidos passados**: Ignora notificações de horários já passados
3. **Múltiplos horários**: Cria uma notificação para cada horário do pedido
4. **Som**: Pode não funcionar em todos os navegadores (políticas de autoplay)
5. **Push**: Requer permissão explícita do usuário

## 🎉 Benefícios

- ✅ **Zero configuração** - Funciona automaticamente
- ✅ **Zero impacto visual** - Não altera interface
- ✅ **Zero manutenção** - Gerencia tudo sozinho
- ✅ **Lembretes pontuais** - Nunca esqueça um pedido
- ✅ **Sincronização perfeita** - Sempre atualizado

---

**Nicolina v2.88.0** - Sistema de notificações automáticas totalmente integrado! 🚀