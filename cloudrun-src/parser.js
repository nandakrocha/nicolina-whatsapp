/**
 * Interpretação de mensagens de encomenda recebidas pelo WhatsApp.
 *
 * Este módulo é puro: não conhece Firebase nem HTTP. Recebe o texto da
 * mensagem e o catálogo de produtos, e devolve os blocos de encomenda.
 * Isso permite testar a interpretação sem subir o serviço.
 */

// ─── Normalização ───────────────────────────────────────────────────────────

/** Minúsculas e sem acentos, preservando as quebras de linha e as posições. */
export function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const PLURAIS_IRREGULARES = new Map([
  ['paes', 'pao'],
  ['maes', 'mae'],
  ['caes', 'cao'],
  ['pais', 'pai'],
]);

/**
 * Reduz uma palavra já normalizada à forma singular.
 *
 * Não precisa ser linguisticamente perfeito: a mesma função é aplicada tanto
 * ao catálogo quanto à mensagem, então basta ser determinística para que
 * "pães franceses" e "pão francês" cheguem à mesma chave.
 */
export function singularizar(palavra) {
  const p = String(palavra || '');
  if (PLURAIS_IRREGULARES.has(p)) return PLURAIS_IRREGULARES.get(p);
  if (p.length <= 3) return p;
  if (p.endsWith('oes') || p.endsWith('aes')) return `${p.slice(0, -3)}ao`;
  if (p.endsWith('ais')) return `${p.slice(0, -3)}al`;
  if (p.endsWith('eis')) return `${p.slice(0, -3)}el`;
  if (p.endsWith('ois')) return `${p.slice(0, -3)}ol`;
  if (p.endsWith('uis')) return `${p.slice(0, -3)}ul`;
  if (p.endsWith('is')) return `${p.slice(0, -2)}il`;
  if (p.endsWith('ns')) return `${p.slice(0, -2)}m`;
  if (p.endsWith('res') || p.endsWith('zes') || p.endsWith('ses')) return p.slice(0, -2);
  if (p.endsWith('s')) return p.slice(0, -1);
  return p;
}

/** Quebra o texto normalizado em palavras/números, guardando as posições. */
export function tokenizar(textoNormalizado) {
  const tokens = [];
  const regex = /\d+(?:[.,]\d+)?|[a-z]+/g;
  let match;
  while ((match = regex.exec(textoNormalizado)) !== null) {
    tokens.push({
      bruto: match[0],
      base: singularizar(match[0]),
      inicio: match.index,
      fim: match.index + match[0].length,
    });
  }
  return tokens;
}

// ─── Catálogo ───────────────────────────────────────────────────────────────

/**
 * Monta a lista de termos reconhecíveis a partir dos produtos oficiais e dos
 * sinônimos cadastrados. Os sinônimos são reconciliados com o catálogo pelo
 * produtoId e, se ele estiver desatualizado, pelo nome.
 */
export function construirIndiceProdutos(produtos = {}, aliases = {}) {
  const entradas = [];
  const porId = new Map();
  const porNome = new Map();

  for (const [chaveFirebase, produto] of Object.entries(produtos || {})) {
    if (!produto?.nome) continue;
    const canonico = {
      produtoId: produto.id || chaveFirebase,
      produtoNome: String(produto.nome).trim(),
      pesoPorUnidadeKg: Number(produto.pesoPorUnidadeKg) || 0,
    };
    porId.set(canonico.produtoId, canonico);
    porNome.set(normalizarTexto(canonico.produtoNome).trim(), canonico);
  }

  const adicionar = (canonico, termo) => {
    const tokens = tokenizar(normalizarTexto(termo)).map((t) => t.base);
    if (!tokens.length) return;
    entradas.push({ ...canonico, termo: String(termo), tokens });
  };

  for (const canonico of porId.values()) adicionar(canonico, canonico.produtoNome);

  for (const alias of Object.values(aliases || {})) {
    const canonico =
      porId.get(alias?.produtoId) ??
      porNome.get(normalizarTexto(alias?.produtoNome || '').trim()) ??
      (alias?.produtoId || alias?.produtoNome
        ? {
            produtoId: alias.produtoId || '',
            produtoNome: String(alias.produtoNome || '').trim(),
            pesoPorUnidadeKg: 0,
          }
        : null);
    if (!canonico) continue;

    const sinonimos = Array.isArray(alias?.sinonimos)
      ? alias.sinonimos
      : Object.values(alias?.sinonimos || {});
    for (const sinonimo of sinonimos) adicionar(canonico, sinonimo);
  }

  // Termos mais longos primeiro, para que "pão de sal" ganhe de "sal".
  entradas.sort((a, b) => b.tokens.length - a.tokens.length);
  return entradas;
}

/**
 * Localiza no texto todas as ocorrências de produtos do índice.
 * Um token só pode pertencer a um produto, então o termo mais específico vence.
 */
export function encontrarProdutos(textoNormalizado, indice) {
  const tokens = tokenizar(textoNormalizado);
  const ocupado = new Array(tokens.length).fill(false);
  const achados = [];

  for (const entrada of indice) {
    const tamanho = entrada.tokens.length;
    for (let i = 0; i + tamanho <= tokens.length; i++) {
      let bate = true;
      for (let j = 0; j < tamanho; j++) {
        if (ocupado[i + j] || tokens[i + j].base !== entrada.tokens[j]) {
          bate = false;
          break;
        }
      }
      if (!bate) continue;
      for (let j = 0; j < tamanho; j++) ocupado[i + j] = true;
      achados.push({
        produtoId: entrada.produtoId,
        produtoNome: entrada.produtoNome,
        pesoPorUnidadeKg: entrada.pesoPorUnidadeKg,
        termo: entrada.termo,
        inicio: tokens[i].inicio,
        fim: tokens[i + tamanho - 1].fim,
      });
    }
  }

  achados.sort((a, b) => a.inicio - b.inicio);
  return achados;
}

// ─── Quantidade ─────────────────────────────────────────────────────────────

const UNIDADES_PESO = /^(kgs?|quilos?|kilos?)$/;
const UNIDADES_GRAMA = /^(g|gr|grs|gramas?)$/;

const EMBALAGENS =
  '(?:un|und|unds|unid|unidades?|pc|pcs|pecas?|pacotes?|potes?|barras?|caixas?|duzias?|tabuleiros?|formas?|sacos?)';

// Separadores comuns entre a quantidade e o produto: "650 - pães franceses".
const SEPARADORES = '(?:\\s*[-–—:.x*]\\s*)*';

/**
 * Regra 1: uma quantidade só é aceitável para lançar em produtos[] quando é
 * um número finito e maior que zero. Cobre 0, "0", null, undefined, NaN,
 * string vazia e valores inválidos — todos são rejeitados.
 */
export function quantidadeValida(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

/**
 * Extrai a quantidade escrita imediatamente antes do produto.
 *
 * Aceita separadores ("650 - pães"), unidades de embalagem ("7 pacotes de
 * café") e pesos ("1 kg", "500 g"), que são convertidos para quilos.
 */
export function extrairQuantidade(textoAntesProduto) {
  const texto = String(textoAntesProduto || '').trim();
  if (!texto) return { quantidade: null, unidade: '' };

  const matchPeso = texto.match(
    new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*([a-z]+)\\s*(?:de\\s*)?${SEPARADORES}$`, 'i'),
  );
  if (matchPeso) {
    const valor = Number(String(matchPeso[1]).replace(',', '.'));
    const unidade = String(matchPeso[2] || '').toLowerCase();
    if (UNIDADES_GRAMA.test(unidade)) {
      return { quantidade: valor / 1000, unidade: 'gramas' };
    }
    if (UNIDADES_PESO.test(unidade)) {
      return { quantidade: valor, unidade: 'kg' };
    }
    if (new RegExp(`^${EMBALAGENS}$`, 'i').test(unidade)) {
      return { quantidade: valor, unidade: '' };
    }
  }

  const matchQuantidade = texto.match(
    new RegExp(`(\\d+(?:[.,]\\d+)?)${SEPARADORES}$`),
  );
  if (matchQuantidade) {
    return {
      quantidade: Number(String(matchQuantidade[1]).replace(',', '.')),
      unidade: '',
    };
  }

  return { quantidade: null, unidade: '' };
}

// ─── Horários e turnos ──────────────────────────────────────────────────────

/**
 * Turnos escritos por extenso. O sistema trabalha só com horas cheias, então
 * manhã vira 06:00 e tarde vira 11:00.
 */
export const HORA_MANHA = '06:00';
export const HORA_TARDE = '11:00';

const REGEX_DATA = /(?:\bdia\s*:?\s*)?\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/gi;

/**
 * Lê um horário do texto aceitando as variações mais comuns de digitação:
 * 11:00, 11h00, 11h, 11;00, 11,00, 11.00, "às 11", "as 11", "11 horas",
 * além dos turnos "manhã" e "tarde". Os minutos são sempre descartados.
 */
export function interpretarHorario(texto) {
  const semData = normalizarTexto(texto).replace(REGEX_DATA, ' ');

  const padroes = [
    // 11:00 · 11h00 · 11;00 · 11,00 · 11.00
    /\b(\d{1,2})\s*[:h;,.]\s*([0-5]\d)\b/,
    // 11h · 11 hrs · 11 horas
    /\b(\d{1,2})\s*(?:h|hs|hrs|horas?)\b/,
    // às 11 · as 11 · para as 11 · pras 11
    /(?:\bas|\bpara\s+as?|\bpra|\bpras)\s*(\d{1,2})\b/,
  ];

  for (const padrao of padroes) {
    const match = semData.match(padrao);
    if (!match) continue;
    const hora = Number(match[1]);
    if (Number.isFinite(hora) && hora >= 0 && hora <= 23) {
      return `${String(hora).padStart(2, '0')}:00`;
    }
  }

  // Turnos por extenso: "manhã", "pela manhã", "parte da manhã", "à tarde"...
  if (/\bmanha\b/.test(semData)) return HORA_MANHA;
  if (/\btarde\b/.test(semData)) return HORA_TARDE;

  return '';
}

// ─── Datas ──────────────────────────────────────────────────────────────────

/** Data de hoje em São Paulo, no formato YYYY-MM-DD. */
export function hojeEmSaoPaulo(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/**
 * Converte dia/mês/ano em YYYY-MM-DD. Quando o ano não é informado, assume o
 * ano corrente e avança para o próximo se a data já tiver passado há muito
 * tempo (mensagem de dezembro pedindo para janeiro).
 */
export function montarData(dia, mes, ano, hoje) {
  if (!(dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12)) return '';

  let anoFinal = ano ? Number(ano) : Number(hoje.slice(0, 4));
  if (anoFinal < 100) anoFinal += 2000;

  const formatar = (a) =>
    `${String(a).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

  let data = formatar(anoFinal);
  if (!ano) {
    const diasDeDiferenca =
      (Date.parse(`${data}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000;
    if (diasDeDiferenca < -60) data = formatar(anoFinal + 1);
  }
  return data;
}

// ─── Interpretação da mensagem ──────────────────────────────────────────────

const REGEX_COMANDO_INTERNO = /^ok\s+agendado(?:\s+\d+)?$/i;

/**
 * Verbos que indicam mexer numa encomenda que já existe. A lista é estreita de
 * propósito: termos ambíguos como "mais" ficam de fora para não desviar um
 * pedido novo que apenas os mencione.
 */
const REGEX_VERBO_DE_ALTERACAO =
  /\b(adiciona|adicionar|adicione|acrescenta|acrescentar|acrescente|inclui|incluir|inclua|cancela|cancelar|cancele|remove|remover|remova|retira|retirar|retire|exclui|excluir|exclua|altera|alterar|altere|muda|mudar|mude|troca|trocar|troque|corrige|corrigir|corrija)\b/;

/**
 * Decide se a mensagem é um pedido novo ou uma alteração de encomenda.
 * Com duas ou mais datas é sempre um pedido novo; com uma só, o verbo decide.
 */
export function ehPedidoNovo(textoNormalizado, quantidadeDeBlocos) {
  if (quantidadeDeBlocos >= 2) return true;
  if (quantidadeDeBlocos === 1) return !REGEX_VERBO_DE_ALTERACAO.test(textoNormalizado);
  return false;
}

const VERBOS_DE_INSTRUCAO =
  /\b(entregar|entregue|entrega|deixar|deixe|levar|leve|mandar|mande|separar|separe|enviar|envie|retirar|buscar)\b/;

/** Uma linha parece um item de pedido quando começa com uma quantidade. */
function pareceLinhaDeItem(linha) {
  return /^\s*\d+(?:[.,]\d+)?\s*(?:[-–—:.x*]\s*)*[a-z]/i.test(linha);
}

/**
 * Linha que manda entregar algo em outro horário, e não um item do pedido.
 * Exemplo: "(ENTREGAR O QUEIJO NA PARTE DA MANHÃ)".
 */
function pareceLinhaDeInstrucao(conteudo, hora) {
  if (!hora) return false;
  return conteudo.startsWith('(') || VERBOS_DE_INSTRUCAO.test(conteudo);
}

function fatiarEmLinhas(textoNormalizado, inicio, fim) {
  const linhas = [];
  let posicao = inicio;
  while (posicao < fim) {
    let quebra = textoNormalizado.indexOf('\n', posicao);
    if (quebra === -1 || quebra > fim) quebra = fim;
    linhas.push({ inicio: posicao, fim: quebra, texto: textoNormalizado.slice(posicao, quebra) });
    posicao = quebra + 1;
  }
  return linhas;
}

/**
 * Interpreta a mensagem inteira e devolve um bloco por data encontrada.
 *
 * Cada bloco traz os produtos reconhecidos com quantidade, as observações
 * livres e as pendências — trechos que parecem um item de pedido mas cujo
 * produto não está cadastrado nem tem sinônimo.
 */
export function interpretarMensagem(textoOriginal, indice, opcoes = {}) {
  const hoje = opcoes.hoje || hojeEmSaoPaulo();
  const texto = normalizarTexto(textoOriginal);

  // A normalização preserva o comprimento para acentos latinos, o que permite
  // recortar o texto original — com acentos e maiúsculas — pelas mesmas
  // posições. Se algum caractere fugir à regra, exibimos o texto normalizado.
  const original = String(textoOriginal ?? '');
  const recortarOriginal =
    original.length === texto.length ? (i, f) => original.slice(i, f) : (i, f) => texto.slice(i, f);

  // 1. Todas as datas e onde elas começam.
  const datas = [];
  REGEX_DATA.lastIndex = 0;
  let matchData;
  while ((matchData = REGEX_DATA.exec(texto)) !== null) {
    datas.push({
      inicio: matchData.index,
      fim: matchData.index + matchData[0].length,
      data: montarData(Number(matchData[1]), Number(matchData[2]), matchData[3], hoje),
    });
  }

  const produtosDoTexto = encontrarProdutos(texto, indice);

  // 2. Cada data inicia um bloco que vai até a data seguinte. O bloco começa no
  //    início da linha da data, e não na data em si, porque o pedido costuma vir
  //    antes dela ("1 tabuleiro de broa para quarta-feira (02/09)").
  const inicioDoBloco = (lista, i) => {
    const dataAtual = lista[i];
    const inicioDaLinha = texto.lastIndexOf('\n', dataAtual.inicio - 1) + 1;
    const anterior = i > 0 ? lista[i - 1] : null;
    // Duas datas na mesma linha: cada bloco começa na própria data, senão o
    // segundo invadiria o primeiro.
    return anterior && anterior.fim > inicioDaLinha ? dataAtual.inicio : inicioDaLinha;
  };

  const blocos = datas
    .filter((d) => d.data)
    .map((dataAtual, i, lista) => {
      const inicio = inicioDoBloco(lista, i);
      const fim = i < lista.length - 1 ? inicioDoBloco(lista, i + 1) : texto.length;
      return montarBloco({
        texto,
        recortarOriginal,
        inicio,
        fim,
        data: dataAtual.data,
        fimDaData: dataAtual.fim,
        produtosDoTexto,
        indice,
      });
    });

  const pendencias = blocos.flatMap((b) => b.pendencias);
  const temProdutos = blocos.some((b) => b.produtos.length > 0);

  return {
    blocos,
    pendencias,
    // A mensagem só é considerada completa quando todo bloco tem pelo menos um
    // produto com quantidade e nada ficou sem reconhecer.
    completa: temProdutos && pendencias.length === 0 && blocos.every((b) => b.valido),
  };
}

function montarBloco({ texto, recortarOriginal, inicio, fim, data, fimDaData, produtosDoTexto, indice }) {
  // 1. Classifica cada linha antes de extrair qualquer item. Sem isso, uma
  //    instrução como "(ENTREGAR O QUEIJO...)" seria lida como um pedido de
  //    queijo sem quantidade.
  const limpar = (valor) => valor.replace(/[*_~]/g, '').trim();
  const linhas = fatiarEmLinhas(texto, inicio, fim).map((linha) => {
    const conteudo = limpar(linha.texto);
    const hora = interpretarHorario(conteudo);
    return {
      ...linha,
      conteudo,
      // Texto como o cliente escreveu, para preservar na observação.
      conteudoOriginal: limpar(recortarOriginal(linha.inicio, linha.fim)),
      hora,
      ehCabecalho: linha.inicio <= inicio && linha.fim >= fimDaData,
      ehInstrucao: pareceLinhaDeInstrucao(conteudo, hora),
    };
  });

  const linhaDe = (posicao) => linhas.find((l) => posicao >= l.inicio && posicao < l.fim);

  // 2. O horário do bloco vem do cabeçalho ou de uma linha que só tem horário.
  const cabecalho = linhas.find((l) => l.ehCabecalho);
  let horaDoBloco = cabecalho?.hora || '';
  if (!horaDoBloco) {
    const linhaSoDeHorario = linhas.find(
      (l) =>
        !l.ehCabecalho &&
        !l.ehInstrucao &&
        l.hora &&
        !pareceLinhaDeItem(l.conteudo) &&
        !produtosDoTexto.some((p) => p.inicio >= l.inicio && p.inicio < l.fim),
    );
    if (linhaSoDeHorario) {
      horaDoBloco = linhaSoDeHorario.hora;
      linhaSoDeHorario.usadaComoHorario = true;
    }
  }

  // 3. Só viram itens os produtos que estão fora das linhas de instrução.
  const produtosDoBloco = produtosDoTexto
    .filter((p) => p.inicio >= inicio && p.inicio < fim)
    .filter((p) => !linhaDe(p.inicio)?.ehInstrucao)
    .map((p) => {
      const linha = linhaDe(p.inicio);
      const inicioLinha = Math.max(linha?.inicio ?? inicio, inicio);
      const fimLinha = Math.min(linha?.fim ?? fim, fim);

      const antes = texto.slice(inicioLinha, p.inicio);
      // A data do cabeçalho não pode ser confundida com quantidade.
      const { quantidade, unidade } = extrairQuantidade(antes.replace(REGEX_DATA, ' '));

      let observacao = recortarOriginal(p.fim, fimLinha);
      // Na linha do cabeçalho a data e a hora já viram colunas próprias, então
      // repeti-las na observação só polui a tabela.
      if (linha?.ehCabecalho) {
        observacao = observacao
          .replace(REGEX_DATA, ' ')
          .replace(/\(\s*\)/g, ' ')
          .replace(/(?:^|\s)(?:[àa]s\s*)?\d{1,2}\s*(?:[:h;,.]\s*\d{2}|h)\b/gi, ' ');
      }
      observacao = observacao
        .replace(/^[\s,:;\-–—*]+/, '')
        .replace(/[\s*.,;:\-–—]+$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (unidade) observacao = observacao ? `${unidade} - ${observacao}` : unidade;

      return {
        produtoId: p.produtoId,
        produtoNome: p.produtoNome,
        pesoPorUnidadeKg: p.pesoPorUnidadeKg,
        quantidade,
        observacao,
        inicio: p.inicio,
        fim: p.fim,
        hora: horaDoBloco,
      };
    });

  // 4. Instruções aplicam um horário diferente ao produto que citam.
  const observacoes = [];
  const pendencias = [];

  for (const linha of linhas) {
    if (!linha.conteudo || linha.ehCabecalho || linha.usadaComoHorario) continue;
    if (REGEX_COMANDO_INTERNO.test(linha.conteudo)) continue;

    if (linha.ehInstrucao) {
      const alvos = aplicarExcecaoDeHorario({ linha, produtosDoBloco, indice });
      // A instrução fica na observação do produto que ela cita; se não citar
      // nenhum, vira observação geral do bloco.
      if (alvos.length) {
        for (const produto of alvos) {
          produto.observacao = produto.observacao
            ? `${produto.observacao} - ${linha.conteudoOriginal}`
            : linha.conteudoOriginal;
        }
      } else {
        observacoes.push(linha.conteudoOriginal);
      }
      continue;
    }

    const temProdutoNaLinha = produtosDoBloco.some(
      (p) => p.inicio >= linha.inicio && p.inicio < linha.fim,
    );
    if (temProdutoNaLinha) continue;

    if (pareceLinhaDeItem(linha.conteudo)) {
      pendencias.push({ texto: linha.conteudoOriginal, motivo: 'produto_nao_reconhecido' });
      continue;
    }

    observacoes.push(linha.conteudoOriginal);
  }

  // 5. Produto reconhecido sem quantidade é pendência, nunca descarte silencioso.
  for (const produto of produtosDoBloco) {
    if (quantidadeValida(produto.quantidade)) continue;
    pendencias.push({
      texto: (linhaDe(produto.inicio)?.conteudoOriginal || produto.produtoNome).trim(),
      motivo: 'quantidade_nao_reconhecida',
      produtoNome: produto.produtoNome,
    });
  }

  const produtosValidos = produtosDoBloco.filter((p) => p.produtoId && quantidadeValida(p.quantidade));

  return {
    data,
    hora: horaDoBloco,
    produtos: produtosValidos,
    observacao: observacoes.join(' - '),
    pendencias,
    // Observação nunca torna um bloco válido: sem produto, não há encomenda.
    valido: Boolean(horaDoBloco) && produtosValidos.length > 0 && pendencias.length === 0,
  };
}

/**
 * Aplica o horário de uma linha de instrução ao produto que ela cita.
 * Devolve os produtos afetados.
 */
function aplicarExcecaoDeHorario({ linha, produtosDoBloco, indice }) {
  const alvos = [];

  // A instrução pode citar o produto pelo nome oficial ou por um sinônimo
  // que não aparece nele ("queijo" para Mussarela).
  for (const achado of encontrarProdutos(normalizarTexto(linha.conteudo), indice)) {
    for (const produto of produtosDoBloco) {
      if (produto.produtoId === achado.produtoId && !alvos.includes(produto)) {
        alvos.push(produto);
      }
    }
  }

  for (const produto of alvos) produto.hora = linha.hora;
  return alvos;
}

/**
 * Agrupa os produtos de um bloco por horário. Um bloco com pão às 11:00 e
 * queijo às 06:00 vira duas encomendas na mesma data.
 */
export function agruparPorHorario(bloco) {
  const grupos = new Map();
  for (const produto of bloco.produtos) {
    const hora = produto.hora || bloco.hora;
    if (!grupos.has(hora)) grupos.set(hora, []);
    grupos.get(hora).push(produto);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, produtos]) => ({ data: bloco.data, hora, produtos, observacao: bloco.observacao }));
}
