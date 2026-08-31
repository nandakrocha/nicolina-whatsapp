/**
 * 📱 Gerenciador de Service Worker e Notificações Push
 * 
 * Registra Service Worker para permitir notificações em background
 * Funciona mesmo com a página fechada no celular!
 */

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registra o Service Worker
 */
export async function registrarServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker não suportado neste navegador');
    return false;
  }

  // Detectar ambientes que bloqueiam Service Workers (figma.site, iframes cross-origin)
  const hostname = window.location.hostname;
  const isRestrictedHost =
    hostname.includes('figma.site') ||
    hostname.includes('figma.com');

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true; // parent cross-origin → definitivamente iframe
  }

  if (isRestrictedHost || isInIframe) {
    console.info('ℹ️ Service Worker desativado: ambiente sem suporte a SW');
    return false;
  }

  try {
    console.log('🔧 Registrando Service Worker...');

    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    serviceWorkerRegistration = registration;

    console.log('✅ Service Worker registrado com sucesso!');
    console.log('📱 Notificações em background ATIVADAS!');

    // Verificar se precisa atualizar
    registration.addEventListener('updatefound', () => {
      console.log('🔄 Nova versão do Service Worker encontrada');
    });

    // Verificar estado
    if (registration.installing) {
      console.log('⏳ Service Worker instalando...');
    } else if (registration.waiting) {
      console.log('⏸️ Service Worker aguardando...');
    } else if (registration.active) {
      console.log('✅ Service Worker ativo!');
    }

    return true;
  } catch (error: any) {
    // SecurityError: ambiente não permite SW (Safari em figma.site ou contexto restrito)
    if (error?.name === 'SecurityError') {
      console.info('ℹ️ Service Worker não disponível neste ambiente (SecurityError ignorado)');
      return false;
    }
    console.error('❌ Erro ao registrar Service Worker:', error);
    return false;
  }
}

/**
 * Envia notificação para o Service Worker agendar
 */
export function agendarNotificacaoBackground(
  chave: string,
  encomenda: any,
  horario: string,
  timestamp: number
): void {
  if (!serviceWorkerRegistration) {
    console.warn('⚠️ Service Worker não registrado');
    return;
  }

  // Enviar mensagem para o Service Worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'AGENDAR_NOTIFICACAO',
      notificacao: {
        chave,
        encomenda,
        horario,
        timestamp,
      },
    });
    
    console.log(`📤 Notificação enviada para Service Worker: ${chave}`);
  } else {
    console.warn('⚠️ Service Worker não está controlando a página ainda');
  }
}

/**
 * Cancela uma notificação no Service Worker
 */
export function cancelarNotificacaoBackground(chave: string): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CANCELAR_NOTIFICACAO',
      chave,
    });
    
    console.log(`🗑️ Cancelamento enviado para Service Worker: ${chave}`);
  }
}

/**
 * Cancela todas as notificações no Service Worker
 */
export function cancelarTodasNotificacoesBackground(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CANCELAR_TODAS',
    });
    
    console.log('🗑️ Cancelamento de todas enviado para Service Worker');
  }
}

/**
 * Força verificação imediata de notificações pendentes
 */
export function verificarNotificacoesPendentes(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'VERIFICAR_NOTIFICACOES',
    });
    
    console.log('🔍 Solicitado verificação de notificações pendentes');
  }
}

/**
 * Listener para mensagens do Service Worker
 */
export function iniciarListenerServiceWorker(callback: (data: any) => void): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📩 Mensagem recebida do Service Worker:', event.data);
    callback(event.data);
  });
}

/**
 * Verifica se Service Worker está ativo
 */
export function isServiceWorkerAtivo(): boolean {
  return serviceWorkerRegistration !== null && serviceWorkerRegistration.active !== null;
}

/**
 * Obtém a registration do Service Worker
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return serviceWorkerRegistration;
}

/**
 * Desregistra o Service Worker (para debug)
 */
export async function desregistrarServiceWorker(): Promise<void> {
  if (!serviceWorkerRegistration) return;

  try {
    await serviceWorkerRegistration.unregister();
    serviceWorkerRegistration = null;
    console.log('🔴 Service Worker desregistrado');
  } catch (error) {
    console.error('Erro ao desregistrar Service Worker:', error);
  }
}