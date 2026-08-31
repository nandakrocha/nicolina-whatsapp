/**
 * 🔔 Sistema de Notificações Automáticas de Pedidos
 * 
 * Sistema automático que monitora encomendas e envia notificações
 * 30 minutos antes do horário de entrega/retirada.
 * 
 * Funcionalidades:
 * - Agendamento automático de notificações
 * - Dispara exatamente 30 minutos antes do horário do pedido
 * - Controle de notificações já enviadas (evita duplicatas)
 * - Recalcula automaticamente ao editar horários
 * - Persistência no localStorage
 * - Suporta múltiplos horários por pedido
 * - ✨ NOVO: Funciona em background via Service Worker (mesmo com app fechado!)
 */

import { toast } from "sonner";
import {
  agendarNotificacaoBackground,
  cancelarNotificacaoBackground,
  cancelarTodasNotificacoesBackground,
  isServiceWorkerAtivo,
} from "./serviceWorkerManager";

// Função para obter tempo de antecedência configurado (padrão: 30 minutos)
function obterTempoAntecedencia(): number {
  try {
    const config = localStorage.getItem('nicolina_config_notificacoes');
    if (config) {
      const parsed = JSON.parse(config);
      return (parsed.tempoAntecedencia || 30) * 60 * 1000; // Converter para ms
    }
  } catch (error) {
    console.error("Erro ao ler configuração:", error);
  }
  return 30 * 60 * 1000; // Padrão: 30 minutos
}

// Função para verificar se som está habilitado
function isSomHabilitado(): boolean {
  try {
    const config = localStorage.getItem('nicolina_config_notificacoes');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.somHabilitado !== false; // Habilitado por padrão
    }
  } catch (error) {
    console.error("Erro ao ler configuração:", error);
  }
  return true;
}

// Função para verificar se push está habilitado
function isPushHabilitado(): boolean {
  try {
    const config = localStorage.getItem('nicolina_config_notificacoes');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.pushHabilitado === true;
    }
  } catch (error) {
    console.error("Erro ao ler configuração:", error);
  }
  return false;
}

// Chave para armazenar notificações enviadas no localStorage
const CHAVE_NOTIFICACOES_ENVIADAS = "nicolina_notificacoes_enviadas";

// Mapa de notificações agendadas (timeouts)
const notificacoesAgendadas = new Map<string, NodeJS.Timeout>();

/**
 * Cria uma chave única para identificar uma notificação
 */
function criarChaveNotificacao(encomendaId: string, horario: string): string {
  return `${encomendaId}_${horario}`;
}

/**
 * Verifica se uma notificação já foi enviada
 */
function foiEnviada(chave: string): boolean {
  try {
    const enviadas = JSON.parse(localStorage.getItem(CHAVE_NOTIFICACOES_ENVIADAS) || "{}");
    return !!enviadas[chave];
  } catch (error) {
    return false;
  }
}

/**
 * Marca uma notificação como enviada
 */
function marcarComoEnviada(chave: string): void {
  try {
    const enviadas = JSON.parse(localStorage.getItem(CHAVE_NOTIFICACOES_ENVIADAS) || "{}");
    enviadas[chave] = Date.now();
    localStorage.setItem(CHAVE_NOTIFICACOES_ENVIADAS, JSON.stringify(enviadas));
    
    // Limpar notificações antigas (mais de 7 dias)
    limparNotificacoesAntigas();
  } catch (error) {
    console.error("Erro ao marcar notificação como enviada:", error);
  }
}

/**
 * Limpa notificações enviadas há mais de 7 dias
 */
function limparNotificacoesAntigas(): void {
  try {
    const enviadas = JSON.parse(localStorage.getItem(CHAVE_NOTIFICACOES_ENVIADAS) || "{}");
    const agora = Date.now();
    const seteDias = 7 * 24 * 60 * 60 * 1000;
    
    let removidas = 0;
    Object.keys(enviadas).forEach(chave => {
      if (agora - enviadas[chave] > seteDias) {
        delete enviadas[chave];
        removidas++;
      }
    });
    
    if (removidas > 0) {
      localStorage.setItem(CHAVE_NOTIFICACOES_ENVIADAS, JSON.stringify(enviadas));
      console.log(`🧹 ${removidas} notificação(ões) antiga(s) removida(s)`);
    }
  } catch (error) {
    console.error("Erro ao limpar notificações antigas:", error);
  }
}

/**
 * Calcula o timestamp para disparar a notificação
 */
function calcularTimestampNotificacao(data: string, horario: string): number | null {
  try {
    // Formato esperado: data = "2026-03-18", horario = "06:00"
    const [hora, minuto] = horario.split(':').map(Number);
    const dataHorario = new Date(data);
    dataHorario.setHours(hora, minuto, 0, 0);
    
    const tempoAntecedencia = obterTempoAntecedencia();
    const timestampNotificacao = dataHorario.getTime() - tempoAntecedencia;
    
    return timestampNotificacao;
  } catch (error) {
    console.error("Erro ao calcular timestamp:", error);
    return null;
  }
}

/**
 * Formata lista de produtos para exibição
 */
function formatarProdutos(produtos: any[]): string {
  if (!produtos || produtos.length === 0) {
    return "Nenhum produto";
  }
  
  const primeiros = produtos.slice(0, 3);
  const resumo = primeiros.map(p => `${p.quantidade}x ${p.produtoNome}`).join(", ");
  
  if (produtos.length > 3) {
    return `${resumo} e mais ${produtos.length - 3}`;
  }
  
  return resumo;
}

/**
 * Dispara uma notificação
 */
function dispararNotificacao(encomenda: any, horario: string): void {
  const chave = criarChaveNotificacao(encomenda.id, horario);
  
  // Verificar se já foi enviada
  if (foiEnviada(chave)) {
    console.log(`⏭️ Notificação já enviada: ${chave}`);
    return;
  }
  
  console.log(`🔔 Disparando notificação: ${encomenda.clienteNome} - ${horario}`);
  
  const produtos = formatarProdutos(encomenda.produtos || encomenda.itens);
  const mensagem = `${encomenda.clienteNome} - ${horario}\\n${produtos}`;
  
  // ❌ SOM DESABILITADO - Apenas notificação push em background
  // if (isSomHabilitado()) {
  //   try {
  //     const audio = new Audio();
  //     audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  //     audio.volume = 0.8;
  //     audio.play().then(() => {
  //       console.log("✅ Som tocado via Audio()");
  //       setTimeout(() => audio.play(), 200);
  //       setTimeout(() => audio.play(), 400);
  //     }).catch(err => {
  //       console.warn("❌ Não foi possível tocar som:", err);
  //     });
  //   } catch (error) {
  //     console.error("❌ Erro geral ao tocar som:", error);
  //   }
  // }
  
  // ❌ TOAST DESABILITADO - Apenas notificação push em background
  // toast.warning(mensagem, {
  //   duration: 10000,
  //   position: "top-center",
  //   description: "⏰ Pedido próximo do horário!",
  // });
  
  // Push notification (única notificação ativa)
  if (isPushHabilitado() && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("🔔 Nicolina - Pedido Próximo!", {
        body: mensagem,
        icon: "/favicon.ico",
        tag: chave,
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
      console.log("✅ Notificação push enviada");
    } catch (error) {
      console.error("Erro ao exibir push notification:", error);
    }
  } else {
    console.log("⚠️ Push notifications não habilitadas ou sem permissão");
  }
  
  // Marcar como enviada
  marcarComoEnviada(chave);
  
  // Remover do mapa de agendadas
  notificacoesAgendadas.delete(chave);
}

/**
 * Agenda uma notificação para um pedido
 */
function agendarNotificacao(encomenda: any, horario: string): void {
  const chave = criarChaveNotificacao(encomenda.id, horario);
  
  // Verificar se já foi enviada
  if (foiEnviada(chave)) {
    return;
  }
  
  // Calcular timestamp
  const timestamp = calcularTimestampNotificacao(encomenda.data, horario);
  if (!timestamp) {
    return;
  }
  
  const agora = Date.now();
  const delay = timestamp - agora;
  
  // Ignorar se já passou do horário
  if (delay < 0) {
    return;
  }
  
  // Cancelar notificação anterior se existir
  if (notificacoesAgendadas.has(chave)) {
    clearTimeout(notificacoesAgendadas.get(chave)!);
  }
  
  // Agendar nova notificação
  const timeout = setTimeout(() => {
    dispararNotificacao(encomenda, horario);
  }, delay);
  
  notificacoesAgendadas.set(chave, timeout);
  
  const minutosRestantes = Math.round(delay / 60000);
  console.log(`⏰ Notificação agendada: ${encomenda.clienteNome} - ${horario} (em ${minutosRestantes} min)`);
}

/**
 * Processa e agenda notificações para uma lista de encomendas
 */
export function processarEncomendas(encomendas: any[]): void {
  if (!encomendas || encomendas.length === 0) {
    return;
  }
  
  console.log(`🔄 Processando ${encomendas.length} encomenda(s) para notificações...`);
  
  let agendadas = 0;
  
  encomendas.forEach(encomenda => {
    // Suportar tanto horarios (array) quanto hora (string antiga)
    const horarios = encomenda.horarios || [encomenda.hora];
    
    horarios.forEach((horario: string) => {
      if (horario && encomenda.data) {
        agendarNotificacao(encomenda, horario);
        agendadas++;
        
        // Agendar notificação em background (Service Worker)
        if (isServiceWorkerAtivo()) {
          const chave = criarChaveNotificacao(encomenda.id, horario);
          const timestamp = calcularTimestampNotificacao(encomenda.data, horario);
          
          if (timestamp && timestamp > Date.now()) {
            agendarNotificacaoBackground(chave, encomenda, horario, timestamp);
          }
        }
      }
    });
  });
  
  console.log(`✅ ${agendadas} notificação(ões) processada(s)`);
}

/**
 * Cancela todas as notificações agendadas
 */
export function cancelarTodasNotificacoes(): void {
  console.log("🗑️ Cancelando todas as notificações...");
  
  notificacoesAgendadas.forEach((timeout, chave) => {
    clearTimeout(timeout);
    cancelarNotificacaoBackground(chave);
  });
  
  notificacoesAgendadas.clear();
  cancelarTodasNotificacoesBackground();
  
  console.log("✅ Todas as notificações canceladas");
}

/**
 * Solicita permissão para notificações push do navegador
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("⚠️ Este navegador não suporta notificações");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("✅ Permissão para notificações concedida!");
      return true;
    } else {
      console.log("❌ Permissão para notificações negada");
      return false;
    }
  } catch (error) {
    console.error("Erro ao solicitar permissão:", error);
    return false;
  }
}

/**
 * Verifica se as notificações estão habilitadas
 */
export function isNotificacoesHabilitadas(): boolean {
  const config = localStorage.getItem('nicolina_config_notificacoes');
  if (config) {
    try {
      const parsed = JSON.parse(config);
      return parsed.habilitado !== false;
    } catch (error) {
      return true;
    }
  }
  return true;
}