/**
 * Mostra como o parser interpreta uma mensagem, para conferência manual.
 * Uso: node test/demo.js
 */
import { readFileSync } from 'node:fs';
import { agruparPorHorario, construirIndiceProdutos, interpretarMensagem } from '../parser.js';

const produtos = JSON.parse(readFileSync(new URL('./produtos.json', import.meta.url)));
const aliases = JSON.parse(readFileSync(new URL('./aliases.json', import.meta.url)));
const indice = construirIndiceProdutos(produtos, aliases);

const MENSAGENS = {
  'Pedido de setembro (turnos por extenso)': `Bom dia! Pedidos para o *mês de setembro*

 *03/09 - tarde*
650 - pães franceses
2 - queijos
(ENTREGAR O QUEIJO NA PARTE DA MANHÃ)

 *10/09 - tarde*
650 - pães franceses

 *11/09 - manhã*
520 - pães franceses
5 - manteigas

 *29/09 - tarde*
650 - pães franceses
2 mussarelas
(ENTREGAR AS MUSSARELAS NA PARTE DA MANHÃ)

 *01/10 - manhã*
520 - pães franceses
5 manteigas`,

  'Pedido da semana (formato livre)': `Bom dia
Segue os pedidos da semana:

Segunda feira
Dia 31/08
Às 6:30
350 pão de doce
9 manteigas (7 para cozinha e 2 na direção)
Deixar na direção:
7 pacotes de café extra forte
3 chá matte
2 barras de mussarela

Terça feira
Dia 01/09
Para a 12:00
50 pao de sal`,
};

for (const [titulo, texto] of Object.entries(MENSAGENS)) {
  console.log('\n' + '='.repeat(72));
  console.log(titulo);
  console.log('='.repeat(72));

  const { blocos, pendencias, completa } = interpretarMensagem(texto, indice, { hoje: '2026-08-31' });

  for (const bloco of blocos) {
    for (const encomenda of agruparPorHorario(bloco)) {
      const total = encomenda.produtos.reduce((s, p) => s + p.quantidade, 0);
      console.log(`\n  ${encomenda.data} ${encomenda.hora}  (total ${total})`);
      for (const p of encomenda.produtos) {
        const obs = p.observacao ? `  // ${p.observacao}` : '';
        console.log(`      ${String(p.quantidade).padStart(5)} x ${p.produtoNome.trim()}${obs}`);
      }
      if (encomenda.observacao) console.log(`      obs: ${encomenda.observacao}`);
    }
    if (!bloco.produtos.length) console.log(`\n  ${bloco.data} ${bloco.hora}  — SEM PRODUTOS (não vira encomenda)`);
  }

  if (pendencias.length) {
    console.log('\n  PENDÊNCIAS (mensagem não pode ser marcada como sucesso):');
    for (const p of pendencias) console.log(`      [${p.motivo}] ${p.texto}`);
  }
  console.log(`\n  => mensagem completa? ${completa ? 'SIM' : 'NÃO'}`);
}
