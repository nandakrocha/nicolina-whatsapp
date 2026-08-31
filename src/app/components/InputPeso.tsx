import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import {
  removerFormatacaoPeso,
  sanitizarInputPeso,
  formatarPesoBlur,
  converterPesoParaNumero,
  formatarNumeroParaPeso,
} from "../utils/mascaraPeso";

interface InputPesoProps {
  valor: number;
  onChange: (valorNumerico: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  unidade?: "kg" | "un";
}

/**
 * Input de Peso (Kilograma) - pt-BR
 *
 * Comportamento:
 * - onFocus: Remove formatação excessiva
 * - onChange: Sanitiza input (apenas números e vírgula)
 * - onBlur: Aplica formatação com 3 casas decimais (padrão kg)
 *
 * IMPORTANTE: Este componente NÃO é para dinheiro!
 * Para valores monetários, use InputMonetario
 *
 * Exemplo de uso:
 * <InputPeso
 *   valor={quantidade}
 *   onChange={(novoValor) => setQuantidade(novoValor)}
 *   unidade="kg"
 * />
 */
export function InputPeso({
  valor,
  onChange,
  placeholder = "0,000",
  className = "",
  id,
  disabled = false,
  unidade = "kg",
}: InputPesoProps) {
  // Estado interno para controle de foco
  const [emEdicao, setEmEdicao] = useState(false);
  const [valorExibido, setValorExibido] = useState("");

  // Sincroniza valor externo com exibição
  useEffect(() => {
    if (!emEdicao) {
      if (unidade === "kg") {
        // kg: 3 casas decimais
        setValorExibido(formatarNumeroParaPeso(valor));
      } else {
        // un: número inteiro
        setValorExibido(Math.round(valor).toString());
      }
    }
  }, [valor, emEdicao, unidade]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEmEdicao(true);
    // Remove formatação para edição
    const valorEditavel = removerFormatacaoPeso(valorExibido);
    setValorExibido(valorEditavel);
    // Seleciona todo o texto para facilitar substituição
    setTimeout(() => e.target.select(), 10);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitiza input durante digitação
    const valorSanitizado = sanitizarInputPeso(e.target.value);
    setValorExibido(valorSanitizado);
  };

  const handleBlur = () => {
    setEmEdicao(false);

    let valorFormatado: string;
    let valorNumerico: number;

    if (unidade === "kg") {
      // kg: formata com 3 casas decimais
      valorFormatado = formatarPesoBlur(valorExibido);
      valorNumerico = converterPesoParaNumero(valorFormatado);
    } else {
      // un: arredonda para inteiro
      const numero = converterPesoParaNumero(valorExibido);
      valorNumerico = Math.round(numero);
      valorFormatado = valorNumerico.toString();
    }

    setValorExibido(valorFormatado);
    onChange(valorNumerico);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
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
