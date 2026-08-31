import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function IndicadorSincronizacao() {
  const [online, setOnline] = useState(navigator.onLine);
  const [mostrarMensagem, setMostrarMensagem] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setMostrarMensagem(true);
      setTimeout(() => setMostrarMensagem(false), 3000);
    };

    const handleOffline = () => {
      setOnline(false);
      setMostrarMensagem(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // ⚠️ REMOVIDO: Sincronização periódica visual (sincronização real continua em background)

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [online]);

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      {/* Indicador de Status */}
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm ${
          online
            ? "bg-green-500/90 text-white"
            : "bg-red-500/90 text-white"
        }`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-medium hidden md:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium hidden md:inline">Offline</span>
          </>
        )}
      </motion.div>

      {/* Mensagem Temporária */}
      <AnimatePresence>
        {mostrarMensagem && (
          <motion.div
            className={`px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm ${
              online
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <p className="text-sm font-medium">
              {online
                ? "✓ Conexão restaurada"
                : "⚠ Sem conexão com internet"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}