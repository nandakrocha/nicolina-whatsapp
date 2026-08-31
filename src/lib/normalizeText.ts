/**
 * Remove acentos, cedilha e caracteres especiais de uma string
 * para facilitar buscas sem sensibilidade a acentuação
 * 
 * Exemplos:
 * - "São Paulo" → "sao paulo"
 * - "Café" → "cafe"
 * - "Açúcar" → "acucar"
 * - "Pão Francês" → "pao frances"
 */
export function normalizeText(text: string | undefined | null): string {
  if (!text) return "";
  
  return text
    .toLowerCase()
    .normalize("NFD") // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
    .trim();
}

/**
 * Verifica se um texto contém outro (busca sem acentos)
 */
export function containsText(source: string | undefined | null, search: string | undefined | null): boolean {
  // Se não houver termo de busca, retorna true (mostra todos)
  if (!search || search.trim() === "") return true;
  // Se não houver source mas houver search, retorna false
  if (!source) return false;
  return normalizeText(source).includes(normalizeText(search));
}

/**
 * Verifica se um texto começa com outro (busca sem acentos)
 */
export function startsWithText(source: string | undefined | null, search: string | undefined | null): boolean {
  // Se não houver termo de busca, retorna true (mostra todos)
  if (!search || search.trim() === "") return true;
  // Se não houver source mas houver search, retorna false
  if (!source) return false;
  return normalizeText(source).startsWith(normalizeText(search));
}
