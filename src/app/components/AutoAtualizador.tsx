import { useEffect, useState } from "react";
import { VERSAO_SISTEMA } from "../version";
import { toast } from "sonner";

/**
 * 🔄 AUTO-ATUALIZADOR
 * Detecta nova versão e força reload automático
 */
export function AutoAtualizador() {
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    const versaoArmazenada = localStorage.getItem('nicolina_versao_atual');
    const jaAtualizouAgora = sessionStorage.getItem('nicolina_ja_atualizou');
    
    console.log("%c🔍 AUTO-ATUALIZADOR ATIVO", "background: #084d6e; color: white; font-weight: bold; padding: 8px; font-size: 14px;");
    console.log(`Versão esperada: ${VERSAO_SISTEMA}`);
    console.log(`Versão armazenada: ${versaoArmazenada || 'NENHUMA'}`);
    console.log(`Já atualizou nesta sessão: ${jaAtualizouAgora || 'NÃO'}`);

    // Se já atualizou nesta sessão, apenas sincronizar e retornar
    if (jaAtualizouAgora === VERSAO_SISTEMA) {
      console.log("%c✅ Já atualizado nesta sessão - sincronizando...", "color: green; font-weight: bold;");
      localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
      return;
    }

    // Se não tem versão armazenada, define a atual
    if (!versaoArmazenada) {
      console.log("%c✅ Primeira inicialização - definindo versão", "color: green; font-weight: bold;");
      localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
      sessionStorage.setItem('nicolina_ja_atualizou', VERSAO_SISTEMA);
      return;
    }

    // Se a versão é diferente E ainda não atualizou, FORÇA ATUALIZAÇÃO
    if (versaoArmazenada !== VERSAO_SISTEMA) {
      console.log(
        `%c🔄 NOVA VERSÃO DETECTADA! ${versaoArmazenada} → ${VERSAO_SISTEMA}`,
        "background: #ff6b00; color: white; font-weight: bold; padding: 10px; font-size: 16px;"
      );
      
      setAtualizando(true);

      // Toast de atualização
      toast.info("🔄 Nova versão detectada!", {
        description: `Atualizando de ${versaoArmazenada} para ${VERSAO_SISTEMA}...`,
        duration: 2000,
      });

      // Aguarda 2 segundos e força reload
      setTimeout(() => {
        console.log("%c🔥 FORÇANDO RELOAD...", "background: red; color: white; font-weight: bold; padding: 8px; font-size: 14px;");
        
        // Marca que já atualizou ANTES do reload
        sessionStorage.setItem('nicolina_ja_atualizou', VERSAO_SISTEMA);
        
        // FORÇA RELOAD HARD (sem cache)
        window.location.reload();
      }, 2000);
    } else {
      console.log("%c✅ Versão sincronizada!", "background: green; color: white; font-weight: bold; padding: 6px;");
      sessionStorage.setItem('nicolina_ja_atualizou', VERSAO_SISTEMA);
    }
  }, []);

  if (atualizando) {
    return (
      <div className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">🔄 Atualizando sistema...</h2>
          <p className="text-muted-foreground mb-4">
            Nova versão {VERSAO_SISTEMA} detectada
          </p>
          <p className="text-sm text-muted-foreground">
            Aguarde enquanto carregamos a última versão...
          </p>
        </div>
      </div>
    );
  }

  return null;
}