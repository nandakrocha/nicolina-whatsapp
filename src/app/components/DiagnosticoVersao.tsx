import { useEffect, useState } from "react";
import { VERSAO_SISTEMA } from "../version";

/**
 * Componente de Diagnóstico de Versão
 * Exibe informações de debug para identificar cache
 */
export function DiagnosticoVersao() {
  const [timestamp] = useState(Date.now());
  const [buildTime] = useState(new Date().toLocaleString('pt-BR'));

  useEffect(() => {
    console.log("%c═══════════════════════════════════════", "color: red; font-weight: bold; font-size: 20px;");
    console.log("%c🔥 DIAGNÓSTICO DE VERSÃO", "background: red; color: white; font-weight: bold; font-size: 24px; padding: 10px;");
    console.log("%c═══════════════════════════════════════", "color: red; font-weight: bold; font-size: 20px;");
    console.log(`%cVERSÃO DO SISTEMA: ${VERSAO_SISTEMA}`, "color: green; font-weight: bold; font-size: 18px;");
    console.log(`%cTIMESTAMP BUILD: ${timestamp}`, "color: blue; font-weight: bold; font-size: 16px;");
    console.log(`%cDATA/HORA BUILD: ${buildTime}`, "color: blue; font-weight: bold; font-size: 16px;");
    console.log("%c═══════════════════════════════════════", "color: red; font-weight: bold; font-size: 20px;");
    
    // Verificar versão no localStorage
    const versaoArmazenada = localStorage.getItem('nicolina_versao_atual');
    const jaCorrigiu = sessionStorage.getItem('nicolina_diagnostico_corrigiu');
    
    if (versaoArmazenada !== VERSAO_SISTEMA && !jaCorrigiu) {
      console.warn(
        `%c⚠️ VERSÃO DIVERGENTE DETECTADA!`,
        "background: orange; color: white; font-weight: bold; font-size: 20px; padding: 10px;"
      );
      console.warn(`LocalStorage: ${versaoArmazenada}`);
      console.warn(`Código: ${VERSAO_SISTEMA}`);
      console.warn("🔧 CORRIGINDO AUTOMATICAMENTE...");
      
      // FORÇA SINCRONIZAÇÃO IMEDIATA
      localStorage.setItem('nicolina_versao_atual', VERSAO_SISTEMA);
      sessionStorage.setItem('nicolina_diagnostico_corrigiu', 'true');
      
      console.log("%c✅ VERSÃO SINCRONIZADA!", "background: green; color: white; font-weight: bold; font-size: 18px; padding: 10px;");
    } else if (versaoArmazenada === VERSAO_SISTEMA) {
      console.log("%c✅ VERSÃO SINCRONIZADA", "background: green; color: white; font-weight: bold; font-size: 18px; padding: 10px;");
    }
  }, [timestamp, buildTime]);

  return null; // Componente invisível
}