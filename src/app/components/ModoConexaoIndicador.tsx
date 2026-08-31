import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "../services/firebase";
import { Cloud, HardDrive } from "lucide-react";
import { Badge } from "./ui/badge";

export function ModoConexaoIndicador() {
  const [mostrar, setMostrar] = useState(true);
  const configurado = isFirebaseConfigured();

  useEffect(() => {
    // Esconder após 8 segundos
    const timer = setTimeout(() => {
      setMostrar(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (!mostrar) {
    return (
      <button
        onClick={() => setMostrar(true)}
        className="no-print hidden md:flex fixed bottom-4 right-4 z-50"
        title="Mostrar status de conexão"
      >
        <Badge
          variant="outline"
          className={
            configurado
              ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
              : "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800"
          }
        >
          {configurado ? (
            <>
              <Cloud className="w-3 h-3 mr-1" />
              Firebase
            </>
          ) : (
            <>
              <HardDrive className="w-3 h-3 mr-1" />
              Local
            </>
          )}
        </Badge>
      </button>
    );
  }

  return (
    <div className="no-print hidden md:block fixed bottom-4 right-4 z-50 max-w-xs">
      <div
        className={`p-4 rounded-lg shadow-lg border-2 ${
          configurado
            ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800"
            : "bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800"
        }`}
      >
        <div className="flex items-start gap-3">
          {configurado ? (
            <Cloud className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <HardDrive className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`font-semibold text-sm ${
                configurado
                  ? "text-green-800 dark:text-green-300"
                  : "text-orange-800 dark:text-orange-300"
              }`}
            >
              {configurado ? "🔥 Firebase Conectado" : "💾 Modo Local"}
            </p>
            <p
              className={`text-xs mt-1 ${
                configurado
                  ? "text-green-700 dark:text-green-400"
                  : "text-orange-700 dark:text-orange-400"
              }`}
            >
              {configurado
                ? "Dados salvos na nuvem"
                : "Dados salvos no navegador"}
            </p>
          </div>
          <button
            onClick={() => setMostrar(false)}
            className={`text-xs ${
              configurado
                ? "text-green-600 hover:text-green-800 dark:text-green-400"
                : "text-orange-600 hover:text-orange-800 dark:text-orange-400"
            }`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}