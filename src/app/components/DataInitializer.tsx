import { useEffect } from "react";
import { inicializarDadosDeExemplo } from "../lib/dadosIniciais";

export function DataInitializer() {
  useEffect(() => {
    inicializarDadosDeExemplo();
  }, []);

  return null;
}