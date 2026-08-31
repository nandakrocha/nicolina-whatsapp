import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Download,
  Printer,
  Calendar,
  Package,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  encomendasAPI,
  clientesAPI,
  produtosAPI,
  type Encomenda,
  type Cliente,
  type Produto,
} from "../services/api";
import { imprimirDados } from "../utils/exportacao";

export default function ListaEncomendas() {
  console.log("📋 ========================================");
  console.log("📋 ListaEncomendas.tsx v7.0.0 CARREGADO");
  console.log("📋 Timestamp:", new Date().toISOString());
  console.log("📋 🔄 SINCRONIZAÇÃO EM TEMPO REAL ATIVA");
  console.log("📋 ✅ AGRUPAMENTO AUTOMÁTICO IMPLEMENTADO");
  console.log("📋 🎯 ESPELHO INTELIGENTE DA PÁGINA ENCOMENDAS");
  console.log("📋 🐛 DEBUG DE FILTROS ATIVADO");
  console.log("📋 🔧 FIX: Referências de objetos Date corrigidas");
  console.log("📋 🖨️ IMPRESSÃO CORRIGIDA - window.print() direto");
  console.log("📋 📊 HTML de impressão no DOM (não temporário)");
  console.log("📋 ========================================");
  
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros
  const [filtroData, setFiltroData] = useState<"hoje" | "amanha">("hoje");
  const [filtroTurno, setFiltroTurno] = useState<"todos" | "manha" | "tarde">("todos");
  // Configurações de espaçamento
  const [paddingTabela, setPaddingTabela] = useState<"compacto" | "normal" | "confortavel">("normal");

  // ========== CARREGAR DADOS COM SINCRONIZAÇÃO EM TEMPO REAL ==========
  useEffect(() => {
    console.log("🔄 Iniciando sincronização em tempo real...");
    
    // Carregar clientes e produtos uma vez
    const carregarDadosIniciais = async () => {
      try {
        const [clientesData, produtosData] = await Promise.all([
          clientesAPI.listar(),
          produtosAPI.listar(),
        ]);
        
        setClientes(clientesData);
        setProdutos(produtosData);
      } catch (error) {
        console.error("❌ Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar dados iniciais");
      }
    };
    
    carregarDadosIniciais();
    
    // Configurar sincronização em tempo real para encomendas
    const unsubscribe = encomendasAPI.observar((encomendasData) => {
      console.log("📊 Dados sincronizados em tempo real:", encomendasData.length, "encomendas");
      setEncomendas(encomendasData);
      setCarregando(false);
    });
    
    // Cleanup: desinscrever ao desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // ========== FUNÇÕES DE FILTRO ==========
  const obterDataFiltro = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    console.log("📅 Data atual (hoje):", hoje.toISOString(), "→", hoje.toLocaleDateString("pt-BR"));

    if (filtroData === "hoje") {
      console.log("🔍 Filtro: HOJE");
      const inicio = new Date(hoje);
      const fim = new Date(hoje);
      return { inicio, fim };
    } else if (filtroData === "amanha") {
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      console.log("🔍 Filtro: AMANHÃ →", amanha.toLocaleDateString("pt-BR"));
      const inicio = new Date(amanha);
      const fim = new Date(amanha);
      return { inicio, fim };
    }

    // Fallback
    const inicio = new Date(hoje);
    const fim = new Date(hoje);
    return { inicio, fim };
  };

  // ========== FUNÇÕES DE AGRUPAMENTO ==========
  // Agrupa encomendas do mesmo cliente, data e hora
  const agruparEncomendas = (encomendas: Encomenda[]) => {
    console.log("🔄 Iniciando agrupamento de encomendas...");
    const agrupadas = new Map<string, Encomenda>();
    
    encomendas.forEach((encomenda) => {
      // Chave única: clienteId + data + hora
      const chave = `${encomenda.clienteId || 'sem-cliente'}_${encomenda.data}_${encomenda.hora}`;
      
      if (agrupadas.has(chave)) {
        // Já existe uma encomenda com mesma chave - combinar produtos
        const existente = agrupadas.get(chave)!;
        
        // Combinar produtos
        const produtosExistentes = existente.produtos || [];
        const novosProdutos = encomenda.produtos || [];
        
        // Criar mapa de produtos para somar quantidades duplicadas
        const mapaProdutos = new Map<string, any>();
        
        [...produtosExistentes, ...novosProdutos].forEach((produto) => {
          const chaveProduto = produto.produtoId || produto.produtoNome;
          
          if (mapaProdutos.has(chaveProduto)) {
            // Produto já existe - somar quantidade
            const produtoExistente = mapaProdutos.get(chaveProduto);
            produtoExistente.quantidade += produto.quantidade;
            produtoExistente.pesoTotalKg = (produtoExistente.pesoTotalKg || 0) + (produto.pesoTotalKg || 0);
            
            // Combinar observações se diferentes
            if (produto.observacao && produto.observacao !== produtoExistente.observacao) {
              produtoExistente.observacao = produtoExistente.observacao 
                ? `${produtoExistente.observacao}; ${produto.observacao}`
                : produto.observacao;
            }
          } else {
            // Produto novo
            mapaProdutos.set(chaveProduto, { ...produto });
          }
        });
        
        // Atualizar produtos agrupados
        existente.produtos = Array.from(mapaProdutos.values());
        
        console.log(`✅ Agrupado: ${encomenda.clienteNome} - ${encomenda.data} ${encomenda.hora}`);
      } else {
        // Primeira ocorrência desta combinação
        agrupadas.set(chave, { ...encomenda, produtos: [...(encomenda.produtos || [])] });
      }
    });
    
    const resultado = Array.from(agrupadas.values());
    console.log(`📊 Total de encomendas: ${encomendas.length} → Após agrupamento: ${resultado.length}`);
    
    return resultado;
  };

  const encomendasFiltradas = encomendas.filter((encomenda) => {
    // Filtro de data
    const dataEncomenda = new Date(encomenda.data + "T00:00:00");
    const { inicio, fim } = obterDataFiltro();

    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);

    console.log("🔎 Comparando:", {
      encomenda: `${encomenda.clienteNome} (${encomenda.data})`,
      dataEncomenda: dataEncomenda.toLocaleDateString("pt-BR"),
      inicio: inicio.toLocaleDateString("pt-BR"),
      fim: fim.toLocaleDateString("pt-BR"),
      dataEncomendaTimestamp: dataEncomenda.getTime(),
      inicioTimestamp: inicio.getTime(),
      fimTimestamp: fim.getTime(),
    });

    const dentroDoIntervalo = dataEncomenda >= inicio && dataEncomenda <= fim;

    console.log(dentroDoIntervalo ? "✅ INCLUÍDO" : "❌ EXCLUÍDO");

    if (!dentroDoIntervalo) return false;

    // Filtro de turno (manhã/tarde)
    if (filtroTurno !== "todos" && encomenda.hora) {
      const [hora] = encomenda.hora.split(":").map(Number);
      if (filtroTurno === "manha") {
        // Manhã: 06:00 até 10:59
        if (hora < 6 || hora > 10) return false;
      } else if (filtroTurno === "tarde") {
        // Tarde: 11:00 em diante
        if (hora < 11) return false;
      }
    }

    return true;
  });
  
  console.log("📊 RESULTADO FINAL:", encomendasFiltradas.length, "encomendas após filtro");

  // ========== FUNÇÕES DE UTILITÁRIO ==========
  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const calcularTotalPorNomeProduto = (nomeProduto: string) => {
    return encomendasFiltradas.reduce((total, encomenda) => {
      const produtosEncontrados = encomenda.produtos?.filter(
        (p) => p.produtoNome === nomeProduto
      ) || [];
      return total + produtosEncontrados.reduce((sum, p) => sum + (p.quantidade || 0), 0);
    }, 0);
  };

  // ========== FUNÇÕES DE EXPORTAÇÃO ==========
  const handleExportar = () => {
    const dados = encomendasFiltradas.map((encomenda) => ({
      Data: formatarData(encomenda.data),
      Hora: encomenda.hora || "",
      Cliente: encomenda.clienteNome || "Cliente não informado",
      Produtos: encomenda.produtos?.map(p => 
        `${p.produtoNome} (${p.quantidade}${p.observacao ? ` - ${p.observacao}` : ""})`
      ).join(", ") || "",
      "Peso Total": encomenda.produtos?.reduce((sum, p) => sum + (p.pesoTotalKg || 0), 0).toFixed(2) + " kg",
      "Observação da Encomenda": encomenda.observacao || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Encomendas");
    
    const dataAtual = new Date().toISOString().split("T")[0];
    const nomeArquivo = `lista_encomendas_${filtroData}_${dataAtual}.xlsx`;
    
    XLSX.writeFile(wb, nomeArquivo);
    toast.success("Lista exportada com sucesso!");
  };

  // 🖨️ NOVA FUNÇÃO: Impressão A4
  const handleImprimir = () => {
    console.log("🖨️ ========================================");
    console.log("🖨️ INICIANDO IMPRESSÃO A4");
    console.log("🖨️ Total de encomendas filtradas:", encomendasFiltradas.length);
    console.log("🖨️ ========================================");
    
    if (encomendasFiltradas.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }
    
    // Criar CSS EXCLUSIVO para impressão A4
    const styleElement = document.createElement('style');
    styleElement.id = 'print-style-a4';
    styleElement.textContent = `
      @media print {
        /* OCULTAR TUDO POR PADRÃO */
        body * {
          display: none !important;
          visibility: hidden !important;
        }

        /* Mostrar APENAS a área de impressão A4 e seus filhos */
        #print-area-a4,
        #print-area-a4 * {
          display: block !important;
          visibility: visible !important;
        }

        /* Configurar body para A4 */
        body {
          display: block !important;
          visibility: visible !important;
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Posicionar área A4 */
        #print-area-a4 {
          position: relative !important;
        }

        /* Configuração da página A4 */
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        /* Tabela A4 */
        .table-a4 {
          display: table !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }

        .table-a4 thead,
        .table-a4 tbody,
        .table-a4 tr {
          display: table-row-group !important;
        }

        .table-a4 thead {
          display: table-header-group !important;
        }

        .table-a4 tr {
          display: table-row !important;
        }

        .table-a4 th,
        .table-a4 td {
          display: table-cell !important;
          border: 1px solid #000 !important;
          padding: 8px !important;
          font-size: 10pt !important;
        }

        .table-a4 th {
          background-color: #084d6e !important;
          color: white !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // Executar impressão após pequeno delay
    setTimeout(() => {
      window.print();
      
      // Remover CSS após impressão
      setTimeout(() => {
        const el = document.getElementById('print-style-a4');
        if (el) el.remove();
      }, 1000);
    }, 100);
  };

  // 🖨️ FUNÇÃO: Impressão Térmica 80mm
  const handleImprimirTermica = () => {
    if (encomendasFiltradas.length === 0) {
      toast.error("Não há dados para imprimir");
      return;
    }

    // Criar janela de impressão com conteúdo isolado
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    // Construir HTML completo e limpo
    const hoje = new Date().toLocaleDateString("pt-BR");

    // 🤖 DETERMINAR TURNO BASEADO NO FILTRO ATIVO
    let turnoTexto = "";
    if (filtroTurno === "manha") {
      turnoTexto = "MANHÃ";
    } else if (filtroTurno === "tarde") {
      turnoTexto = "TARDE";
    } else {
      // Se filtro está em "todos", determinar pelo horário das encomendas
      const horarios = encomendasFiltradas
        .filter(e => e.hora)
        .map(e => {
          const [hora] = e.hora!.split(":").map(Number);
          return hora;
        });

      if (horarios.length > 0) {
        const todosManha = horarios.every(h => h >= 6 && h <= 10);
        const todosTarde = horarios.every(h => h >= 11);

        if (todosManha) {
          turnoTexto = "MANHÃ";
        } else if (todosTarde) {
          turnoTexto = "TARDE";
        } else {
          turnoTexto = "MANHÃ E TARDE";
        }
      }
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Impressão Térmica</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: 80mm;
            padding: 3mm;
            font-family: Arial, sans-serif;
            font-size: 13pt;
            line-height: 1.5;
            color: #000;
            background: white;
          }

          .header {
            text-align: center;
            margin-bottom: 5mm;
            padding-bottom: 4mm;
            border-bottom: 3px double #000;
          }

          .title {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 3mm;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .date {
            font-size: 12pt;
            font-weight: bold;
          }

          .turno {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            margin-top: 3mm;
            text-transform: uppercase;
          }

          .item {
            padding: 4mm 0;
            border-bottom: 2px solid #000;
            page-break-inside: avoid;
          }

          .client {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3mm;
            text-transform: uppercase;
          }

          .product-row {
            display: flex;
            justify-content: space-between;
            margin: 2mm 0 2mm 2mm;
          }

          .product {
            font-size: 12pt;
            font-weight: bold;
            flex: 1;
            padding-right: 4mm;
            text-transform: uppercase;
          }

          .qty {
            font-size: 14pt;
            font-weight: bold;
            text-align: right;
            min-width: 18mm;
          }

          .footer {
            margin-top: 5mm;
            padding-top: 4mm;
            border-top: 3px double #000;
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">RESUMO DE ENCOMENDAS</div>
          <div class="date">${hoje}</div>
          ${turnoTexto ? `<div class="turno">TURNO: ${turnoTexto}</div>` : ''}
        </div>
    `;

    // Adicionar encomendas
    encomendasFiltradas.forEach(encomenda => {
      html += `
        <div class="item">
          <div class="client">${encomenda.clienteNome || 'CLIENTE NÃO INFORMADO'}</div>
      `;

      (encomenda.produtos || []).forEach(produto => {
        html += `
          <div class="product-row">
            <div class="product">${produto.produtoNome}</div>
            <div class="qty">${produto.quantidade}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    // Adicionar rodapé
    html += `
        <div class="footer">
          TOTAL: ${totalEncomendas} ENCOMENDA${totalEncomendas !== 1 ? 'S' : ''}
        </div>
      </body>
      </html>
    `;

    // Escrever no documento da nova janela
    printWindow.document.write(html);
    printWindow.document.close();

    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };
  
  // Função auxiliar para obter o padding baseado na configuração
  const getPadding = () => {
    switch (paddingTabela) {
      case "compacto":
        return "p-2";
      case "confortavel":
        return "p-4";
      default:
        return "p-3";
    }
  };

  // ========== ESTATÍSTICAS ==========
  const totalEncomendas = encomendasFiltradas.length;
  const totalClientes = new Set(encomendasFiltradas.map(e => e.clienteId)).size;
  const pesoTotal = encomendasFiltradas.reduce((sum, e) => 
    sum + (e.produtos?.reduce((s, p) => s + (p.pesoTotalKg || 0), 0) || 0), 0
  );

  if (carregando) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando encomendas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 print:p-0">
      {/* CSS oculto em tela - os containers de impressão ficam invisíveis */}
      <style>{`
        @media screen {
          #print-area-a4 {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="no-print">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <Package className="w-7 h-7" />
            Lista de Encomendas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Visualização completa de todas as encomendas cadastradas no sistema
          </p>
        </CardHeader>
      </div>

      {/* Filtros e Ações */}
      <div className="space-y-4 no-print ">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hidden">
          <CardContent className="py-2 px-4">
            <div className="flex items-center justify-center overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-3 md:gap-4 lg:gap-6">
                {/* Pão de sal */}
                <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🥖</div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Pão sal</p>
                    <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                      {calcularTotalPorNomeProduto("Pão de sal")}
                    </p>
                  </div>
                </div>
                <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                
                {/* Mini sal */}
                <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🥖</div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Mini sal</p>
                    <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                      {calcularTotalPorNomeProduto("Mini sal")}
                    </p>
                  </div>
                </div>
                <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                
                {/* Pão de doce */}
                <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🍯</div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Pão doce</p>
                    <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                      {calcularTotalPorNomeProduto("Pão de doce")}
                    </p>
                  </div>
                </div>
                <div className="border-l border-primary/30 h-7 sm:h-10 md:h-12"></div>
                
                {/* Mini doce */}
                <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">🍯</div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Mini doce</p>
                    <p className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary">
                      {calcularTotalPorNomeProduto("Mini doce")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Filtros Rápidos de Data */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Período
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={filtroData === "hoje" ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault();
                      setFiltroData("hoje");
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFiltroData("hoje");
                    }}
                    className="flex-1"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={filtroData === "amanha" ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault();
                      setFiltroData("amanha");
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFiltroData("amanha");
                    }}
                    className="flex-1"
                  >
                    Amanhã
                  </Button>
                </div>
              </div>

              {/* Filtros Rápidos de Turno */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Turno
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={filtroTurno === "manha" ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault();
                      setFiltroTurno(filtroTurno === "manha" ? "todos" : "manha");
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFiltroTurno(filtroTurno === "manha" ? "todos" : "manha");
                    }}
                    className="flex-1"
                  >
                    Manhã
                  </Button>
                  <Button
                    variant={filtroTurno === "tarde" ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault();
                      setFiltroTurno(filtroTurno === "tarde" ? "todos" : "tarde");
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFiltroTurno(filtroTurno === "tarde" ? "todos" : "tarde");
                    }}
                    className="flex-1"
                  >
                    Tarde
                  </Button>
                </div>
              </div>
            </div>
            

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleExportar} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button onClick={handleImprimir} variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir A4
              </Button>
              <Button onClick={handleImprimirTermica} variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir Térmica 80x40
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Encomendas */}
      <Card className="no-print">
        <CardContent className="p-0">
          {encomendasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma encomenda encontrada para o período selecionado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Cliente</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Data</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Hora</th>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Produto</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Qtd</th>
                    <th className={`text-left ${getPadding()} text-sm font-semibold`}>Observação</th>
                    <th className={`text-center ${getPadding()} text-sm font-semibold`}>Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {encomendasFiltradas.flatMap((encomenda, encIndex) => {
                    const rows = [];
                    
                    // Adiciona linha separadora entre clientes (exceto antes do primeiro)
                    if (encIndex > 0) {
                      rows.push(
                        <tr key={`separator-${encomenda.id}`}>
                          <td colSpan={7} className="p-0">
                            <div className="border-t-4 border-primary/20"></div>
                          </td>
                        </tr>
                      );
                    }
                    
                    // Adiciona as linhas de produtos
                    const produtosVisiveis = encomenda.produtos || [];
                    produtosVisiveis.forEach((produto, index) => {
                      rows.push(
                        <tr key={`${encomenda.id}-${index}`} className="border-t hover:bg-muted/30">
                          {index === 0 && (
                            <>
                              <td
                                className={`${getPadding()} font-bold text-primary bg-primary/5`}
                                rowSpan={produtosVisiveis.length}
                              >
                                📅 {encomenda.clienteNome || "Cliente não informado"}
                                {encomenda.observacao && (
                                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                                    💬 {encomenda.observacao}
                                  </div>
                                )}
                              </td>
                              <td
                                className={`${getPadding()} text-center bg-primary/5`}
                                rowSpan={produtosVisiveis.length}
                              >
                                {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                              </td>
                              <td
                                className={`${getPadding()} text-center font-medium bg-primary/5`}
                                rowSpan={produtosVisiveis.length}
                              >
                                {encomenda.hora || "-"}
                              </td>
                            </>
                          )}
                          <td className={`${getPadding()} font-medium`}>{produto.produtoNome}</td>
                          <td className={`${getPadding()} text-center font-bold`}>{produto.quantidade}</td>
                          <td className={`${getPadding()} text-muted-foreground`}>
                            {produto.observacao || "-"}
                          </td>
                          <td className={`${getPadding()} text-center font-medium`}>
                            {(produto.pesoTotalKg || 0).toFixed(2)} kg
                          </td>
                        </tr>
                      );
                    });

                    // Encomenda gravada sem nenhum produto continua visível.
                    // Sem esta linha o registro — e a observação — desapareciam
                    // da tabela, porque a observação fica na linha do produto.
                    if (produtosVisiveis.length === 0) {
                      rows.push(
                        <tr
                          key={`${encomenda.id}-sem-produtos`}
                          className="border-t bg-amber-50 dark:bg-amber-950/20"
                        >
                          <td className={`${getPadding()} font-bold text-primary`}>
                            📅 {encomenda.clienteNome || "Cliente não informado"}
                            {encomenda.observacao && (
                              <div className="mt-1 text-xs font-normal text-muted-foreground">
                                💬 {encomenda.observacao}
                              </div>
                            )}
                          </td>
                          <td className={`${getPadding()} text-center`}>
                            {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className={`${getPadding()} text-center font-medium`}>
                            {encomenda.hora || "-"}
                          </td>
                          <td
                            className={`${getPadding()} text-amber-700 dark:text-amber-300 font-medium`}
                            colSpan={4}
                          >
                            ⚠️ Encomenda sem produtos — confira a mensagem original
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versão de Impressão A4 */}
      <div className="print-only" id="print-area-a4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Nicolina - Gestão de Encomendas</h1>
          <h2 className="text-xl mt-2">Lista de Encomendas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Período: {filtroData === "hoje" ? "Hoje" : "Amanhã"}
            {filtroTurno !== "todos" && ` - ${filtroTurno === "manha" ? "Manhã (06:00-10:59)" : "Tarde (11:00+)"}`}
          </p>
          <p className="text-xs text-muted-foreground">
            Gerado em: {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        <table className="w-full border-collapse table-a4">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-center p-2 border border-black font-bold">Hora</th>
              <th className="text-left p-2 border border-black font-bold">Cliente</th>
              <th className="text-left p-2 border border-black font-bold">Produto</th>
              <th className="text-center p-2 border border-black font-bold">Quantidade</th>
              <th className="text-left p-2 border border-black font-bold">Observação</th>
            </tr>
          </thead>
          <tbody>
            {encomendasFiltradas.flatMap((encomenda) => {
              const produtos = encomenda.produtos || [];
              
              return produtos.map((produto, idx) => (
                <tr key={`${encomenda.id}-${idx}`} className="border-b border-black">
                  {idx === 0 && (
                    <td 
                      className="text-center p-2 border border-black font-medium" 
                      rowSpan={produtos.length}
                    >
                      {encomenda.hora || "-"}
                    </td>
                  )}
                  {idx === 0 && (
                    <td 
                      className="p-2 border border-black font-bold" 
                      rowSpan={produtos.length}
                    >
                      {encomenda.clienteNome || "Cliente não informado"}
                      {encomenda.observacao && (
                        <div style={{ fontWeight: 'normal', fontSize: '9pt', marginTop: '2px' }}>
                          💬 {encomenda.observacao}
                        </div>
                      )}
                    </td>
                  )}
                  <td className="p-2 border border-black">{produto.produtoNome}</td>
                  <td className="text-center p-2 border border-black font-bold">{produto.quantidade}</td>
                  <td className="p-2 border border-black text-sm">{produto.observacao || "-"}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>

        <div className="mt-6 text-sm border-t-2 border-black pt-4">
          <strong>Totais do Período:</strong>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div><strong>Encomendas:</strong> {totalEncomendas}</div>
            <div><strong>Clientes:</strong> {totalClientes}</div>
            <div><strong>Peso Total:</strong> {pesoTotal.toFixed(2)} kg</div>
          </div>
        </div>
      </div>

      {/* 🖨️ VERSÃO TÉRMICA 80x40 - IMPRESSÃO EXCLUSIVA */}
      <div id="print-area-80mm" style={{ display: 'none' }}>
        <div className="thermal-header">
          <div className="thermal-title">RESUMO DE ENCOMENDAS</div>
          <div className="thermal-date">
            {new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>

        {encomendasFiltradas.map((encomenda, idx) => (
          <div key={`thermal-${encomenda.id}-${idx}`} className="thermal-item">
            <div className="thermal-client">
              {encomenda.clienteNome || "CLIENTE NÃO INFORMADO"}
            </div>
            {encomenda.observacao && (
              <div className="thermal-observacao">💬 {encomenda.observacao}</div>
            )}
            {(encomenda.produtos || []).map((produto, pIdx) => (
              <div key={`thermal-prod-${pIdx}`} className="thermal-product-row">
                <div className="thermal-product">{produto.produtoNome}</div>
                <div className="thermal-qty">{produto.quantidade}</div>
              </div>
            ))}
          </div>
        ))}

        <div className="thermal-footer">
          TOTAL: {totalEncomendas} ENCOMENDA{totalEncomendas !== 1 ? 'S' : ''}
        </div>
      </div>
    </div>
  );
}