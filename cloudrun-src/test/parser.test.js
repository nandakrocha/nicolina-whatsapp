import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  agruparPorHorario,
  construirIndiceProdutos,
  ehPedidoNovo,
  extrairQuantidade,
  interpretarHorario,
  interpretarMensagem,
  montarData,
  normalizarTexto,
  quantidadeValida,
  singularizar,
} from '../parser.js';

const produtos = JSON.parse(readFileSync(new URL('./produtos.json', import.meta.url)));
const aliases = JSON.parse(readFileSync(new URL('./aliases.json', import.meta.url)));
const indice = construirIndiceProdutos(produtos, aliases);

const HOJE = '2026-08-31';
const interpretar = (texto) => interpretarMensagem(texto, indice, { hoje: HOJE });

// Mensagem real que o cliente enviou e que o sistema processou errado.
const PEDIDO_SETEMBRO = `Bom dia! Pedidos para o *mês de setembro*

 *03/09 - tarde*
650 - pães franceses
2 - queijos
(ENTREGAR O QUEIJO NA PARTE DA MANHÃ)


 *10/09 - tarde*
650 - pães franceses

 *11/09 - manhã*
520 - pães franceses
5 - manteigas

 *14/09 - manhã*
520 - pães franceses
5 - manteigas

 *15/09 - manhã*
2 - mussarelas

 *23/09 - manhã*
520 - pães franceses
05 - manteigas

 *24/09 - manhã*
2 - mussarelas

 *29/09 - tarde*
650 - pães franceses
2 mussarelas
(ENTREGAR AS MUSSARELAS NA PARTE DA MANHÃ)

 *01/10 - manhã*
520 - pães franceses
5 manteigas`;

// ─── Singular/plural ────────────────────────────────────────────────────────

test('singulariza plurais do português usados na padaria', () => {
  assert.equal(singularizar('paes'), 'pao');
  assert.equal(singularizar('franceses'), 'frances');
  assert.equal(singularizar('manteigas'), 'manteiga');
  assert.equal(singularizar('mussarelas'), 'mussarela');
  assert.equal(singularizar('queijos'), 'queijo');
  assert.equal(singularizar('sal'), 'sal');
  assert.equal(singularizar('pao'), 'pao');
});

// ─── Quantidade ─────────────────────────────────────────────────────────────

test('extrai quantidade mesmo com separador entre número e produto', () => {
  assert.equal(extrairQuantidade('650 -').quantidade, 650);
  assert.equal(extrairQuantidade('650 –').quantidade, 650);
  assert.equal(extrairQuantidade('05 -').quantidade, 5);
  assert.equal(extrairQuantidade('2').quantidade, 2);
  assert.equal(extrairQuantidade('9').quantidade, 9);
  assert.equal(extrairQuantidade('7 pacotes de').quantidade, 7);
});

test('converte peso em quilos', () => {
  assert.deepEqual(extrairQuantidade('500 g de'), { quantidade: 0.5, unidade: 'gramas' });
  assert.deepEqual(extrairQuantidade('2 kg'), { quantidade: 2, unidade: 'kg' });
});

test('quantidadeValida rejeita zero, negativos e valores inválidos (Regra 1)', () => {
  for (const invalido of [0, '0', null, undefined, NaN, '', 'abc', -5, '-3']) {
    assert.equal(quantidadeValida(invalido), false, `deveria rejeitar ${JSON.stringify(invalido)}`);
  }
  for (const valido of [1, 520, '520', 0.5, '5']) {
    assert.equal(quantidadeValida(valido), true, `deveria aceitar ${JSON.stringify(valido)}`);
  }
});

// ─── Horários ───────────────────────────────────────────────────────────────

test('aceita as variações de escrita de horário e despreza os minutos', () => {
  for (const entrada of ['11:00', '11h00', '11h', '11;00', '11,00', '11.00', 'às 11', 'as 11', '11 horas']) {
    assert.equal(interpretarHorario(entrada), '11:00', `falhou para ${entrada}`);
  }
  assert.equal(interpretarHorario('6:30'), '06:00');
  assert.equal(interpretarHorario('Às 06:30'), '06:00');
});

test('traduz turnos escritos por extenso', () => {
  for (const entrada of ['manhã', 'manha', 'pela manhã', 'parte da manhã', 'de manhã']) {
    assert.equal(interpretarHorario(entrada), '06:00', `falhou para ${entrada}`);
  }
  for (const entrada of ['tarde', 'à tarde', 'a tarde', 'pela tarde', 'parte da tarde']) {
    assert.equal(interpretarHorario(entrada), '11:00', `falhou para ${entrada}`);
  }
});

test('não confunde a data com um horário', () => {
  assert.equal(interpretarHorario('03/09 - tarde'), '11:00');
  assert.equal(interpretarHorario('11/09 - manhã'), '06:00');
});

// ─── Datas ──────────────────────────────────────────────────────────────────

test('monta a data e vira o ano quando o mês já passou', () => {
  assert.equal(montarData(3, 9, '', '2026-08-31'), '2026-09-03');
  assert.equal(montarData(3, 9, '26', '2026-08-31'), '2026-09-03');
  assert.equal(montarData(5, 1, '', '2026-12-20'), '2027-01-05');
});

// ─── Mensagem completa ──────────────────────────────────────────────────────

test('interpreta o pedido de setembro inteiro, com turnos por extenso', () => {
  const { blocos, pendencias, completa } = interpretar(PEDIDO_SETEMBRO);

  assert.equal(blocos.length, 9, 'deve encontrar as 9 datas');
  assert.deepEqual(pendencias, [], 'não deve sobrar nada sem reconhecer');
  assert.ok(completa, 'a mensagem deve ser considerada completa');

  const porData = Object.fromEntries(blocos.map((b) => [b.data, b]));

  // Turno por extenso vira horário.
  assert.equal(porData['2026-09-03'].hora, '11:00');
  assert.equal(porData['2026-09-11'].hora, '06:00');
  assert.equal(porData['2026-10-01'].hora, '06:00');

  // Produto conhecido entra em produtos[] com a quantidade correta.
  const bloco03 = porData['2026-09-03'];
  const pao = bloco03.produtos.find((p) => p.produtoNome.trim() === 'Pão de sal');
  assert.equal(pao.quantidade, 650, '"650 - pães franceses" deve virar quantidade 650');

  const queijo = bloco03.produtos.find((p) => p.produtoNome === 'Mussarela');
  assert.equal(queijo.quantidade, 2, '"2 - queijos" deve virar quantidade 2');

  // Nenhum bloco pode ficar sem produto.
  for (const bloco of blocos) {
    assert.ok(bloco.produtos.length > 0, `bloco ${bloco.data} ficou sem produto`);
    assert.ok(bloco.valido, `bloco ${bloco.data} deveria ser válido`);
    for (const produto of bloco.produtos) {
      assert.ok(produto.quantidade > 0, `${bloco.data}: ${produto.produtoNome} sem quantidade`);
    }
  }

  // "05 - manteigas" com zero à esquerda.
  const manteiga23 = porData['2026-09-23'].produtos.find((p) => p.produtoNome === 'Manteiga');
  assert.equal(manteiga23.quantidade, 5);
});

test('separa o horário de um produto específico quando há exceção', () => {
  const { blocos } = interpretar(PEDIDO_SETEMBRO);
  const porData = Object.fromEntries(blocos.map((b) => [b.data, b]));

  // 03/09 é "tarde", mas o queijo deve ser entregue de manhã.
  const encomendas03 = agruparPorHorario(porData['2026-09-03']);
  assert.equal(encomendas03.length, 2, 'deve gerar duas encomendas em 03/09');

  const manha = encomendas03.find((e) => e.hora === '06:00');
  const tarde = encomendas03.find((e) => e.hora === '11:00');
  assert.deepEqual(manha.produtos.map((p) => p.produtoNome), ['Mussarela']);
  assert.deepEqual(tarde.produtos.map((p) => p.produtoNome.trim()), ['Pão de sal']);

  // 29/09 tem a mesma exceção, com a mussarela.
  const encomendas29 = agruparPorHorario(porData['2026-09-29']);
  assert.equal(encomendas29.length, 2, 'deve gerar duas encomendas em 29/09');
  assert.equal(encomendas29.find((e) => e.hora === '06:00').produtos[0].produtoNome, 'Mussarela');
});

// ─── Regras de integridade ──────────────────────────────────────────────────

test('produto desconhecido vira pendência e não é descartado', () => {
  const { blocos, pendencias, completa } = interpretar('03/09 - tarde\n20 bisnaguinhas\n50 pães franceses');

  assert.equal(pendencias.length, 1);
  assert.match(pendencias[0].texto, /bisnaguinhas/);
  assert.equal(pendencias[0].motivo, 'produto_nao_reconhecido');
  assert.equal(completa, false, 'mensagem com pendência não pode ser sucesso');
  assert.equal(blocos[0].valido, false);

  // O produto conhecido continua sendo reconhecido normalmente.
  assert.equal(blocos[0].produtos[0].quantidade, 50);
});

test('bloco só com observação não vira encomenda', () => {
  const { blocos, completa } = interpretar('03/09 - 11:00\nobrigado pela atenção');

  assert.deepEqual(blocos[0].produtos, []);
  assert.equal(blocos[0].valido, false, 'observação não pode validar um bloco vazio');
  assert.equal(completa, false);
});

test('produto conhecido sem quantidade vira pendência, não observação', () => {
  const { blocos, pendencias } = interpretar('03/09 - 11:00\npães franceses');

  assert.equal(blocos[0].produtos.length, 0);
  assert.equal(pendencias.length, 1);
  assert.equal(pendencias[0].motivo, 'quantidade_nao_reconhecida');
});

test('distingue pedido novo de alteração de encomenda existente', () => {
  const decidir = (texto) => {
    const { blocos } = interpretar(texto);
    return ehPedidoNovo(normalizarTexto(texto), blocos.length);
  };

  assert.equal(decidir('03/09 - tarde\n650 - pães franceses'), true);
  assert.equal(decidir(PEDIDO_SETEMBRO), true);

  // Com verbo de alteração e uma única data, é mexer numa encomenda que existe.
  assert.equal(decidir('Adicione 5 pães franceses na encomenda de 03/09'), false);
  assert.equal(decidir('Cancela o pão de doce de 03/09'), false);
  assert.equal(decidir('Muda o horário da encomenda de 03/09 para 16h'), false);

  // "mais" é ambíguo demais para desviar um pedido novo.
  assert.equal(decidir('03/09 - tarde\n650 - pães franceses e mais 2 queijos'), true);
});

test('reconhece o pedido escrito antes da data, na mesma linha', () => {
  const { blocos } = interpretar(
    'Vamos precisar de 1 tabuleiro de broa para quarta-feira às 14:00 ( 02/09).',
  );
  assert.equal(blocos.length, 1);
  assert.equal(blocos[0].produtos.length, 1);
  assert.equal(blocos[0].produtos[0].quantidade, 1);
  assert.match(blocos[0].produtos[0].produtoNome, /broa/i);
  assert.equal(blocos[0].hora, '14:00');
  // A data e a hora já são colunas próprias; repeti-las na observação polui.
  assert.doesNotMatch(blocos[0].produtos[0].observacao, /02\/09|14:00/);
});

test('palavra entre a quantidade e o produto não derruba o item', () => {
  const { blocos } = interpretar('31/08 - 6:00\n1 kg  Gr de Toddy');
  assert.equal(blocos[0].produtos.length, 1);
  assert.equal(blocos[0].produtos[0].quantidade, 1);
  assert.match(blocos[0].produtos[0].produtoNome, /toddy/i);
  assert.equal(blocos[0].pendencias.length, 0);
});

test('duas datas na mesma linha não se misturam', () => {
  const { blocos } = interpretar('03/09 - 11:00 e 04/09 - 11:00\n50 pães franceses');
  assert.equal(blocos.length, 2);
  assert.equal(blocos[0].data, '2026-09-03');
  assert.equal(blocos[1].data, '2026-09-04');
});

test('observação livre é preservada junto do bloco', () => {
  const { blocos } = interpretar('03/09 - 11:00\n50 pães franceses\ndeixar na portaria');
  assert.match(blocos[0].observacao, /deixar na portaria/);
  assert.equal(blocos[0].produtos.length, 1);
  assert.equal(blocos[0].valido, true);
});
