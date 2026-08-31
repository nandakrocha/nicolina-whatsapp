import { useEffect, useState } from "react";
import { VERSAO_SISTEMA } from "../version";

/**
 * Banner que aparece quando versão divergente é detectada
 * e mostra contagem regressiva para reload automático
 */
export function BannerReloadAutomatico() {
  const [mostrar, setMostrar] = useState(false);
  const [segundos, setSegundos] = useState(2);
  const [versaoAtual, setVersaoAtual] = useState("");
  const [versaoEsperada, setVersaoEsperada] = useState(VERSAO_SISTEMA);

  useEffect(() => {
    const versaoArmazenada = localStorage.getItem('nicolina_versao_atual');
    
    if (!versaoArmazenada || versaoArmazenada !== VERSAO_SISTEMA) {
      setMostrar(true);
      setVersaoAtual(versaoArmazenada || 'NENHUMA');
      
      // Contagem regressiva
      const interval = setInterval(() => {
        setSegundos((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full border-4 border-orange-500 animate-pulse">
        <div className="text-center space-y-4">
          {/* Ícone */}
          <div className="text-6xl">⚠️</div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            VERSÃO DESATUALIZADA DETECTADA
          </h2>
          
          {/* Informações */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Versão atual (cache):</span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">{versaoAtual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Versão esperada:</span>
              <span className="font-mono font-bold text-green-600 dark:text-green-400">{versaoEsperada}</span>
            </div>
          </div>
          
          {/* Contagem regressiva */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-red-600 dark:text-red-400">
              {segundos}
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Atualizando automaticamente...
            </p>
          </div>
          
          {/* Mensagem */}
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
            <p>Detectamos que você está usando uma versão antiga do sistema.</p>
            <p className="mt-1">O cache será limpo e a página recarregada automaticamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
