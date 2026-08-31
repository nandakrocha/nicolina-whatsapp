// Service Worker para notificações em background
// Permite que notificações funcionem mesmo com página fechada

const CACHE_NAME = 'nicolina-v2.87.0';
const NOTIFICACOES_STORE = 'nicolina-notificacoes-agendadas';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(self.clients.claim());
  
  // Iniciar verificação periódica de notificações
  iniciarVerificacaoNotificacoes();
});

// Interceptar fetch (necessário para Service Worker funcionar)
self.addEventListener('fetch', (event) => {
  // Deixar passar normalmente
  event.respondWith(fetch(event.request));
});

// Listener para mensagens do app
self.addEventListener('message', (event) => {
  if (event.data.type === 'AGENDAR_NOTIFICACAO') {
    agendarNotificacao(event.data.notificacao);
  } else if (event.data.type === 'CANCELAR_NOTIFICACAO') {
    cancelarNotificacao(event.data.chave);
  } else if (event.data.type === 'CANCELAR_TODAS') {
    cancelarTodasNotificacoes();
  } else if (event.data.type === 'VERIFICAR_NOTIFICACOES') {
    verificarNotificacoesPendentes();
  }
});

// Armazenar notificações agendadas no IndexedDB
async function salvarNotificacao(chave, notificacao) {
  try {
    const db = await abrirDB();
    const tx = db.transaction('notificacoes', 'readwrite');
    const store = tx.objectStore('notificacoes');
    await store.put({ chave, ...notificacao });
    console.log('📝 Notificação salva:', chave);
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
  }
}

async function carregarNotificacoes() {
  try {
    const db = await abrirDB();
    const tx = db.transaction('notificacoes', 'readonly');
    const store = tx.objectStore('notificacoes');
    const notificacoes = await store.getAll();
    return notificacoes;
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    return [];
  }
}

async function removerNotificacao(chave) {
  try {
    const db = await abrirDB();
    const tx = db.transaction('notificacoes', 'readwrite');
    const store = tx.objectStore('notificacoes');
    await store.delete(chave);
    console.log('🗑️ Notificação removida:', chave);
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
  }
}

// Abrir IndexedDB
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NicolinaDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notificacoes')) {
        db.createObjectStore('notificacoes', { keyPath: 'chave' });
      }
    };
  });
}

// Agendar notificação
async function agendarNotificacao(notificacao) {
  const { chave, encomenda, horario, timestamp } = notificacao;
  
  console.log('⏰ Agendando notificação:', chave, 'para', new Date(timestamp).toLocaleString());
  
  await salvarNotificacao(chave, {
    encomenda,
    horario,
    timestamp,
    agendadoEm: Date.now(),
  });
}

// Cancelar notificação específica
async function cancelarNotificacao(chave) {
  await removerNotificacao(chave);
}

// Cancelar todas as notificações
async function cancelarTodasNotificacoes() {
  try {
    const db = await abrirDB();
    const tx = db.transaction('notificacoes', 'readwrite');
    const store = tx.objectStore('notificacoes');
    await store.clear();
    console.log('🗑️ Todas as notificações canceladas');
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
  }
}

// Verificar e disparar notificações pendentes
async function verificarNotificacoesPendentes() {
  const notificacoes = await carregarNotificacoes();
  const agora = Date.now();
  
  console.log(`🔍 Verificando ${notificacoes.length} notificação(ões) agendada(s)...`);
  
  for (const notificacao of notificacoes) {
    const { chave, timestamp, encomenda, horario } = notificacao;
    
    // Se passou do horário, disparar
    if (agora >= timestamp) {
      console.log('🔔 Disparando notificação:', chave);
      await dispararNotificacao(encomenda, horario);
      await removerNotificacao(chave);
    }
  }
}

// Disparar notificação push
async function dispararNotificacao(encomenda, horario) {
  const produtos = formatarProdutos(encomenda.produtos);
  const titulo = '🔔 Nicolina - Pedido Próximo!';
  const corpo = `${encomenda.clienteNome} - ${horario}\n${produtos}`;
  
  try {
    // Verificar permissão
    if (Notification.permission === 'granted') {
      await self.registration.showNotification(titulo, {
        body: corpo,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `pedido-${encomenda.id}-${horario}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
          encomendaId: encomenda.id,
          horario: horario,
        },
        actions: [
          {
            action: 'ver',
            title: 'Ver Pedido',
          },
          {
            action: 'fechar',
            title: 'Dispensar',
          },
        ],
      });
      
      console.log('✅ Notificação push enviada!');
      
      // Marcar como enviada
      await marcarComoEnviada(encomenda.id, horario);
    } else {
      console.warn('⚠️ Permissão de notificação não concedida');
    }
  } catch (error) {
    console.error('❌ Erro ao disparar notificação:', error);
  }
}

// Formatar lista de produtos
function formatarProdutos(produtos) {
  if (!produtos || produtos.length === 0) return 'Nenhum produto';
  
  const primeiros = produtos.slice(0, 3);
  const resumo = primeiros.map(p => `${p.quantidade}x ${p.produtoNome}`).join(', ');
  
  if (produtos.length > 3) {
    return `${resumo} e mais ${produtos.length - 3}`;
  }
  
  return resumo;
}

// Marcar notificação como enviada
async function marcarComoEnviada(encomendaId, horario) {
  try {
    // Enviar mensagem para o app principal
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICACAO_ENVIADA',
        encomendaId,
        horario,
      });
    });
  } catch (error) {
    console.error('Erro ao marcar como enviada:', error);
  }
}

// Click na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada:', event.action);
  
  event.notification.close();
  
  if (event.action === 'ver') {
    // Abrir app na página de encomendas
    event.waitUntil(
      self.clients.openWindow('/encomendas')
    );
  }
});

// Iniciar verificação periódica (a cada 1 minuto)
function iniciarVerificacaoNotificacoes() {
  setInterval(() => {
    verificarNotificacoesPendentes();
  }, 60 * 1000); // 1 minuto
  
  // Verificar imediatamente
  verificarNotificacoesPendentes();
}

console.log('🚀 Service Worker Nicolina carregado!');
