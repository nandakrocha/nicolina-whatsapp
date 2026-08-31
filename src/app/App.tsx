import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { router } from "./routes";
import { VERSAO_SISTEMA, logInicializacao } from "./version";
import { DiagnosticoVersao } from "./components/DiagnosticoVersao";
import { AutoAtualizador } from "./components/AutoAtualizador";
import { useEffect, useState } from "react";
import {
  iniciarSincronizacaoEncomendas,
  iniciarSincronizacaoProdutos,
  iniciarSincronizacaoClientes,
  iniciarSincronizacaoUsuarios,
  iniciarSincronizacaoOrcamentos,
  iniciarSincronizacaoProdutosOrcamento,
  encomendasAPI,
} from "./services/api";
import { useNotificacoesPedidos } from "./hooks/useNotificacoesPedidos";
import {
  registrarServiceWorker,
  iniciarListenerServiceWorker,
} from "./services/serviceWorkerManager";
import { authReadyPromise } from "./services/firebase";
import { toast } from "sonner";

// ✅ Log de inicialização (SEM forçar atualização aqui)
logInicializacao("App Principal");

export default function App() {
  const [buildTime] = useState(
    new Date().toLocaleTimeString("pt-BR"),
  );
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [notificacoesHabilitadas, setNotificacoesHabilitadas] =
    useState(() => {
      const salvo = localStorage.getItem(
        "nicolina_notificacoes_habilitadas",
      );
      return salvo !== null ? salvo === "true" : true; // Habilitado por padrão
    });

  // 🔔 Ativar notificações automáticas de pedidos (se habilitado)
  useNotificacoesPedidos({
    encomendas,
    habilitado: notificacoesHabilitadas,
  });

  useEffect(() => {
    // Log massivo no console
    console.log(
      "%c╔══════════════════════════════════════════════════════════╗",
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      "%c║                                                          ║",
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      `%c║     🍞 NICOLINA v${VERSAO_SISTEMA} CARREGADO ÀS ${buildTime}       ║`,
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      "%c║                                                          ║",
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      `%c║     BUILD TIMESTAMP: ${Date.now()}                        ║`,
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      "%c║                                                          ║",
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );
    console.log(
      "%c╚══════════════════════════════════════════════════════════╝",
      "color: #00ff00; font-weight: bold; font-size: 14px;",
    );

    // 📱 REGISTRAR SERVICE WORKER (para notificações em background)
    if (notificacoesHabilitadas) {
      registrarServiceWorker().then((sucesso) => {
        if (sucesso) {
          console.log(
            "%c📱 SERVICE WORKER ATIVO - Notificações funcionarão mesmo com app fechado!",
            "background: #084d6e; color: white; font-weight: bold; padding: 8px; font-size: 14px;",
          );

          // Listener para mensagens do Service Worker
          iniciarListenerServiceWorker((data) => {
            if (data.type === "NOTIFICACAO_ENVIADA") {
              console.log(
                "📩 Notificação enviada pelo Service Worker:",
                data,
              );
            }
          });
        }
      });
    }

    // 🔥 INICIAR SINCRONIZAÇÃO EM TEMPO REAL
    // Aguarda authReadyPromise antes de chamar as funções de sincronização
    // para garantir que isDatabaseAvailable() retorne o estado correto
    console.log(
      "%c🔥 AGUARDANDO AUTENTICAÇÃO PARA INICIAR SINCRONIZAÇÃO...",
      "background: #ff6b00; color: white; font-weight: bold; padding: 8px; font-size: 14px;",
    );

    let isMounted = true;
    let unsubscribeEncomendas: () => void = () => {};
    let unsubscribeProdutos: () => void = () => {};
    let unsubscribeClientes: () => void = () => {};
    let unsubscribeUsuarios: () => void = () => {};
    let unsubscribeOrcamentos: () => void = () => {};
    let unsubscribeProdutosOrcamento: () => void = () => {};

    authReadyPromise.then(() => {
      if (!isMounted) return;

      unsubscribeEncomendas = iniciarSincronizacaoEncomendas();
      unsubscribeProdutos = iniciarSincronizacaoProdutos();
      unsubscribeClientes = iniciarSincronizacaoClientes();
      unsubscribeUsuarios = iniciarSincronizacaoUsuarios();
      unsubscribeOrcamentos = iniciarSincronizacaoOrcamentos();
      unsubscribeProdutosOrcamento = iniciarSincronizacaoProdutosOrcamento();

      console.log(
        "%c✅ SINCRONIZAÇÃO ATIVADA!",
        "background: #00ff00; color: black; font-weight: bold; padding: 8px; font-size: 14px;",
      );

      // 🔔 Carregar encomendas para notificações (apenas se habilitado)
      if (notificacoesHabilitadas) {
        carregarEncomendas();
      }
    });

    // Atualizar encomendas quando houver mudanças
    const handleAtualizarEncomendas = () => {
      if (notificacoesHabilitadas) {
        carregarEncomendas();
      }
    };

    window.addEventListener(
      "encomenda-atualizada",
      handleAtualizarEncomendas,
    );

    // Cleanup: desinscrever listeners quando componente desmontar
    return () => {
      isMounted = false;
      console.log(
        "%c⚠️ Desativando sincronização em tempo real...",
        "color: orange; font-weight: bold;",
      );
      unsubscribeEncomendas();
      unsubscribeProdutos();
      unsubscribeClientes();
      unsubscribeUsuarios();
      unsubscribeOrcamentos();
      unsubscribeProdutosOrcamento();
      window.removeEventListener(
        "encomenda-atualizada",
        handleAtualizarEncomendas,
      );
    };
  }, [buildTime, notificacoesHabilitadas]);

  // Função para carregar encomendas (para notificações)
  const carregarEncomendas = async () => {
    try {
      const dados = await encomendasAPI.listar();
      setEncomendas(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar encomendas para notificações:",
        error,
      );
    }
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
    >
      <AutoAtualizador />
      <DiagnosticoVersao />
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: "md:mr-0 mr-0",
        }}
      />
    </ThemeProvider>
  );
}