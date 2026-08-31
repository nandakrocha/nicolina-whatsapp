import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { backupAPI } from "../services/api";
import { Loader2, Download, AlertCircle } from "lucide-react";

export default function DownloadBackup() {
  console.log("🚀 [DOWNLOAD] Componente DownloadBackup carregado!");
  
  const { timestamp } = useParams<{ timestamp: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "downloading" | "error">("loading");
  const [error, setError] = useState("");

  console.log("🔍 [DOWNLOAD] useParams - timestamp:", timestamp);
  console.log("🔍 [DOWNLOAD] window.location.pathname:", window.location.pathname);

  useEffect(() => {
    const downloadBackup = async () => {
      console.log("🔍 [DOWNLOAD] Iniciando download...");
      console.log("🔍 [DOWNLOAD] Timestamp recebido:", timestamp);
      
      if (!timestamp) {
        console.error("❌ [DOWNLOAD] Timestamp não fornecido");
        setError("Timestamp do backup não fornecido");
        setStatus("error");
        return;
      }

      try {
        console.log(`📥 [DOWNLOAD] Buscando backup: ${timestamp}`);
        setStatus("loading");

        // Buscar backup
        const backup = await backupAPI.buscar(timestamp);

        console.log(`✅ [DOWNLOAD] Backup encontrado:`, {
          timestamp: backup.timestamp,
          encomendas: backup.encomendas.length,
          produtos: backup.produtos.length,
          clientes: backup.clientes.length
        });

        // Preparar arquivo para download
        const dataFormatada = new Date(backup.timestamp).toLocaleDateString("pt-BR");
        const filename = `backup_nicolina_${dataFormatada.replace(/\//g, "-")}.json`;
        const backupJson = JSON.stringify(backup, null, 2);

        console.log(`📦 [DOWNLOAD] Preparando arquivo: ${filename}`);
        console.log(`📦 [DOWNLOAD] Tamanho: ${(backupJson.length / 1024).toFixed(2)} KB`);

        // Criar blob e download
        const blob = new Blob([backupJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        
        console.log(`🚀 [DOWNLOAD] Iniciando download...`);
        a.click();

        // Limpar
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log(`✅ [DOWNLOAD] Download iniciado com sucesso`);
        }, 100);

        setStatus("downloading");

        // Redirecionar após 3 segundos
        setTimeout(() => {
          console.log(`↩️ [DOWNLOAD] Redirecionando para /backup`);
          navigate("/backup");
        }, 3000);
      } catch (err) {
        console.error("❌ [DOWNLOAD] Erro:", err);
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao buscar backup";
        setError(errorMsg);
        setStatus("error");
      }
    };

    downloadBackup();
  }, [timestamp, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#084d6e] to-[#0a5f88] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#084d6e] animate-spin" />
            <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
              Preparando Download...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Buscando backup no sistema...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              ID: {timestamp}
            </p>
          </>
        )}

        {status === "downloading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
              ✅ Download Iniciado!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              O arquivo de backup está sendo baixado...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecionando para a página de backup em 3 segundos...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
              ❌ Erro ao Baixar Backup
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Timestamp: {timestamp}
            </p>
            <button
              onClick={() => navigate("/backup")}
              className="bg-[#084d6e] text-white px-6 py-2 rounded-lg hover:bg-[#063a52] transition-colors"
            >
              Voltar para Backup
            </button>
          </>
        )}
      </div>
    </div>
  );
}