/**
 * VERSÃO ATUAL DO SISTEMA NICOLINA
 * Versão: 2.87.2
 * Data: 18/03/2026
 * 
 * HISTÓRICO:
 * - v2.87.2 (18/03/2026): 🔊 FIX SOM CELULAR - Voltou para Audio() com bipe longo (compatível com mobile)
 * - v2.87.1 (18/03/2026): 🔊 BIPE LONGO - Som substituído por bipe longo de 1.5 segundos (Web Audio API)
 * - v2.87.0 (18/03/2026): 🔔 NOTIFICAÇÕES CONFIGURÁVEIS - Painel de controle com ativar/desativar, tempo personalizável, som/bipe e teste integrado
 * - v2.86.0 (18/03/2026): 🔔 NOTIFICAÇÕES AUTOMÁTICAS - Sistema dispara lembretes 30 min antes do horário do pedido (totalmente automático e integrado)
 * - v2.85.0 (18/03/2026): 🔍 BUSCA SEM ACENTOS - Normalização de texto em todas as páginas (busca "pao" encontra "Pão")
 * - v2.59.2 (12/03/2026): 🔧 FIX AUTO-SYNC - DiagnosticoVersao agora CORRIGE divergências automaticamente
 * - v2.59.1 (12/03/2026): 🔧 FIX CRÍTICO IFRAME - AutoAtualizador com sessionStorage (sem loops infinitos!)
 * - v2.59.0 (12/03/2026): 🔥 REESCRITA TOTAL EMERGENCIAL - Produtos.tsx recriado 100% do zero (código testado e funcional)
 * - v2.58.9 (12/03/2026): ✅ REVERSÃO COMPLETA - Select de Responsável com APENAS Padeiro e Confeiteiro (sem Funcionário)
 * - v2.58.8 (12/03/2026): 🔥 FIX URGENTE - Import VisuallyHidden adicionado (conexão restaurada!)
 * - v2.58.7 (12/03/2026): ���� REESCRITA TOTAL - Produtos.tsx reescrito 100% do zero (código limpo e funcional)
 * - v2.58.6 (12/03/2026): 🔧 FIX CRÍTICO - Emoji de Confeiteiro trocado para 🎂 (emoji simples, sem ZWJ)
 * - v2.58.4 (12/03/2026): 🎨 UX - Botão limpar cache agora é BRANCO com ícone Sparkles AZUL (consistente)
 * - v2.58.3 (12/03/2026): ✨ UX - Botão limpar cache agora é AZUL (#084d6e) com ícone Sparkles (sem lixeira)
 * - v2.58.2 (12/03/2026): 🔄 AUTO-ATUALIZAÇÃO - Sistema detecta nova versão e força reload automático
 * - v2.58.1 (12/03/2026): 🔥 FIX CRÍTICO - Z-index Select aumentado para 99999 (Selects voltaram a funcionar!)
 * - v2.58.0 (12/03/2026): 🔧 REESCRITA COMPLETA - Página de Produtos totalmente recriada (limpa, sem bugs, com botão de atualização)
 */

export const VERSAO_SISTEMA = "2.87.2";
export const DATA_ATUALIZACAO = "18/03/2026";
export const NOME_SISTEMA = "Nicolina - Gestão de Encomendas";

/**
 * Retorna informações completas da versão
 */
export function obterInfoVersao() {
  return {
    versao: VERSAO_SISTEMA,
    data: DATA_ATUALIZACAO,
    sistema: NOME_SISTEMA,
    build: `${VERSAO_SISTEMA}-${Date.now()}`,
    navegador: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log de inicialização do sistema
 */
export function logInicializacao(modulo: string) {
  console.log(
    `%c🚀 ${NOME_SISTEMA} v${VERSAO_SISTEMA}`,
    'background: linear-gradient(135deg, #084d6e 0%, #0a6b94 100%); color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;'
  );
  console.log(`📦 Módulo: ${modulo}`);
  console.log(`📅 Última atualização: ${DATA_ATUALIZACAO}`);
  console.log(`⏰ Carregado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('─'.repeat(60));
}

/**
 * Força reload se versão antiga estiver em cache
 * ⚠️ VERSÃO CORRIGIDA - SEM LOOP INFINITO
 */
export function forcarAtualizacaoSeNecessario() {
  const versaoArmazenada = localStorage.getItem('nicolina_versao_atual');
  const BUILD_ATUAL = `${VERSAO_SISTEMA}-build-${Date.now()}`;
  
  console.log("%c═══════════════════════════════════════", "color: #00ff00; font-weight: bold; font-size: 16px;");
  console.log("%c🔍 VERIFICAÇÃO DE VERSÃO", "background: #00ff00; color: black; font-weight: bold; font-size: 18px; padding: 8px;");
  console.log(`Versão esperada: ${VERSAO_SISTEMA}`);
  console.log(`Versão armazenada: ${versaoArmazenada || 'NENHUMA'}`);
  
  // Se for a primeira vez (sem versão) OU versão correta, apenas definir e continuar
  if (!versaoArmazenada) {
    console.log("%c✅ PRIMEIRA INICIALIZAÇÃO - Definindo versão atual", "background: blue; color: white; font-weight: bold; font-size: 16px; padding: 8px;");
    localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
    localStorage.setItem('nicolina_build', BUILD_ATUAL);
  } else if (versaoArmazenada !== VERSAO_SISTEMA) {
    // Apenas se tiver versão DIFERENTE da atual
    console.log(
      `%c📦 ATUALIZAÇÃO AUTOMÁTICA`,
      "background: #084d6e; color: white; font-weight: bold; font-size: 16px; padding: 8px;"
    );
    console.log(`%c  ${versaoArmazenada} → ${VERSAO_SISTEMA}`, "color: #0a6b94; font-weight: bold;");
    
    // APENAS atualizar a versão, SEM limpar tudo
    localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
    localStorage.setItem('nicolina_build', BUILD_ATUAL);
    
    console.log("%c✅ Versão sincronizada!", "background: green; color: white; font-weight: bold; font-size: 14px; padding: 6px;");
  } else {
    console.log("%c✅ VERSÃO SINCRONIZADA!", "background: green; color: white; font-weight: bold; font-size: 16px; padding: 8px;");
    localStorage.setItem('nicolina_build', BUILD_ATUAL);
  }
  
  console.log("%c═════════════════════════════════════", "color: #00ff00; font-weight: bold; font-size: 16px;");
}

/**
 * 🔥 LIMPEZA FORÇADA DE CACHE - DESKTOP
 * Limpa TUDO e força reload hard
 */
export function limparCacheDesktop() {
  console.log("%c🔥 LIMPANDO CACHE DO DESKTOP...", "background: red; color: white; font-weight: bold; font-size: 18px; padding: 10px;");
  
  // 1. Remover apenas chaves do sistema Nicolina — preservar chaves Firebase Auth
  const chavesProtegidas = (key: string) =>
    key.startsWith("firebase:") || key === "nicolina_usuario_logado" || key === "nicolina_usuarios";
  const chavesNicolina = Object.keys(localStorage).filter(
    (key) => key.startsWith("nicolina_") && !chavesProtegidas(key)
  );
  chavesNicolina.forEach((key) => localStorage.removeItem(key));
  
  // 2. Definir versão atual
  localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
  localStorage.setItem('nicolina_limpeza_desktop', new Date().toISOString());
  
  console.log("%c✅ CACHE LIMPO! Recarregando...", "background: green; color: white; font-weight: bold; font-size: 16px; padding: 8px;");
  
  // 3. Reload HARD
  setTimeout(() => {
    window.location.reload();
  }, 500);
}