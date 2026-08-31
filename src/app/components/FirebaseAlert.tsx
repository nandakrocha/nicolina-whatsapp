import { useState, useEffect } from "react";
import { AlertCircle, X, Settings } from "lucide-react";
import { Link } from "react-router";
import { isFirebaseConfigured } from "../services/firebase";
import { migracaoAPI } from "../services/api";

export function FirebaseAlert() {
  const [mostrar, setMostrar] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    // Verificar se já foi fechado nesta sessão
    const alertaFechado = sessionStorage.getItem("firebase_alert_fechado");
    if (alertaFechado) {
      setFechado(true);
      return;
    }

    // Mostrar alerta se Firebase não configurado E tem dados no localStorage
    const configurado = isFirebaseConfigured();
    const temDados = migracaoAPI.verificarDadosLocalStorage();
    
    if (!configurado && temDados) {
      setMostrar(true);
    }
  }, []);

  const handleFechar = () => {
    setFechado(true);
    sessionStorage.setItem("firebase_alert_fechado", "true");
  };

  if (!mostrar || fechado) return null;

  return (
    <div className="no-print hidden md:block fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 dark:border-orange-600 rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 dark:text-orange-200 mb-1">
              ⚠️ Dados Temporários no Navegador
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
              Seus dados estão salvos apenas neste navegador. Configure o Firebase para 
              ter backup na nuvem e acesso de múltiplos dispositivos.
            </p>
            
            <Link
              to="/migracao"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Settings className="h-4 w-4" />
              Migrar para Firebase Agora
            </Link>
          </div>

          <button
            onClick={handleFechar}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            aria-label="Fechar alerta"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}