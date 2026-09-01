import { http } from '@google-cloud/functions-framework';
import admin from 'firebase-admin';

import {
  agruparPorHorario,
  construirIndiceProdutos,
  ehPedidoNovo,
  encontrarProdutos,
  extrairQuantidade,
  hojeEmSaoPaulo,
  interpretarHorario,
  interpretarMensagem,
  normalizarTexto,
  quantidadeValida,
} from './parser.js';

import {
  listaDeProdutos,
  localizarEncomenda,
  mesclarProdutos,
  nomeDoProduto,
  normalizarProdutoEncomenda,
  somarQuantidades,
} from './encomendas.js';

admin.initializeApp({
  databaseURL: 'https://nicolina---teste-whatsapp-default-rtdb.firebaseio.com/',
});

const db = admin.database();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const PATH_ENCOMENDAS = 'nicolina/encomendas';
const PATH_WA = 'nicolina/integracao_whatsapp';

const REGEX_OK_AGENDADO = /^ok\s+agendado\s+(\d+)$/i;
const REGEX_OK_AGENDADO_SOLTO = /^ok\s+agendado(?:\s+\d+)?$/i;

// ─── Palavras-chave das mensagens de conversa ───────────────────────────────

const PALAVRAS_CHAVE = {
  hoje: ['hoje', 'hj', 'oje', 'hje'],
  amanha: ['amanha', 'aman', 'amanh'],
  adicionar: [
    'adiciona', 'adicionar', 'adicione', 'add', 'acrescenta', 'acrescentar',
    'acrescente', 'coloca', 'colocar', 'coloque', 'inclui', 'incluir', 'inclua',
    'bota', 'botar', 'poe', 'mais',
  ],
  cancelar: [
    'cancela', 'cancelar', 'cancele', 'cancel', 'remove', 'remover', 'remova',
    'retira', 'retirar', 'retire', 'exclui', 'excluir', 'exclua', 'tira',
    'tirar', 'tire', 'nao quero',
  ],
  alterar: [
    'altera', 'alterar', 'altere', 'muda', 'mudar', 'mude', 'troca', 'trocar',
    'troque', 'corrige', 'corrigir', 'corrija', 'passa', 'passar', 'passe',
  ],
  horario: ['horario', 'hora', 'horas', 'hr', 'hrs'],
};

const contem = (grupo, texto) =>
  PALAVRAS_CHAVE[grupo]?.some((palavra) => texto.includes(normalizarTexto(palavra))) || false;

const temIndicacaoDeHorario = (texto) =>
  contem('horario', texto) ||
  /\b\d{1,2}\s*[:h;,.]\s*\d{2}\b/.test(texto) ||
  /\b\d{1,2}\s*h\b/.test(texto) ||
  /\bas\s+\d{1,2}\b/.test(texto);

// ─── Utilidades ─────────────────────────────────────────────────────────────

function novoId(sufixo = '') {
  return `${Date.now()}${sufixo}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Normaliza o telefone para comparação. No Brasil a Meta devolve o celular
 * com ou sem o nono dígito depois do DDD.
 */
function telefoneComparavel(valor) {
  let numero = String(valor || '').replace(/\D/g, '');
  if (numero.startsWith('55') && numero.length === 13 && numero.slice(4, 5) === '9') {
    numero = numero.slice(0, 4) + numero.slice(5);
  }
  return numero;
}

async function lerCatalogo() {
  const [produtosSnap, aliasesSnap] = await Promise.all([
    db.ref('nicolina/produtos').once('value'),
    db.ref(`${PATH_WA}/produtos_alias`).once('value'),
  ]);
  const produtos = produtosSnap.val() || {};
  const aliases = aliasesSnap.val() || {};
  return { produtos, indice: construirIndiceProdutos(produtos, aliases) };
}

/** Produtos citados na mensagem, com quantidade, no formato do pedido em andamento. */
function detectarProdutos(textoNormalizado, indice) {
  return encontrarProdutos(textoNormalizado, indice).map((achado) => {
    const inicioLinha = textoNormalizado.lastIndexOf('\n', achado.inicio) + 1;
    let fimLinha = textoNormalizado.indexOf('\n', achado.inicio);
    if (fimLinha === -1) fimLinha = textoNormalizado.length;

    const { quantidade, unidade } = extrairQuantidade(
      textoNormalizado.slice(inicioLinha, achado.inicio),
    );

    let observacao = textoNormalizado
      .slice(achado.fim, fimLinha)
      .replace(/^[\s,:;\-–—]+/, '')
      .trim();
    if (unidade) observacao = observacao ? `${unidade} - ${observacao}` : unidade;

    return {
      produtoId: achado.produtoId,
      produtoNome: achado.produtoNome,
      pesoPorUnidadeKg: achado.pesoPorUnidadeKg,
      quantidade: Number(quantidade) || 0,
      observacao,
      posicao: achado.inicio,
    };
  });
}

function montarEncomenda({ data, hora, produtos, observacao, conversa, nomeCliente, telefone }) {
  const id = novoId();
  const lista = produtos.map(normalizarProdutoEncomenda);
  return {
    id,
    atualizadoEm: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
    clienteId: conversa?.clienteId || '',
    clienteNome: conversa?.clienteNome || nomeCliente || '',
    clienteTelefone: telefone || '',
    data,
    hora,
    observacao: observacao || '',
    produtos: lista,
    quantidadeTotal: somarQuantidades(lista),
    origem: 'whatsapp',
  };
}

/**
 * Grava as encomendas e confere, lendo de volta, que cada uma foi realmente
 * persistida com os mesmos produtos e o mesmo total.
 */
async function gravarEncomendasVerificando(encomendas) {
  const criadas = [];
  const falhas = [];

  for (const encomenda of encomendas) {
    try {
      await db.ref(`${PATH_ENCOMENDAS}/${encomenda.id}`).set(encomenda);

      const conferencia = (await db.ref(`${PATH_ENCOMENDAS}/${encomenda.id}`).once('value')).val();
      const produtosGravados = listaDeProdutos(conferencia);

      const confere =
        conferencia &&
        produtosGravados.length === encomenda.produtos.length &&
        Number(conferencia.quantidadeTotal) === encomenda.quantidadeTotal;

      if (confere) {
        criadas.push(encomenda.id);
      } else {
        falhas.push({ id: encomenda.id, data: encomenda.data, motivo: 'gravacao_divergente' });
      }
    } catch (erro) {
      falhas.push({ id: encomenda.id, data: encomenda.data, motivo: String(erro?.message || erro) });
    }
  }

  return { criadas, falhas };
}

/** Desfaz as encomendas já gravadas quando alguma do lote falhou. */
async function desfazerEncomendas(ids) {
  for (const id of ids) {
    try {
      await db.ref(`${PATH_ENCOMENDAS}/${id}`).remove();
    } catch (erro) {
      console.error('NÃO FOI POSSÍVEL DESFAZER A ENCOMENDA:', id, erro);
    }
  }
}

// ─── Handler ────────────────────────────────────────────────────────────────

http('whatsappWebhook', async (req, res) => {
  const origin = req.headers.origin || '';
  if (origin.endsWith('.figma.site')) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');

  if (req.method === 'POST' && req.path === '/send-message') {
    return tratarEnvioManual(req, res);
  }

  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') return tratarMensagemRecebida(req, res);

  return res.status(405).send('Method Not Allowed');
});

// ─── POST /send-message ─────────────────────────────────────────────────────

async function tratarEnvioManual(req, res) {
  try {
    const { telefone, mensagem } = req.body || {};
    const texto = String(mensagem || '').trim();
    const comando = texto.match(REGEX_OK_AGENDADO);

    if (comando) return tratarComandoAgendado(req, res, { telefone, codigo: comando[1] });

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !telefone || !mensagem) {
      return res.status(400).json({ ok: false, erro: 'Dados obrigatórios ausentes' });
    }

    const resposta = await enviarWhatsApp(PHONE_NUMBER_ID, telefone, texto);
    if (!resposta.ok) return res.status(resposta.status).json({ ok: false, erro: resposta.corpo });
    return res.status(200).json({ ok: true, resultado: resposta.corpo });
  } catch (erro) {
    console.error('Erro no envio manual:', erro);
    return res.status(500).json({ ok: false, erro: 'Erro interno no envio' });
  }
}

/**
 * Comando interno "ok agendado 30": vincula a mensagem pendente ao cliente e
 * manda o interpretador processá-la. A mensagem só é marcada como processada
 * se a interpretação e a gravação tiverem terminado inteiras.
 */
async function tratarComandoAgendado(req, res, { telefone, codigo }) {
  const clientes = (await db.ref('nicolina/clientes').once('value')).val() || {};
  const cliente = Object.values(clientes).find(
    (c) => String(c?.codigo || '').trim() === codigo,
  );

  if (!cliente) {
    return res.status(404).json({
      ok: false,
      tipo: 'comando_agendado',
      erro: `Cliente código ${codigo} não encontrado`,
    });
  }

  const telefoneNormalizado = String(telefone || '').replace(/\D/g, '');
  const dadosCliente = {
    clienteId: cliente.id || '',
    clienteCodigo: codigo,
    clienteNome: cliente.nome || '',
  };

  await db.ref(`${PATH_WA}/conversas/${telefoneNormalizado}`).update({
    ...dadosCliente,
    status: 'agendado',
    atualizadoEm: new Date().toISOString(),
  });

  const pendentes =
    (await db.ref(`${PATH_WA}/conversas/${telefoneNormalizado}/mensagensPendentes`).once('value')).val() || {};

  const naoProcessadas = Object.entries(pendentes)
    .filter(([, p]) => p && p.processada !== true && !REGEX_OK_AGENDADO_SOLTO.test(String(p.texto || '').trim()))
    .sort((a, b) => new Date(b[1]?.dataHora || 0) - new Date(a[1]?.dataHora || 0));

  if (!naoProcessadas.length) {
    return res.status(404).json({
      ok: false,
      tipo: 'comando_agendado',
      erro: 'Nenhuma mensagem pendente encontrada',
    });
  }

  const [chave, pendencia] = naoProcessadas[0];
  const refPendencia = db.ref(`${PATH_WA}/conversas/${telefoneNormalizado}/mensagensPendentes/${chave}`);

  await refPendencia.update({
    ...dadosCliente,
    status: 'agendado',
    processada: false,
    agendadaEm: new Date().toISOString(),
  });

  // Reenvia a mensagem para o próprio webhook, agora liberada para interpretar.
  const resposta = await fetch(`https://${req.get('host')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processamentoLiberado: true,
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            metadata: { phone_number_id: PHONE_NUMBER_ID },
            contacts: [{ wa_id: telefoneNormalizado, profile: { name: cliente.nome || '' } }],
            messages: [{
              from: telefoneNormalizado,
              id: pendencia?.idMensagem || chave,
              timestamp: String(Math.floor(Date.now() / 1000)),
              type: 'text',
              text: { body: pendencia?.texto || '' },
            }],
          },
        }],
      }],
    }),
  });

  const corpo = await resposta.text();
  let resultado = null;
  try {
    resultado = JSON.parse(corpo);
  } catch {
    console.error('RESPOSTA DO PROCESSAMENTO NÃO É JSON:', corpo);
  }

  const pendenciasInterpretacao = resultado?.pendencias || [];
  const criadas = Number(resultado?.quantidadeEncomendasCriadas) || 0;

  // Só é sucesso quando o interpretador confirmou que converteu e gravou tudo.
  const sucesso =
    resposta.ok &&
    resultado?.processamentoConcluido === true &&
    resultado?.interpretacaoCompleta === true &&
    pendenciasInterpretacao.length === 0 &&
    criadas > 0;

  if (!sucesso) {
    await refPendencia.update({
      status: 'incompleto',
      processada: false,
      pendencias: pendenciasInterpretacao,
      conferidaEm: new Date().toISOString(),
    });

    console.log('PENDÊNCIA MANTIDA: a mensagem não foi convertida por inteiro.', {
      chave, codigo, criadas, pendencias: pendenciasInterpretacao,
    });

    return res.status(422).json({
      ok: false,
      tipo: 'comando_agendado',
      erro: pendenciasInterpretacao.length
        ? 'A mensagem ficou pendente: há itens que o sistema não conseguiu interpretar.'
        : 'A mensagem foi mantida pendente porque nenhuma encomenda foi criada.',
      pendencias: pendenciasInterpretacao,
      quantidadeEncomendasCriadas: criadas,
      cliente: { id: cliente.id || '', codigo, nome: cliente.nome || '' },
    });
  }

  const marcaProcessada = {
    ...dadosCliente,
    processada: true,
    processadaEm: new Date().toISOString(),
  };
  await refPendencia.update(marcaProcessada);
  await db.ref(`${PATH_WA}/mensagens/${chave}`).update({
    ...marcaProcessada,
    status: 'processado',
    cliente: cliente.nome || '',
    encomendasCriadas: criadas,
  });

  return res.status(200).json({
    ok: true,
    tipo: 'comando_agendado',
    cliente: { id: cliente.id || '', codigo, nome: cliente.nome || '' },
    quantidadeEncomendasCriadas: criadas,
    mensagem: `Cliente identificado: ${codigo} - ${cliente.nome || ''}`,
  });
}

async function enviarWhatsApp(phoneNumberId, telefone, texto) {
  const resposta = await fetch(`https://graph.facebook.com/v26.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(telefone).replace(/\D/g, ''),
      type: 'text',
      text: { body: String(texto) },
    }),
  });
  const corpo = await resposta.text();
  console.log('Envio WhatsApp:', resposta.status, corpo);
  return { ok: resposta.ok, status: resposta.status, corpo };
}

// ─── POST webhook ───────────────────────────────────────────────────────────

async function tratarMensagemRecebida(req, res) {
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const processamentoLiberado = req.body?.processamentoLiberado === true;

    // Eventos de status não trazem mensagem.
    if (!message) return res.status(200).send('EVENT_RECEIVED');

    const phoneNumberId = value?.metadata?.phone_number_id;
    const remetente = message.from;
    const textoMensagem = message.text?.body ?? '';
    const nomeCliente = value?.contacts?.[0]?.profile?.name ?? '';
    const telefoneCliente = value?.contacts?.[0]?.wa_id ?? remetente;

    const chaveMensagem = (message.id || `msg_${Date.now()}`).replace(/[.#$[\]/]/g, '_');
    const dataHora = message.timestamp
      ? new Date(Number(message.timestamp) * 1000).toISOString()
      : new Date().toISOString();

    await db.ref(`${PATH_WA}/mensagens/${chaveMensagem}`).set({
      idMensagem: message.id ?? '',
      cliente: nomeCliente || telefoneCliente,
      telefone: telefoneCliente,
      dataHora,
      timestamp: message.timestamp ?? '',
      grupo: '',
      resumo: textoMensagem,
      texto: textoMensagem,
      tipo: message.type ?? '',
      status: 'recebido',
      origem: 'whatsapp',
    });

    const telefoneConversa = String(telefoneCliente || remetente || '').replace(/\D/g, '');

    // "ok agendado 30" digitado no próprio WhatsApp aciona o mesmo comando.
    const gatilho = String(textoMensagem || '').trim().match(REGEX_OK_AGENDADO);
    if (gatilho && telefoneConversa && !processamentoLiberado) {
      const resposta = await fetch(`https://${req.get('host')}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneConversa, mensagem: `ok agendado ${gatilho[1]}` }),
      });
      console.log('RESULTADO GATILHO WHATSAPP:', resposta.status, await resposta.text());
      return res.status(200).send('EVENT_RECEIVED');
    }

    if (telefoneConversa) {
      await db.ref(`${PATH_WA}/conversas/${telefoneConversa}/mensagensPendentes/${chaveMensagem}`).set({
        idMensagem: message.id ?? '',
        texto: textoMensagem,
        dataHora,
        telefone: telefoneConversa,
        processada: false,
      });
      await db.ref(`${PATH_WA}/conversas/${telefoneConversa}`).update({
        telefone: telefoneConversa,
        ultimaMensagemEm: dataHora,
      });
    }

    // Mensagem encaminhada por um atendente espera o gatilho "ok agendado".
    const configuracoes = (await db.ref(`${PATH_WA}/configuracoes`).once('value')).val() || {};
    const encaminhadores = Object.values(configuracoes.telefoneEncaminhador || {});
    const ehEncaminhador = encaminhadores.some(
      (numero) => telefoneComparavel(numero) && telefoneComparavel(numero) === telefoneComparavel(telefoneConversa),
    );

    if (ehEncaminhador && !processamentoLiberado) {
      console.log('MENSAGEM DE ENCAMINHADOR AGUARDANDO GATILHO:', { telefoneConversa, chaveMensagem });
      return res.status(200).send('EVENT_RECEIVED');
    }

    const resultado = await interpretarEGravar({
      textoMensagem,
      telefoneConversa,
      nomeCliente,
    });

    if (ACCESS_TOKEN && phoneNumberId && remetente) {
      await enviarWhatsApp(phoneNumberId, remetente, 'Olá! Recebemos sua mensagem com sucesso. ✅');
    }

    return res.status(200).json({
      ok: true,
      processamentoConcluido: true,
      interpretacaoCompleta: resultado.completa,
      quantidadeEncomendasCriadas: resultado.criadas.length,
      encomendasCriadas: resultado.criadas,
      pendencias: resultado.pendencias,
    });
  } catch (erro) {
    console.error('Erro no webhook:', erro);
    return res.status(200).json({
      ok: false,
      processamentoConcluido: false,
      interpretacaoCompleta: false,
      quantidadeEncomendasCriadas: 0,
      pendencias: [{ texto: String(erro?.message || erro), motivo: 'erro_interno' }],
    });
  }
}

/**
 * Log de auditoria temporário: mostra, por bloco/data, o que foi lido, o que
 * foi reconhecido e o que ficou pendente — sem expor tokens nem segredos.
 * Serve para conferir rapidamente, pelos logs do Cloud Run, por que um
 * produto foi ou não lançado em produtos[].
 */
function logValidacaoBloco(bloco) {
  const linhasRecebidas = [
    ...bloco.produtos.map((p) => (p.observacao ? `${p.produtoNome} (${p.observacao})` : p.produtoNome)),
    ...bloco.pendencias.map((p) => p.texto),
  ];
  console.log(
    [
      'VALIDAÇÃO BLOCO WHATSAPP',
      `data: ${bloco.data}`,
      `hora: ${bloco.hora || '(não identificada)'}`,
      `linhasRecebidas: ${JSON.stringify(linhasRecebidas)}`,
      `produtosReconhecidos: ${bloco.produtos.map((p) => `${p.produtoNome} | ${p.quantidade}`).join(', ') || '(nenhum)'}`,
      `linhasNaoReconhecidas: ${JSON.stringify(bloco.pendencias.map((p) => p.texto))}`,
      `quantidadeTotal: ${somarQuantidades(bloco.produtos)}`,
      `processamentoCompleto: ${bloco.valido}`,
    ].join('\n'),
  );
}

// ─── Interpretação e gravação ───────────────────────────────────────────────

async function interpretarEGravar({ textoMensagem, telefoneConversa, nomeCliente }) {
  const vazio = { completa: false, criadas: [], pendencias: [] };
  const textoNormalizado = normalizarTexto(textoMensagem).trim();
  if (!textoNormalizado) return vazio;

  const { indice } = await lerCatalogo();
  const conversaRef = db.ref(`${PATH_WA}/conversas/${telefoneConversa}`);
  const conversa = (await conversaRef.once('value')).val() || {};

  const hoje = hojeEmSaoPaulo();
  const interpretacao = interpretarMensagem(textoMensagem, indice, { hoje });

  // ── Pedido com datas explícitas: um bloco por data ────────────────────────
  if (ehPedidoNovo(textoNormalizado, interpretacao.blocos.length)) {
    interpretacao.blocos.forEach(logValidacaoBloco);

    if (!interpretacao.completa) {
      // Tudo ou nada: um pedido grande não pode ser gravado pela metade e
      // parecer concluído. Nada é gravado e as pendências são devolvidas.
      console.log('PEDIDO NÃO GRAVADO — INTERPRETAÇÃO INCOMPLETA:', interpretacao.pendencias);
      return { completa: false, criadas: [], pendencias: interpretacao.pendencias };
    }

    const encomendas = interpretacao.blocos
      .flatMap(agruparPorHorario)
      .map((grupo) =>
        montarEncomenda({
          ...grupo,
          conversa,
          nomeCliente,
          telefone: telefoneConversa,
        }),
      );

    const { criadas, falhas } = await gravarEncomendasVerificando(encomendas);

    if (falhas.length) {
      // Uma falha no meio do lote desfaz o que já entrou, para não deixar o
      // pedido metade lançado.
      await desfazerEncomendas(criadas);
      return {
        completa: false,
        criadas: [],
        pendencias: falhas.map((f) => ({ texto: `Falha ao gravar ${f.data}`, motivo: f.motivo })),
      };
    }

    await conversaRef.update({
      ultimaEncomendaId: criadas.length === 1 ? criadas[0] : 'multiplas-encomendas',
      pedidoEmAndamento: null,
    });

    console.log('ENCOMENDAS CRIADAS:', criadas);
    return { completa: true, criadas, pendencias: [] };
  }

  // ── Mensagem de conversa: adicionar, cancelar ou alterar ──────────────────
  return tratarConversa({
    textoNormalizado,
    indice,
    conversa,
    conversaRef,
    nomeCliente,
    telefoneConversa,
    hoje,
  });
}

/**
 * Mensagens curtas do dia a dia, sem data explícita:
 * "Adiciona 5 pão de doce na minha encomenda de amanhã", "Cancela o pão de
 * doce", "Muda o horário para 16h".
 */
async function tratarConversa({
  textoNormalizado, indice, conversa, conversaRef, nomeCliente, telefoneConversa, hoje,
}) {
  const produtosDetectados = detectarProdutos(textoNormalizado, indice);
  // Regra 1: um produto conhecido citado sem número válido ("adiciona pão de
  // sal") não pode virar quantidade: 0 na encomenda. Só entram aqui os que
  // têm uma quantidade numérica finita e maior que zero.
  const produtosComQuantidadeValida = produtosDetectados.filter((p) => quantidadeValida(p?.quantidade));
  const produtosSemQuantidade = produtosDetectados.filter((p) => !quantidadeValida(p?.quantidade));

  const querAlterar = contem('alterar', textoNormalizado);
  const querCancelar = contem('cancelar', textoNormalizado);
  const querAdicionar = contem('adicionar', textoNormalizado);
  const alterandoHorario = querAlterar && temIndicacaoDeHorario(textoNormalizado);

  let data = '';
  if (contem('hoje', textoNormalizado)) data = hoje;
  if (contem('amanha', textoNormalizado)) {
    const amanha = new Date(`${hoje}T12:00:00Z`);
    amanha.setUTCDate(amanha.getUTCDate() + 1);
    data = amanha.toISOString().slice(0, 10);
  }

  const hora = interpretarHorario(textoNormalizado);

  const pedidoEmAndamento = {
    produtos: produtosDetectados.map(normalizarProdutoEncomenda),
    data,
    hora,
    atualizadoEm: new Date().toISOString(),
  };
  await conversaRef.update({ pedidoEmAndamento });

  const precisaDeEncomenda = querAlterar || querCancelar || querAdicionar;
  if (!precisaDeEncomenda) {
    return { completa: false, criadas: [], pendencias: [] };
  }

  // Uma única leitura da coleção atende a todos os casos abaixo.
  const encomendas = (await db.ref(PATH_ENCOMENDAS).once('value')).val() || {};
  const busca = {
    telefone: telefoneConversa,
    clienteNome: conversa?.clienteNome || conversa?.nome || nomeCliente,
    data,
  };

  if (alterandoHorario && !querCancelar) {
    // Ao mudar o horário não se filtra pelo horário antigo.
    const { id, encomenda } = localizarEncomenda(encomendas, busca);
    if (id && hora) {
      await db.ref(`${PATH_ENCOMENDAS}/${id}`).update({
        hora,
        atualizadoEm: new Date().toISOString(),
        origemUltimaAlteracao: 'whatsapp',
      });
      console.log('HORÁRIO ALTERADO:', { id, de: encomenda.hora, para: hora });
      return { completa: true, criadas: [], pendencias: [] };
    }
    return { completa: false, criadas: [], pendencias: [] };
  }

  if (querCancelar) {
    // Cancelar não depende de quantidade: só precisa identificar o produto.
    return cancelar({ encomendas, busca, hora, produtosDetectados, textoNormalizado });
  }

  if (querAlterar && produtosComQuantidadeValida.length) {
    return alterarQuantidade({ encomendas, busca, hora, produtosDetectados: produtosComQuantidadeValida });
  }

  if (querAdicionar && produtosComQuantidadeValida.length) {
    return adicionar({ encomendas, busca, hora, produtosDetectados: produtosComQuantidadeValida });
  }

  // Produto conhecido citado sem uma quantidade válida ("adiciona pão de
  // sal", "muda o pão de doce"): nunca grava quantidade 0 nem ignora em
  // silêncio — fica sinalizado como pendência.
  if ((querAlterar || querAdicionar) && produtosSemQuantidade.length) {
    const pendencias = produtosSemQuantidade.map((p) => ({
      texto: p.produtoNome,
      motivo: 'quantidade_nao_reconhecida',
      produtoNome: p.produtoNome,
    }));
    console.log('CONVERSA COM PRODUTO SEM QUANTIDADE VÁLIDA — NADA GRAVADO:', pendencias);
    return { completa: false, criadas: [], pendencias };
  }

  return { completa: false, criadas: [], pendencias: [] };
}

async function cancelar({ encomendas, busca, hora, produtosDetectados, textoNormalizado }) {
  const alvo = produtosDetectados[0] ? nomeDoProduto(produtosDetectados[0]) : '';

  if (!alvo) {
    // Sem produto citado, cancela a encomenda inteira.
    const { id } = localizarEncomenda(encomendas, {
      ...busca,
      hora,
      filtro: (e) => listaDeProdutos(e).length > 0,
    });
    if (id) {
      await db.ref(`${PATH_ENCOMENDAS}/${id}`).remove();
      console.log('ENCOMENDA CANCELADA:', id);
      return { completa: true, criadas: [], pendencias: [] };
    }
    return { completa: false, criadas: [], pendencias: [] };
  }

  const { id, encomenda } = localizarEncomenda(encomendas, {
    ...busca,
    hora,
    filtro: (e) => listaDeProdutos(e).some((p) => nomeDoProduto(p) === alvo),
  });
  if (!id) return { completa: false, criadas: [], pendencias: [] };

  const restantes = listaDeProdutos(encomenda).filter((p) => nomeDoProduto(p) !== alvo);

  if (restantes.length === 0) {
    await db.ref(`${PATH_ENCOMENDAS}/${id}`).remove();
  } else {
    await db.ref(`${PATH_ENCOMENDAS}/${id}`).update({
      produtos: restantes,
      quantidadeTotal: somarQuantidades(restantes),
      atualizadoEm: new Date().toISOString(),
      origemUltimaAlteracao: 'whatsapp',
    });
  }

  console.log('PRODUTO CANCELADO DA ENCOMENDA:', { id, alvo });
  return { completa: true, criadas: [], pendencias: [] };
}

async function alterarQuantidade({ encomendas, busca, hora, produtosDetectados }) {
  const novo = produtosDetectados[0];
  const alvo = nomeDoProduto(novo);
  const quantidade = Number(novo?.quantidade) || 0;
  if (!alvo || quantidade <= 0) return { completa: false, criadas: [], pendencias: [] };

  const { id, encomenda } = localizarEncomenda(encomendas, {
    ...busca,
    hora,
    filtro: (e) => listaDeProdutos(e).some((p) => nomeDoProduto(p) === alvo),
  });
  if (!id) return { completa: false, criadas: [], pendencias: [] };

  const produtos = listaDeProdutos(encomenda).map((produto) =>
    nomeDoProduto(produto) === alvo ? { ...produto, quantidade } : produto,
  );

  await db.ref(`${PATH_ENCOMENDAS}/${id}`).update({
    produtos,
    quantidadeTotal: somarQuantidades(produtos),
    atualizadoEm: new Date().toISOString(),
    origemUltimaAlteracao: 'whatsapp',
  });

  console.log('QUANTIDADE ALTERADA:', { id, alvo, quantidade });
  return { completa: true, criadas: [], pendencias: [] };
}

async function adicionar({ encomendas, busca, hora, produtosDetectados }) {
  const { id, encomenda } = localizarEncomenda(encomendas, { ...busca, hora });
  if (!id) {
    console.log('NENHUMA ENCOMENDA COMPATÍVEL PARA ADICIONAR.');
    return { completa: false, criadas: [], pendencias: [] };
  }

  const produtos = mesclarProdutos(
    listaDeProdutos(encomenda),
    produtosDetectados.map(normalizarProdutoEncomenda),
  );

  await db.ref(`${PATH_ENCOMENDAS}/${id}`).update({
    produtos,
    quantidadeTotal: somarQuantidades(produtos),
    atualizadoEm: new Date().toISOString(),
    origemUltimaAlteracao: 'whatsapp',
  });

  console.log('ENCOMENDA ATUALIZADA:', { id, produtos });
  return { completa: true, criadas: [], pendencias: [] };
}
