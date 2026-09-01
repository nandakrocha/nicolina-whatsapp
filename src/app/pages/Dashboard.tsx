import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Calendar, Package, TrendingUp, Cloud, AlertCircle, Sparkles, RefreshCw, Factory, List } from "lucide-react";
import { encomendasAPI, produtosAPI, type Encomenda, type Produto } from "../services/api";
import { isFirebaseConfigured } from "../services/firebase";
import { migracaoAPI } from "../services/api";
import { toast } from "sonner";
import { limparCacheDesktop } from "../version";

// "Hoje"/"amanhã" pelo relógio de São Paulo, não pelo fuso do navegador.
// new Date().toISOString() pega o dia em UTC: entre 21h e 23h59 (horário de
// Brasília) o UTC já virou o dia seguinte, e o Dashboard passaria a mostrar
// "hoje" como sendo amanhã (mesmo bug corrigido na tabela de Encomendas).
function obterDataSaoPaulo(offsetDias = 0): string {
  const data = new Date(Date.now() + offsetDias * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    carregarDados();
    
    // Recarrega quando a janela ganha foco (usuário volta para a página)
    const handleFocus = () => {
      carregarDados();
    };
    window.addEventListener('focus', handleFocus);
    
    // Listener para eventos customizados de atualização de dados
    const handleAtualizar = () => {
      carregarDados();
    };
    window.addEventListener('encomendas-atualizadas', handleAtualizar);
    window.addEventListener('produtos-atualizados', handleAtualizar);
    window.addEventListener('encomenda-atualizada', handleAtualizar);
    window.addEventListener('clientes-atualizados', handleAtualizar);
    
    // 🕐 ATUALIZAÇÃO AUTOMÁTICA À MEIA-NOITE
    // Calcula o tempo até a próxima meia-noite
    const agora = new Date();
    const proximaMeiaNoite = new Date(agora);
    proximaMeiaNoite.setHours(24, 0, 0, 0); // Próxima meia-noite
    const tempoAteMeiaNoite = proximaMeiaNoite.getTime() - agora.getTime();
    
    console.log(`🕐 Dashboard será atualizado automaticamente em ${Math.floor(tempoAteMeiaNoite / 1000 / 60 / 60)}h ${Math.floor((tempoAteMeiaNoite / 1000 / 60) % 60)}min`);
    
    // Timer para atualizar à meia-noite
    const timerMeiaNoite = setTimeout(() => {
      console.log('🕐 MEIA-NOITE! Atualizando dashboard...');
      carregarDados();
      toast.success('🕐 Novo dia! Dashboard atualizado automaticamente', {
        duration: 3000,
      });
      
      // Após a primeira meia-noite, configura atualização diária
      setInterval(() => {
        console.log('🕐 MEIA-NOITE! Atualizando dashboard...');
        carregarDados();
        toast.success('🕐 Novo dia! Dashboard atualizado automaticamente', {
          duration: 3000,
        });
      }, 86400000); // 24 horas
    }, tempoAteMeiaNoite);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('encomendas-atualizadas', handleAtualizar);
      window.removeEventListener('produtos-atualizados', handleAtualizar);
      window.removeEventListener('encomenda-atualizada', handleAtualizar);
      window.removeEventListener('clientes-atualizados', handleAtualizar);
      clearTimeout(timerMeiaNoite);
    };
  }, []);

  const carregarDados = async () => {
    setAtualizando(true);
    try {
      const [encomendasData, produtosData] = await Promise.all([
        encomendasAPI.listar(),
        produtosAPI.listar(),
      ]);
      setEncomendas(encomendasData);
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  const atualizarManualmente = async () => {
    await carregarDados();
    toast.success("✅ Dados atualizados!", {
      description: "Sistema sincronizado com sucesso",
      duration: 2000,
    });
  };

  const hoje = obterDataSaoPaulo(0);
  const amanha = obterDataSaoPaulo(1);

  // Categorias exibidas no resumo. "Outros" é obrigatório: qualquer produto
  // que não caia nas 4 categorias de pão nem em Kit/Manteiga precisa
  // aparecer aqui — nunca pode ser descartado, senão o total do Dashboard
  // fica menor do que a soma real da tabela de Encomendas.
  const CATEGORIAS_RESUMO = ["Pão de Sal", "Pão de Doce", "Mini Sal", "Mini Doce", "Kit", "Manteiga", "Outros"] as const;

  const criarMapaCategorias = () =>
    CATEGORIAS_RESUMO.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<string, number>);

  const calcularPorCategoria = (data: string) => {
    // Só entram no cálculo de produção as encomendas do dia que realmente
    // têm produtos com quantidade válida (> 0). Encomendas com produtos: []
    // (pendências vindas do WhatsApp) continuam existindo e visíveis na
    // tabela, mas não podem contar como produção (FASE 5 da auditoria).
    const encomendasDia = encomendas.filter((e) => e.data === data);

    const categorias = criarMapaCategorias();
    const categoriasManha = criarMapaCategorias();
    const categoriasTarde = criarMapaCategorias();

    const clientesPorCategoria: {
      [categoria: string]: { [clienteId: string]: { nome: string; quantidade: number } }
    } = CATEGORIAS_RESUMO.reduce((acc, cat) => ({ ...acc, [cat]: {} }), {} as any);

    // Nomes reais agrupados dentro de "Outros", para não escondermos o que
    // está sendo somado ali (FASE 6: agrupar por produtoId, exibir por nome).
    const produtosOutros: { [produtoKey: string]: { nome: string; quantidade: number } } = {};

    encomendasDia.forEach((encomenda) => {
      // Turno vem sempre de encomenda.hora (FASE 4), nunca inferido pelo produto.
      const hora = encomenda.hora ? parseInt(encomenda.hora.split(':')[0], 10) : 0;
      const isManha = hora >= 6 && hora < 11;

      encomenda.produtos?.forEach((item) => {
        // Regra de cálculo (FASE 3): soma sempre Number(produto.quantidade) || 0
        // por produto dentro de produtos[]. Nunca usar quantidadeTotal da
        // encomenda como substituto — evita duplicidade e valores fantasmas.
        const quantidade = Number(item.quantidade) || 0;
        if (quantidade <= 0) return;

        const produto = produtos.find((p) => p.id === item.produtoId);
        const nomeProduto = produto?.nome || item.produtoNome || "Produto não identificado";

        let categoria: string | undefined = produto?.categoria;

        if (nomeProduto.toUpperCase().startsWith("KIT")) {
          categoria = "Kit";
        } else if (nomeProduto === "Manteiga") {
          categoria = "Manteiga";
        } else if (!categoria || !CATEGORIAS_RESUMO.includes(categoria as any)) {
          // Produto cadastrado em outra categoria (Confeitaria, Padaria,
          // Mercearia, Bebidas, À produzir) ou sem produtoId reconhecido no
          // catálogo: NÃO descartar. Cai em "Outros" para continuar contando.
          categoria = "Outros";
        }

        categorias[categoria] += quantidade;
        if (isManha) {
          categoriasManha[categoria] += quantidade;
        } else {
          categoriasTarde[categoria] += quantidade;
        }

        if (categoria === "Outros") {
          const chaveProduto = item.produtoId || nomeProduto;
          if (!produtosOutros[chaveProduto]) {
            produtosOutros[chaveProduto] = { nome: nomeProduto, quantidade: 0 };
          }
          produtosOutros[chaveProduto].quantidade += quantidade;
        }

        if (!clientesPorCategoria[categoria][encomenda.clienteId]) {
          clientesPorCategoria[categoria][encomenda.clienteId] = {
            nome: encomenda.clienteNome,
            quantidade: 0
          };
        }
        clientesPorCategoria[categoria][encomenda.clienteId].quantidade += quantidade;
      });
    });

    return { 
      total: categorias, 
      manha: categoriasManha, 
      tarde: categoriasTarde,
      clientes: clientesPorCategoria,
      produtosOutros,
    };
  };

  const dadosHoje = calcularPorCategoria(hoje);
  const dadosAmanha = calcularPorCategoria(amanha);

  const categoriasHoje = dadosHoje.total;
  const categoriasAmanha = dadosAmanha.total;

  // Calcula total de pães (somando as 4 categorias principais)
  const totalPaesHoje = Object.values(categoriasHoje).reduce((acc, val) => acc + val, 0);
  const totalPaesAmanha = Object.values(categoriasAmanha).reduce((acc, val) => acc + val, 0);

  // "Total de Encomendas" conta pedidos com produção real (ao menos um
  // produto com quantidade > 0). Encomendas com produtos: [] (pendência do
  // WhatsApp, sem itens reconhecidos) não entram aqui — elas continuam
  // visíveis e editáveis na tabela de Encomendas, só não inflam este total.
  const temProducaoValida = (e: Encomenda) =>
    (e.produtos || []).some((p) => (Number(p.quantidade) || 0) > 0);

  const totalEncomendasHoje = encomendas.filter((e) => e.data === hoje && temProducaoValida(e)).length;
  const totalEncomendasAmanha = encomendas.filter((e) => e.data === amanha && temProducaoValida(e)).length;

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">📊 Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visão geral da produção de hoje e amanhã
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={limparCacheDesktop}
            variant="outline"
            size="icon"
            className="flex-shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 sm:w-10 sm:h-10"
            title="✨ LIMPAR CACHE DO DESKTOP (use se sistema não funcionar)"
          >
            <Sparkles className="w-5 h-5 text-[#084d6e]" />
          </Button>
          <Button
            onClick={atualizarManualmente}
            disabled={atualizando}
            variant="outline"
            size="icon"
            className="flex-shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 sm:w-10 sm:h-10"
            title="Atualizar dados do sistema"
          >
            <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Atalhos Rápidos - Versão 2.43.0 - Atualizado em 11/03/2026 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => navigate("/encomendas")}
          variant="outline"
          className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 touch-target"
        >
          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-center">Nova Encomenda</span>
        </Button>
        <Button
          onClick={() => navigate("/lista-encomendas")}
          variant="outline"
          className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 touch-target"
        >
          <List className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-center">Lista de Encomendas</span>
        </Button>
        <Button
          onClick={() => navigate("/producao")}
          variant="outline"
          className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 touch-target"
        >
          <Factory className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-center">Produção</span>
        </Button>
        <Button
          onClick={() => navigate("/relatorios")}
          variant="outline"
          className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 touch-target"
        >
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <span className="text-xs sm:text-sm font-semibold text-center">Relatórios</span>
        </Button>
      </div>

      {/* Resumo de Encomendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Hoje
              <span className="text-sm font-normal text-muted-foreground">
                {new Date(hoje + "T00:00").toLocaleDateString("pt-BR")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-semibold">Total de Encomendas</span>
                <span className="text-2xl font-bold text-primary">
                  {totalEncomendasHoje}
                </span>
              </div>
              
              {/* Tabela com Turnos */}
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <div className="min-w-max">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left p-2 font-semibold">Categoria</th>
                        <th className="text-center p-2 font-semibold">☀️ Manha</th>
                        <th className="text-center p-2 font-semibold">🌙 Tarde</th>
                        <th className="text-center p-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">🍞 Pão de Sal</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Pão de Sal"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Pão de Sal"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Pão de Sal"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🥐 Pão de Doce</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Pão de Doce"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Pão de Doce"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Pão de Doce"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🥖 Mini Sal</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Mini Sal"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Mini Sal"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Mini Sal"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🧁 Mini Doce</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Mini Doce"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Mini Doce"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Mini Doce"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">📦 Kit</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Kit"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Kit"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Kit"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🧈 Manteiga</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Manteiga"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Manteiga"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasHoje["Manteiga"]}</td>
                      </tr>
                      {categoriasHoje["Outros"] > 0 && (
                        <tr className="border-b">
                          <td className="p-2">🧾 Outros</td>
                          <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosHoje.manha["Outros"]}</td>
                          <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosHoje.tarde["Outros"]}</td>
                          <td className="text-center p-2 font-semibold">{categoriasHoje["Outros"]}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-semibold">Total de Pães</span>
                <span className="text-2xl font-bold text-primary">
                  {totalPaesHoje}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Amanhã
              <span className="text-sm font-normal text-muted-foreground">
                {new Date(amanha + "T00:00").toLocaleDateString("pt-BR")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-semibold">Total de Encomendas</span>
                <span className="text-2xl font-bold text-primary">
                  {totalEncomendasAmanha}
                </span>
              </div>
              
              {/* Tabela com Turnos */}
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <div className="min-w-max">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left p-2 font-semibold">Categoria</th>
                        <th className="text-center p-2 font-semibold">☀️ Manha</th>
                        <th className="text-center p-2 font-semibold">🌙 Tarde</th>
                        <th className="text-center p-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">🍞 Pão de Sal</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Pão de Sal"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Pão de Sal"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Pão de Sal"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🥐 Pão de Doce</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Pão de Doce"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Pão de Doce"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Pão de Doce"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🥖 Mini Sal</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Mini Sal"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Mini Sal"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Mini Sal"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🧁 Mini Doce</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Mini Doce"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Mini Doce"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Mini Doce"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">📦 Kit</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Kit"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Kit"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Kit"]}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">🧈 Manteiga</td>
                        <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Manteiga"]}</td>
                        <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Manteiga"]}</td>
                        <td className="text-center p-2 font-semibold">{categoriasAmanha["Manteiga"]}</td>
                      </tr>
                      {categoriasAmanha["Outros"] > 0 && (
                        <tr className="border-b">
                          <td className="p-2">🧾 Outros</td>
                          <td className="text-center p-2 bg-amber-50 dark:bg-amber-950/20">{dadosAmanha.manha["Outros"]}</td>
                          <td className="text-center p-2 bg-blue-50 dark:bg-blue-950/20">{dadosAmanha.tarde["Outros"]}</td>
                          <td className="text-center p-2 font-semibold">{categoriasAmanha["Outros"]}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <span className="font-semibold">Total de Pães</span>
                <span className="text-2xl font-bold text-primary">
                  {totalPaesAmanha}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Cliente - Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Detalhamento por Cliente - Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pão de Sal */}
            {categoriasHoje["Pão de Sal"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🍞 Pão de Sal</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Pão de Sal"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Pão de Sal"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pão de Doce */}
            {categoriasHoje["Pão de Doce"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🥐 Pão de Doce</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Pão de Doce"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Pão de Doce"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mini Sal */}
            {categoriasHoje["Mini Sal"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🥖 Mini Sal</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Mini Sal"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Mini Sal"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mini Doce */}
            {categoriasHoje["Mini Doce"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧁 Mini Doce</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Mini Doce"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Mini Doce"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Kit */}
            {categoriasHoje["Kit"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">📦 Kit</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Kit"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Kit"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Manteiga */}
            {categoriasHoje["Manteiga"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧈 Manteiga</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Manteiga"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosHoje.clientes["Manteiga"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Outros: produtos que não pertencem às categorias acima
               (Confeitaria, Padaria, Mercearia, Bebidas, À produzir, sem
               categoria ou não encontrados no catálogo). Nada é descartado. */}
            {categoriasHoje["Outros"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧾 Outros produtos</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasHoje["Outros"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.values(dadosHoje.produtosOutros)
                    .sort((a, b) => b.quantidade - a.quantidade)
                    .map((info) => (
                      <div
                        key={info.nome}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {totalPaesHoje === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma encomenda para hoje
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento Amanhã */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Detalhamento por Cliente - Amanhã
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pão de Sal */}
            {categoriasAmanha["Pão de Sal"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🍞 Pão de Sal</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Pão de Sal"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Pão de Sal"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pão de Doce */}
            {categoriasAmanha["Pão de Doce"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🥐 Pão de Doce</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Pão de Doce"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Pão de Doce"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mini Sal */}
            {categoriasAmanha["Mini Sal"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🥖 Mini Sal</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Mini Sal"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Mini Sal"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mini Doce */}
            {categoriasAmanha["Mini Doce"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧁 Mini Doce</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Mini Doce"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Mini Doce"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Kit */}
            {categoriasAmanha["Kit"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">📦 Kit</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Kit"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Kit"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Manteiga */}
            {categoriasAmanha["Manteiga"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧈 Manteiga</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Manteiga"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(dadosAmanha.clientes["Manteiga"])
                    .sort((a, b) => b[1].quantidade - a[1].quantidade)
                    .map(([clienteId, info]) => (
                      <div
                        key={clienteId}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Outros: produtos que não pertencem às categorias acima
               (Confeitaria, Padaria, Mercearia, Bebidas, À produzir, sem
               categoria ou não encontrados no catálogo). Nada é descartado. */}
            {categoriasAmanha["Outros"] > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                  <h3 className="text-lg font-bold">🧾 Outros produtos</h3>
                  <span className="text-xl font-bold text-primary">
                    Total: {categoriasAmanha["Outros"]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.values(dadosAmanha.produtosOutros)
                    .sort((a, b) => b.quantidade - a.quantidade)
                    .map((info) => (
                      <div
                        key={info.nome}
                        className="flex items-center justify-between p-2 bg-primary/5 rounded"
                      >
                        <span className="text-sm font-medium">{info.nome}</span>
                        <span className="text-sm font-bold text-primary">
                          {info.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {totalPaesAmanha === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma encomenda para amanhã
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}