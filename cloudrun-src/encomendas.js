/**
 * Operações sobre encomendas já existentes (adicionar, cancelar, alterar).
 *
 * O código anterior relia a coleção inteira de encomendas uma vez para cada
 * tipo de alteração. Aqui a leitura é feita no máximo uma vez por mensagem e
 * reaproveitada, que é o que resolve a lentidão nos pedidos grandes.
 */

import { normalizarTexto } from './parser.js';

const somenteNumeros = (valor) => String(valor || '').replace(/\D/g, '');
const comparavel = (valor) => normalizarTexto(valor).trim();

/**
 * Procura a encomenda do cliente compatível com a data e a hora informadas.
 * Campos ausentes na mensagem não restringem a busca.
 */
export function localizarEncomenda(encomendas, { telefone, clienteNome, data, hora, filtro }) {
  const telefoneAlvo = somenteNumeros(telefone);
  const clienteAlvo = comparavel(clienteNome);
  const dataAlvo = String(data || '').trim();
  const horaAlvo = String(hora || '').trim();

  for (const [id, encomenda] of Object.entries(encomendas || {})) {
    if (!encomenda) continue;

    const telefoneEncomenda = somenteNumeros(encomenda.clienteTelefone || encomenda.telefone);
    const clienteEncomenda = comparavel(
      encomenda.clienteNome || encomenda.cliente || encomenda.nomeCliente,
    );
    const dataEncomenda = String(encomenda.data || encomenda.dataEntrega || '').trim();
    const horaEncomenda = String(encomenda.hora || encomenda.horario || encomenda.horaEntrega || '').trim();

    const mesmoCliente =
      (telefoneAlvo && telefoneEncomenda && telefoneAlvo === telefoneEncomenda) ||
      (clienteAlvo && clienteEncomenda && clienteAlvo === clienteEncomenda);
    if (!mesmoCliente) continue;

    if (dataAlvo && dataEncomenda && dataAlvo !== dataEncomenda) continue;
    if (horaAlvo && horaEncomenda && horaAlvo !== horaEncomenda) continue;
    if (filtro && !filtro(encomenda)) continue;

    return { id, encomenda };
  }

  return { id: null, encomenda: null };
}

export function listaDeProdutos(encomenda) {
  const produtos = encomenda?.produtos;
  if (Array.isArray(produtos)) return [...produtos];
  if (produtos && typeof produtos === 'object') return Object.values(produtos);
  return [];
}

export function somarQuantidades(produtos) {
  return produtos.reduce((total, produto) => total + (Number(produto?.quantidade) || 0), 0);
}

export function nomeDoProduto(produto) {
  return comparavel(produto?.produtoNome || produto?.produto || produto?.nome);
}

/** Soma os produtos novos aos que já estavam na encomenda. */
export function mesclarProdutos(existentes, novos) {
  const resultado = [...existentes];

  for (const novo of novos) {
    if (!novo) continue;
    const nomeNovo = nomeDoProduto(novo);
    if (!nomeNovo) continue;

    const jaExiste = resultado.find((produto) => nomeDoProduto(produto) === nomeNovo);
    if (jaExiste) {
      jaExiste.quantidade = (Number(jaExiste.quantidade) || 0) + (Number(novo.quantidade) || 0);
      jaExiste.pesoTotalKg = (Number(jaExiste.pesoTotalKg) || 0) + (Number(novo.pesoTotalKg) || 0);
      if (!jaExiste.produtoId && novo.produtoId) jaExiste.produtoId = novo.produtoId;
      if (!jaExiste.produtoNome) jaExiste.produtoNome = novo.produtoNome || '';
      if (jaExiste.observacao === undefined) jaExiste.observacao = '';
      if (jaExiste.pesoPorUnidadeKg === undefined) jaExiste.pesoPorUnidadeKg = 0;
      if (jaExiste.pesoTotalKg === undefined) jaExiste.pesoTotalKg = 0;
    } else {
      resultado.push(normalizarProdutoEncomenda(novo));
    }
  }

  return resultado;
}

/** Formato final gravado em nicolina/encomendas/{id}/produtos. */
export function normalizarProdutoEncomenda(produto) {
  const quantidade = Number(produto?.quantidade) || 0;
  const pesoPorUnidadeKg = Number(produto?.pesoPorUnidadeKg) || 0;
  return {
    observacao: produto?.observacao || '',
    pesoPorUnidadeKg,
    pesoTotalKg: Number(produto?.pesoTotalKg) || Number((quantidade * pesoPorUnidadeKg).toFixed(3)),
    produtoId: produto?.produtoId || '',
    produtoNome: produto?.produtoNome || produto?.produto || produto?.nome || '',
    quantidade,
  };
}
