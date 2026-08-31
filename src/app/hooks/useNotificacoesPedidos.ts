/**
 * 🔔 Hook para Notificações Automáticas de Pedidos
 * 
 * Hook React que monitora encomendas e gerencia notificações automáticas.
 * Integra-se silenciosamente ao sistema existente.
 */

import { useEffect, useRef } from "react";
import { 
  processarEncomendas, 
  cancelarTodasNotificacoes,
  solicitarPermissaoNotificacoes,
} from "../services/notificacoes";

interface UseNotificacoesPedidosOptions {
  encomendas: any[];
  habilitado?: boolean;
}

/**
 * Hook para gerenciar notificações automáticas de pedidos
 * 
 * @param encomendas - Lista de encomendas a monitorar
 * @param habilitado - Se false, desabilita as notificações (padrão: true)
 * 
 * @example
 * ```tsx
 * function MinhasPagina() {
 *   const [encomendas, setEncomendas] = useState([]);
 *   
 *   // Ativa notificações automáticas
 *   useNotificacoesPedidos({ encomendas });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useNotificacoesPedidos({ 
  encomendas, 
  habilitado = true 
}: UseNotificacoesPedidosOptions) {
  const encomendasAnteriorRef = useRef<string>("");
  const inicializadoRef = useRef(false);

  useEffect(() => {
    if (!habilitado) {
      return;
    }

    // Executar apenas uma vez ao montar
    if (!inicializadoRef.current) {
      console.log("🔔 Sistema de Notificações Automáticas iniciado");
      
      // Solicitar permissão para notificações do navegador
      solicitarPermissaoNotificacoes();
      
      inicializadoRef.current = true;
    }

    // Processar encomendas quando mudarem
    if (encomendas && encomendas.length > 0) {
      // Criar hash das encomendas para detectar mudanças
      const hashAtual = JSON.stringify(
        encomendas.map(e => ({
          id: e.id,
          data: e.data,
          hora: e.hora,
          horarios: e.horarios,
        }))
      );

      // Só reprocessar se houver mudanças
      if (hashAtual !== encomendasAnteriorRef.current) {
        console.log("🔄 Encomendas atualizadas - recalculando notificações...");
        
        // Cancelar todas as notificações antigas
        cancelarTodasNotificacoes();
        
        // Reagendar com base nas encomendas atualizadas
        processarEncomendas(encomendas);
        
        encomendasAnteriorRef.current = hashAtual;
      }
    }

    // Cleanup ao desmontar
    return () => {
      if (!habilitado) {
        cancelarTodasNotificacoes();
      }
    };
  }, [encomendas, habilitado]);

  // Reprocessar a cada 5 minutos para garantir sincronia
  useEffect(() => {
    if (!habilitado || !encomendas || encomendas.length === 0) {
      return;
    }

    const intervalo = setInterval(() => {
      console.log("🔄 Reprocessando notificações (verificação periódica)...");
      cancelarTodasNotificacoes();
      processarEncomendas(encomendas);
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalo);
  }, [encomendas, habilitado]);
}

/**
 * Hook simplificado que cancela notificações de uma encomenda
 * específica quando ela for excluída
 */
export function useCancelarNotificacaoEncomenda(encomendaId: string | null) {
  useEffect(() => {
    if (encomendaId) {
      cancelarTodasNotificacoes();
    }
  }, [encomendaId]);
}