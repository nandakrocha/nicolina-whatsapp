/**
 * SISTEMA DE MÁSCARA MONETÁRIA PROFISSIONAL (pt-BR)
 *
 * Fluxo correto:
 * - onFocus: Remove formatação (exibe valor editável)
 * - onChange: Permite digitação livre (apenas números e vírgula)
 * - onBlur: Aplica formatação final pt-BR
 */

/**
 * Remove formatação monetária para edição
 * Exemplo: "1.234,56" → "1234,56" ou "1234.56"
 */
export function removerFormatacaoMonetaria(valorFormatado: string): string {
  if (!valorFormatado) return '';

  // Remove pontos de milhar, mantém vírgula
  return valorFormatado.replace(/\./g, '');
}

/**
 * Sanitiza input durante digitação
 * Permite apenas números e vírgula (máximo 1 vírgula)
 */
export function sanitizarInputMonetario(valor: string): string {
  // Remove tudo exceto números e vírgula
  let sanitizado = valor.replace(/[^\d,]/g, '');

  // Garante apenas uma vírgula
  const partes = sanitizado.split(',');
  if (partes.length > 2) {
    sanitizado = partes[0] + ',' + partes.slice(1).join('');
  }

  // Limita casas decimais a 2
  if (partes.length === 2 && partes[1].length > 2) {
    sanitizado = partes[0] + ',' + partes[1].substring(0, 2);
  }

  return sanitizado;
}

/**
 * Formata valor para padrão brasileiro ao sair do campo (onBlur)
 * Exemplo: "50" → "50,00" | "3,3" → "3,30" | "1234,56" → "1.234,56"
 */
export function formatarMonetarioBlur(valorBruto: string): string {
  if (!valorBruto || valorBruto === '0') return '0,00';

  // Remove tudo exceto números e vírgula
  let limpo = valorBruto.replace(/[^\d,]/g, '');

  // Se vazio, retorna 0,00
  if (!limpo) return '0,00';

  // Substitui vírgula por ponto para parseFloat
  const numeroStr = limpo.replace(',', '.');
  const numero = parseFloat(numeroStr);

  if (isNaN(numero)) return '0,00';

  // Formata no padrão brasileiro
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte valor formatado para número
 * Exemplo: "1.234,56" → 1234.56
 */
export function converterMascaraParaNumero(valorFormatado: string): number {
  if (!valorFormatado) return 0;

  // Remove pontos de milhar e substitui vírgula por ponto
  const numeroLimpo = valorFormatado
    .replace(/\./g, '')
    .replace(',', '.');

  return parseFloat(numeroLimpo) || 0;
}

/**
 * Formata número para exibição
 * Exemplo: 1234.56 → "1.234,56"
 */
export function formatarNumeroParaMascara(numero: number): string {
  if (!numero && numero !== 0) return '0,00';

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * DEPRECATED: Usar o padrão onFocus/onChange/onBlur
 * Mantido apenas para compatibilidade temporária
 */
export function aplicarMascaraMonetaria(valor: string): string {
  return formatarMonetarioBlur(valor);
}
