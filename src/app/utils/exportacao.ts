/**
 * ============================================
 * NICOLINA - UTILITÁRIOS DE EXPORTAÇÃO
 * ============================================
 * Funções padronizadas para impressão e exportação Excel
 * em todo o sistema.
 * 
 * Versão: 2.0.0 - CORREÇÃO GLOBAL DE IMPRESSÃO
 * Data: 31/03/2026
 * 
 * 🔧 CORREÇÕES v2.0.0:
 * - CSS inline que sobrescreve print.css problemático
 * - Verificação de dados antes da impressão
 * - Ordem padronizada: cliente, produto, quantidade, observação
 * - Layout A4 profissional
 * - Eliminação de páginas em branco
 */

import * as XLSX from "xlsx";
import { toast } from "sonner";

/**
 * Configuração padrão de impressão para todas as telas
 * - Remove elementos de interface (botões, filtros, menu)
 * - Mantém apenas tabelas e conteúdo relevante
 * - Layout otimizado para papel A4
 */
export const estiloImpressaoPadrao = `
  @media print {
    /* Ocultar elementos de interface */
    .no-print {
      display: none !important;
    }
    
    /* Mostrar apenas conteúdo de impressão */
    .print-only {
      display: block !important;
    }
    
    /* Configurações gerais de página */
    body {
      background: white !important;
      color: black !important;
      font-size: 10pt;
      margin: 0;
      padding: 10mm;
    }
    
    /* Configurações de tabela */
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      font-size: 9pt;
    }
    
    /* Evitar quebra dentro de linhas */
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    /* Cabeçalhos de tabela */
    thead {
      display: table-header-group;
      font-weight: bold;
    }
    
    /* Células de tabela */
    th, td {
      border: 1px solid #333 !important;
      padding: 4px 8px !important;
      text-align: left;
    }
    
    /* Títulos */
    h1, h2, h3 {
      color: #084d6e !important;
      margin: 10px 0;
    }
    
    /* Remover sombras e bordas arredondadas */
    * {
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    
    /* Configuração de página */
    @page {
      size: A4;
      margin: 10mm;
    }
  }
  
  /* Ocultar elementos print-only na tela */
  @media screen {
    .print-only {
      display: none;
    }
  }
`;

/**
 * Interface para dados de exportação Excel
 */
export interface DadosExportacao {
  nomeArquivo: string;
  nomePlanilha: string;
  dados: any[];
  colunas?: { header: string; key: string; width?: number }[];
}

/**
 * Exporta dados para Excel com formatação padrão
 * @param config - Configurações de exportação
 */
export function exportarParaExcel(config: DadosExportacao): void {
  try {
    const { nomeArquivo, nomePlanilha, dados, colunas } = config;

    if (!dados || dados.length === 0) {
      toast.warning("Não há dados para exportar");
      return;
    }

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dados);

    // Aplicar largura das colunas se fornecidas
    if (colunas) {
      const wscols = colunas.map(col => ({ wch: col.width || 15 }));
      ws['!cols'] = wscols;
    }

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);

    // Gerar nome do arquivo com data
    const dataAtual = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    const nomeComData = `${nomeArquivo}_${dataAtual}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, nomeComData);

    toast.success("Arquivo Excel exportado com sucesso!");
  } catch (error) {
    console.error("Erro ao exportar Excel:", error);
    toast.error("Erro ao exportar arquivo Excel");
  }
}

/**
 * 🖨️ NOVA FUNÇÃO GLOBAL DE IMPRESSÃO v2.0.0
 * ============================================
 * Corrige o problema de páginas em branco sobrescrevendo
 * o CSS problemático do print.css global.
 * 
 * CARACTERÍSTICAS:
 * - Verifica se há dados antes de imprimir
 * - Cria um container temporário com ID único
 * - CSS inline que sobrescreve regras globais
 * - Layout A4 profissional
 * - Ordem padronizada das colunas
 * 
 * @param options - Configurações de impressão
 */
export interface OpcoesPrint {
  titulo: string;
  subtitulo?: string;
  dados: any[];
  colunas: { label: string; key: string; align?: 'left' | 'center' | 'right' }[];
  orientacao?: 'portrait' | 'landscape';
  mostrarTotais?: boolean;
  totaisExtras?: { label: string; valor: string | number }[];
}

export function imprimirDados(options: OpcoesPrint): void {
  console.log("🖨️ ========================================");
  console.log("🖨️ INICIANDO IMPRESSÃO v2.0.0");
  console.log("🖨️ Título:", options.titulo);
  console.log("🖨️ Total de registros:", options.dados?.length || 0);
  console.log("🖨️ Orientação:", options.orientacao || 'portrait');
  console.log("🖨️ ========================================");

  // ✅ VALIDAÇÃO: Verificar se há dados
  if (!options.dados || options.dados.length === 0) {
    console.error("❌ ERRO: Nenhum dado para imprimir");
    toast.error("Não há dados para imprimir");
    return;
  }

  try {
    // 🎨 CSS INLINE QUE SOBRESCREVE TUDO
    const cssImpressao = `
      <style>
        @media print {
          /* ========== FORÇAR VISIBILIDADE ========== */
          /* Sobrescreve o print.css problemático */
          body, body * {
            visibility: visible !important;
          }
          
          /* ========== OCULTAR TODA A INTERFACE ========== */
          body > *:not(#nicolina-print-container) {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* ========== MOSTRAR APENAS O CONTAINER DE IMPRESSÃO ========== */
          #nicolina-print-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          #nicolina-print-container * {
            visibility: visible !important;
          }
          
          /* ========== RESETAR BODY ========== */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          html {
            background: white !important;
          }
          
          /* ========== CONFIGURAÇÃO DA PÁGINA ========== */
          @page {
            size: A4 ${options.orientacao || 'portrait'};
            margin: 15mm 10mm;
          }
          
          /* ========== CONTEÚDO ========== */
          .print-content {
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
          }
          
          /* ========== CABEÇALHO ========== */
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #084d6e;
            padding-bottom: 15px;
          }
          
          .print-header h1 {
            margin: 0 0 5px 0;
            font-size: 22pt;
            color: #084d6e !important;
            font-weight: bold;
          }
          
          .print-header h2 {
            margin: 0 0 5px 0;
            font-size: 14pt;
            color: #333 !important;
          }
          
          .print-header .meta {
            font-size: 9pt;
            color: #666 !important;
            margin: 5px 0 0 0;
          }
          
          /* ========== TABELA ========== */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9pt;
          }
          
          .print-table thead {
            display: table-header-group;
          }
          
          .print-table thead tr {
            background-color: #084d6e !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print-table thead th {
            background-color: #084d6e !important;
            color: white !important;
            padding: 10px 8px !important;
            text-align: left;
            font-weight: bold;
            border: 1px solid #555 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .print-table tbody tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          
          .print-table tbody td {
            padding: 6px 8px !important;
            border: 1px solid #ccc !important;
            vertical-align: middle;
          }
          
          .print-table tbody tr:nth-child(odd) {
            background-color: white !important;
          }
          
          .print-table tbody tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* ========== ALINHAMENTOS ========== */
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          
          /* ========== RODAPÉ ========== */
          .print-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #084d6e;
            font-size: 9pt;
          }
          
          .print-footer .totais {
            display: flex;
            justify-content: space-around;
            margin-bottom: 10px;
          }
          
          .print-footer .totais-item {
            text-align: center;
          }
          
          .print-footer .totais-item strong {
            display: block;
            font-size: 11pt;
            color: #084d6e !important;
          }
          
          .print-footer .assinatura {
            text-align: center;
            font-size: 8pt;
            color: #666 !important;
            margin-top: 15px;
          }
        }
        
        @media screen {
          #nicolina-print-container {
            display: none !important;
          }
        }
      </style>
    `;

    // 📄 HTML DO CABEÇALHO
    const htmlCabecalho = `
      <div class="print-header">
        <h1>Nicolina - Gestão de Encomendas</h1>
        <h2>${options.titulo}</h2>
        ${options.subtitulo ? `<p class="meta">${options.subtitulo}</p>` : ''}
        <p class="meta">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    `;

    // 📊 HTML DA TABELA
    let htmlTabela = `<table class="print-table">`;
    
    // Cabeçalho da tabela
    htmlTabela += `<thead><tr>`;
    options.colunas.forEach(col => {
      const align = col.align || 'left';
      htmlTabela += `<th class="text-${align}">${col.label}</th>`;
    });
    htmlTabela += `</tr></thead>`;
    
    // Corpo da tabela
    htmlTabela += `<tbody>`;
    options.dados.forEach((item, index) => {
      htmlTabela += `<tr>`;
      options.colunas.forEach(col => {
        const align = col.align || 'left';
        const valor = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
        htmlTabela += `<td class="text-${align}">${valor}</td>`;
      });
      htmlTabela += `</tr>`;
    });
    htmlTabela += `</tbody></table>`;

    // 📈 RODAPÉ COM TOTAIS
    let htmlRodape = `<div class="print-footer">`;
    
    if (options.mostrarTotais && options.totaisExtras) {
      htmlRodape += `<div class="totais">`;
      options.totaisExtras.forEach(total => {
        htmlRodape += `
          <div class="totais-item">
            <span>${total.label}:</span>
            <strong>${total.valor}</strong>
          </div>
        `;
      });
      htmlRodape += `</div>`;
    }
    
    htmlRodape += `
      <div class="assinatura">
        <p>Nicolina - Sistema de Gestão de Encomendas | Produção de Padaria</p>
        <p>Documento gerado automaticamente - ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>`;

    // 🎁 MONTAR HTML COMPLETO
    const htmlCompleto = `
      ${cssImpressao}
      <div id="nicolina-print-container">
        <div class="print-content">
          ${htmlCabecalho}
          ${htmlTabela}
          ${htmlRodape}
        </div>
      </div>
    `;

    // 🚀 INJETAR NO DOM
    const containerExistente = document.getElementById('nicolina-print-container');
    if (containerExistente) {
      containerExistente.remove();
    }

    const containerTemp = document.createElement('div');
    containerTemp.innerHTML = htmlCompleto;
    document.body.appendChild(containerTemp.firstElementChild!);

    console.log("✅ Container de impressão criado com sucesso");
    console.log("📄 Total de linhas na tabela:", options.dados.length);

    // ⏱️ AGUARDAR RENDERIZAÇÃO E IMPRIMIR
    setTimeout(() => {
      console.log("🖨️ Executando window.print()...");
      window.print();
      
      // 🧹 LIMPAR APÓS IMPRESSÃO
      setTimeout(() => {
        const container = document.getElementById('nicolina-print-container');
        if (container) {
          container.remove();
          console.log("🧹 Container de impressão removido");
        }
      }, 1000);
    }, 300);

    toast.success("Preparando impressão...");
    
  } catch (error) {
    console.error("❌ Erro ao preparar impressão:", error);
    toast.error("Erro ao preparar impressão");
  }
}

/**
 * Executa impressão da página com mensagem de feedback
 * ⚠️ DEPRECATED: Use imprimirDados() para melhor controle
 */
export function imprimirPagina(): void {
  try {
    window.print();
    toast.success("Preparando impressão...");
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    toast.error("Erro ao preparar impressão");
  }
}

/**
 * Executa impressão em modo paisagem
 */
export function imprimirPaisagem(): void {
  try {
    // Criar elemento style com orientação paisagem
    const styleElement = document.createElement('style');
    styleElement.id = 'print-orientation-style';
    styleElement.textContent = `
      @media print {
        @page {
          size: landscape;
          margin: 1cm;
        }
      }
    `;
    
    // Adicionar ao head
    document.head.appendChild(styleElement);
    
    // Executar impressão
    window.print();
    
    // Remover style após impressão
    setTimeout(() => {
      const el = document.getElementById('print-orientation-style');
      if (el) {
        el.remove();
      }
    }, 1000);
    
    toast.success("Preparando impressão em modo paisagem...");
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    const el = document.getElementById('print-orientation-style');
    if (el) {
      el.remove();
    }
    toast.error("Erro ao preparar impressão");
  }
}

/**
 * Executa impressão em modo retrato
 */
export function imprimirRetrato(): void {
  try {
    // Criar elemento style com orientação retrato
    const styleElement = document.createElement('style');
    styleElement.id = 'print-orientation-style';
    styleElement.textContent = `
      @media print {
        @page {
          size: portrait;
          margin: 1cm;
        }
      }
    `;
    
    // Adicionar ao head
    document.head.appendChild(styleElement);
    
    // Executar impressão
    window.print();
    
    // Remover style após impressão
    setTimeout(() => {
      const el = document.getElementById('print-orientation-style');
      if (el) {
        el.remove();
      }
    }, 1000);
    
    toast.success("Preparando impressão em modo retrato...");
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    const el = document.getElementById('print-orientation-style');
    if (el) {
      el.remove();
    }
    toast.error("Erro ao preparar impressão");
  }
}

/**
 * Formata data para exibição em português
 * @param data - Data em formato ISO ou Date
 * @returns Data formatada (DD/MM/AAAA)
 */
export function formatarData(data: string | Date): string {
  try {
    const dataObj = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
    return dataObj.toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

/**
 * Formata hora para exibição
 * @param hora - Hora em formato HH:MM
 * @returns Hora formatada
 */
export function formatarHora(hora: string): string {
  return hora || "-";
}

/**
 * Formata peso em gramas para kg
 * @param gramas - Peso em gramas
 * @returns Peso formatado (ex: "2.5 kg")
 */
export function formatarPeso(gramas: number): string {
  if (!gramas) return "-";
  const kg = gramas / 1000;
  return `${kg.toFixed(3)} kg`;
}

/**
 * Formata preço em reais
 * @param valor - Valor numérico
 * @returns Preço formatado (ex: "R$ 10,50")
 */
export function formatarPreco(valor: number): string {
  if (!valor) return "-";
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

/**
 * Gera cabeçalho padrão para impressão
 * @param titulo - Título da página
 * @param subtitulo - Subtítulo opcional
 * @returns HTML do cabeçalho
 */
export function gerarCabecalhoImpressao(titulo: string, subtitulo?: string): string {
  const dataHora = new Date().toLocaleString("pt-BR");
  
  return `
    <div style="margin-bottom: 20px; border-bottom: 2px solid #084d6e; padding-bottom: 10px;">
      <h1 style="margin: 0; color: #084d6e; font-size: 24pt;">${titulo}</h1>
      ${subtitulo ? `<h2 style="margin: 5px 0 0 0; color: #666; font-size: 14pt;">${subtitulo}</h2>` : ''}
      <p style="margin: 5px 0 0 0; font-size: 9pt; color: #666;">
        Data de Geração: ${dataHora}
      </p>
    </div>
  `;
}

/**
 * Gera rodapé padrão para impressão
 * @returns HTML do rodapé
 */
export function gerarRodapeImpressao(): string {
  return `
    <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #666; text-align: center;">
      <p style="margin: 0;">Nicolina - Gestão de Encomendas | Sistema de Produção de Padaria</p>
      <p style="margin: 5px 0 0 0;">Documento gerado automaticamente - ${new Date().toLocaleString("pt-BR")}</p>
    </div>
  `;
}
