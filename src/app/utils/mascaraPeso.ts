/**
 * SISTEMA DE FORMATAÇÃO DE PESO (KILOGRAMA)
 *
 * Fluxo correto:
 * - onFocus: Remove formatação excessiva
 * - onChange: Permite digitação livre (números e vírgula)
 * - onBlur: Formata com 3 casas decimais (padrão kg)
 *
 * IMPORTANTE: Este arquivo NÃO lida com dinheiro, apenas peso!
 */

/**
 * Remove formatação de peso para edição
 * Mantém números e vírgula
 */
export function removerFormatacaoPeso(valorFormatado: string): string {
  if (!valorFormatado) return '';
  // Mantém apenas números e vírgula
  return valorFormatado.replace(/[^\d,]/g, '');
}

/**
 * Sanitiza input durante digitação
 * Permite apenas números e vírgula (máximo 1 vírgula)
 */
export function sanitizarInputPeso(valor: string): string {
  // Remove tudo exceto números e vírgula
  let sanitizado = valor.replace(/[^\d,]/g, '');

  // Garante apenas uma vírgula
  const partes = sanitizado.split(',');
  if (partes.length > 2) {
    sanitizado = partes[0] + ',' + partes.slice(1).join('');
  }

  // Limita casas decimais a 3 (padrão kg)
  if (partes.length === 2 && partes[1].length > 3) {
    sanitizado = partes[0] + ',' + partes[1].substring(0, 3);
  }

  return sanitizado;
}

/**
 * Formata peso para padrão brasileiro ao sair do campo (onBlur)
 * Exemplo: "1" → "1,000" | "3,33" → "3,330" | "50" → "50,000"
 *
 * IMPORTANTE: 3 casas decimais (não 2 como dinheiro)
 */
export function formatarPesoBlur(valorBruto: string): string {
  if (!valorBruto) return '0,000';

  // Remove tudo exceto números e vírgula
  let limpo = valorBruto.replace(/[^\d,]/g, '');

  // Se vazio, retorna 0,000
  if (!limpo) return '0,000';

  // Substitui vírgula por ponto para parseFloat
  const numeroStr = limpo.replace(',', '.');
  const numero = parseFloat(numeroStr);

  if (isNaN(numero)) return '0,000';

  // Formata com 3 casas decimais
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Converte peso formatado para número
 * Exemplo: "3,330" → 3.33
 */
export function converterPesoParaNumero(pesoFormatado: string): number {
  if (!pesoFormatado) return 0;

  // Remove pontos de milhar e substitui vírgula por ponto
  const numeroLimpo = pesoFormatado
    .replace(/\./g, '')
    .replace(',', '.');

  return parseFloat(numeroLimpo) || 0;
}

/**
 * Formata número para exibição como peso
 * Exemplo: 3.33 → "3,330"
 */
export function formatarNumeroParaPeso(numero: number): string {
  if (!numero && numero !== 0) return '0,000';

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Validação: verifica se o peso é válido
 */
export function isPesoValido(peso: number): boolean {
  return !isNaN(peso) && peso >= 0;
}
