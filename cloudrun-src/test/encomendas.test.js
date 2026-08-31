import test from 'node:test';
import assert from 'node:assert/strict';

import {
  listaDeProdutos,
  localizarEncomenda,
  mesclarProdutos,
  normalizarProdutoEncomenda,
  somarQuantidades,
} from '../encomendas.js';

const ENCOMENDAS = {
  a: {
    clienteTelefone: '553184785315',
    clienteNome: 'Escola Alfa',
    data: '2026-09-03',
    hora: '11:00',
    produtos: [{ produtoNome: 'Pão de sal', quantidade: 650 }],
  },
  b: {
    clienteTelefone: '553184785315',
    clienteNome: 'Escola Alfa',
    data: '2026-09-03',
    hora: '06:00',
    produtos: [{ produtoNome: 'Mussarela', quantidade: 2 }],
  },
  c: {
    clienteTelefone: '553171592009',
    clienteNome: 'Outro Cliente',
    data: '2026-09-03',
    hora: '11:00',
    produtos: [{ produtoNome: 'Pão de doce', quantidade: 10 }],
  },
};

test('encontra a encomenda pelo telefone, ignorando campos não informados', () => {
  const { id } = localizarEncomenda(ENCOMENDAS, { telefone: '553184785315', data: '2026-09-03' });
  assert.equal(id, 'a');
});

test('o horário informado restringe a busca', () => {
  const { id } = localizarEncomenda(ENCOMENDAS, {
    telefone: '553184785315',
    data: '2026-09-03',
    hora: '06:00',
  });
  assert.equal(id, 'b');
});

test('não devolve encomenda de outro cliente', () => {
  const { id } = localizarEncomenda(ENCOMENDAS, { telefone: '553199999999' });
  assert.equal(id, null);
});

test('o filtro permite escolher pela presença de um produto', () => {
  const { id } = localizarEncomenda(ENCOMENDAS, {
    telefone: '553184785315',
    filtro: (e) => listaDeProdutos(e).some((p) => p.produtoNome === 'Mussarela'),
  });
  assert.equal(id, 'b');
});

test('aceita produtos gravados como objeto pelo Firebase', () => {
  const produtos = listaDeProdutos({ produtos: { 0: { quantidade: 3 }, 1: { quantidade: 4 } } });
  assert.equal(produtos.length, 2);
  assert.equal(somarQuantidades(produtos), 7);
});

test('mesclar soma a quantidade de um produto que já existe', () => {
  const resultado = mesclarProdutos(
    [{ produtoNome: 'Pão de sal', quantidade: 10, pesoTotalKg: 0 }],
    [{ produtoNome: 'pão de sal', quantidade: 5 }, { produtoNome: 'Manteiga', quantidade: 2 }],
  );

  assert.equal(resultado.length, 2);
  assert.equal(resultado.find((p) => p.produtoNome === 'Pão de sal').quantidade, 15);
  assert.equal(resultado.find((p) => p.produtoNome === 'Manteiga').quantidade, 2);
});

test('calcula o peso total a partir do peso por unidade', () => {
  const produto = normalizarProdutoEncomenda({
    produtoNome: 'Mussarela',
    quantidade: 2,
    pesoPorUnidadeKg: 1,
  });
  assert.equal(produto.pesoTotalKg, 2);
});
