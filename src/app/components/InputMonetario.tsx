import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import {
  removerFormatacaoMonetaria,
  sanitizarInputMonetario,
  formatarMonetarioBlur,
  converterMascaraParaNumero,
  formatarNumeroParaMascara,
} from "../utils/mascaraMonetaria";

interface InputMonetarioProps {
  valor: number;
  onChange: (valorNumerico: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Input Monetário Profissional pt-BR
 *
 * Comportamento:
 * - onFocus: Remove formatação (permite edição livre)
 * - onChange: Sanitiza input (apenas números e vírgula)
 * - onBlur: Aplica formatação pt-BR completa
 *
 * Exemplo de uso:
 * <InputMonetario
 *   valor={preco}
 *   onChange={(novoValor) => setPreco(novoValor)}
 *   placeholder="0,00"
 * />
 */
export function InputMonetario({
  valor,
  onChange,
  placeholder = "0,00",
  className = "",
  id,
  disabled = false,
}: InputMonetarioProps) {
  // Estado interno para controle de foco
  const [emEdicao, setEmEdicao] = useState(false);
  const [valorExibido, setValorExibido] = useState("");

  // Sincroniza valor externo com exibição
  useEffect(() => {
    if (!emEdicao) {
      setValorExibido(formatarNumeroParaMascara(valor));
    }
  }, [valor, emEdicao]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEmEdicao(true);
    // Remove formatação para edição
    const valorEditavel = removerFormatacaoMonetaria(valorExibido);
    setValorExibido(valorEditavel);
    // Seleciona todo o texto para facilitar substituição
    setTimeout(() => e.target.select(), 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitiza input durante digitação (permite apenas números e vírgula)
    const valorSanitizado = sanitizarInputMonetario(e.target.value);
    setValorExibido(valorSanitizado);
  };

  const handleBlur = () => {
    setEmEdicao(false);
    // Aplica formatação final
    const valorFormatado = formatarMonetarioBlur(valorExibido);
    setValorExibido(valorFormatado);
    // Converte para número e envia para parent
    const valorNumerico = converterMascaraParaNumero(valorFormatado);
    onChange(valorNumerico);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={valorExibido}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
