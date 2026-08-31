import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Bike,
  DollarSign,
  CreditCard,
  Package,
  Settings,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  motoboyAPI,
  entregasDeliveryAPI,
  deliveryConfigAPI,
  type Motoboy,
  type EntregaDelivery,
} from "../services/api";

// ---- helpers ----
const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataHoje = () => new Date().toISOString().split("T")[0];

const dataInicioSemana = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
};

const dataInicioMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const formatarDataBR = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");

type Periodo = "dia" | "semana" | "mes" | "personalizado";
type Aba = "lancamentos" | "resumo" | "motoboys";

// ---- component ----
export default function Delivery() {
  // ---- dados ----
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [entregas, setEntregas] = useState<EntregaDelivery[]>([]);
  const [taxaFixa, setTaxaFixa] = useState(5);
  const [carregando, setCarregando] = useState(true);

  // ---- filtros ----
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [filtroMotoboyId, setFiltroMotoboyId] = useState("all");
  const [filtroDataInicio, setFiltroDataInicio] = useState(dataHoje());
  const [filtroDataFim, setFiltroDataFim] = useState(dataHoje());

  // ---- abas ----
  const [aba, setAba] = useState<Aba>("lancamentos");

  // ---- form motoboy ----
  const [mostrarFormMotoboy, setMostrarFormMotoboy] = useState(false);
  const [editandoMotoboy, setEditandoMotoboy] = useState<Motoboy | null>(null);
  const [nomeMotoboy, setNomeMotoboy] = useState("");
  const [statusMotoboy, setStatusMotoboy] = useState<"ativo" | "inativo">("ativo");

  // ---- modal entrega (lançamento rápido) ----
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoEntrega, setEditandoEntrega] = useState<EntregaDelivery | null>(null);
  const [modalMotoboyId, setModalMotoboyId] = useState("");
  const [modalData, setModalData] = useState(dataHoje());
  const [modalPedido, setModalPedido] = useState("");
  const [modalDinheiro, setModalDinheiro] = useState("");
  const [modalCartao, setModalCartao] = useState("");
  const [modalTaxaPedido, setModalTaxaPedido] = useState("");
  const [modalObs, setModalObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  // refs para foco por ENTER (ordem do fluxo: data → pedido → dinheiro → cartao → taxa → obs)
  const refData = useRef<HTMLInputElement>(null);
  const refPedido = useRef<HTMLInputElement>(null);
  const refDinheiro = useRef<HTMLInputElement>(null);
  const refCartao = useRef<HTMLInputElement>(null);
  const refTaxa = useRef<HTMLInputElement>(null);
  const refObs = useRef<HTMLInputElement>(null);

  // flag que dispara o foco no Nº Pedido APÓS o React terminar o render
  const [pedirFocoPedido, setPedirFocoPedido] = useState(0);
  useEffect(() => {
    if (pedirFocoPedido === 0) return;
    const raf = requestAnimationFrame(() => {
      refPedido.current?.focus();
      refPedido.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [pedirFocoPedido]);

  // helper: avança foco para o próximo ref usando rAF (nunca trava)
  const ir = useCallback((ref: React.RefObject<HTMLInputElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
  }, []);

  // ---- excluir ----
  const [excluindoEntregaId, setExcluindoEntregaId] = useState<string | null>(null);
  const [excluindoMotoboyId, setExcluindoMotoboyId] = useState<string | null>(null);

  // ---- taxa fixa ----
  const [editandoTaxa, setEditandoTaxa] = useState(false);
  const [taxaTemp, setTaxaTemp] = useState("");

  // ---- resumo accordion ----
  const [resumoAbertos, setResumoAbertos] = useState<Record<string, boolean>>({});

  // ---- load ----
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [mb, et] = await Promise.all([
        motoboyAPI.listar(),
        entregasDeliveryAPI.listar(),
      ]);
      setMotoboys(mb);
      setEntregas(et);
      setTaxaFixa(deliveryConfigAPI.obterTaxaFixa());
    } catch {
      toast.error("Erro ao carregar dados de delivery");
    } finally {
      setCarregando(false);
    }
  }

  // ---- sincroniza datas com período ----
  useEffect(() => {
    if (periodo === "dia") {
      setFiltroDataInicio(dataHoje());
      setFiltroDataFim(dataHoje());
    } else if (periodo === "semana") {
      setFiltroDataInicio(dataInicioSemana());
      setFiltroDataFim(dataHoje());
    } else if (periodo === "mes") {
      setFiltroDataInicio(dataInicioMes());
      setFiltroDataFim(dataHoje());
    }
  }, [periodo]);

  // ---- entregas filtradas ----
  const entregasFiltradas = useMemo(() => {
    return entregas.filter((e) => {
      const ok = e.data >= filtroDataInicio && e.data <= filtroDataFim;
      const okMoto = filtroMotoboyId === "all" || e.motoboyId === filtroMotoboyId;
      return ok && okMoto;
    });
  }, [entregas, filtroDataInicio, filtroDataFim, filtroMotoboyId]);

  // ---- totais gerais ----
  const totaisGerais = useMemo(
    () =>
      entregasFiltradas.reduce(
        (acc, e) => ({
          entregas: acc.entregas + 1,
          dinheiro: acc.dinheiro + e.dinheiro,
          cartao: acc.cartao + e.cartao,
          taxasPedidos: acc.taxasPedidos + e.taxaPedido,
          taxaFixaTotal: acc.taxaFixaTotal + taxaFixa,
        }),
        { entregas: 0, dinheiro: 0, cartao: 0, taxasPedidos: 0, taxaFixaTotal: 0 }
      ),
    [entregasFiltradas, taxaFixa]
  );

  // ---- resumo por motoboy ----
  const resumoPorMotoboy = useMemo(() => {
    const map: Record<
      string,
      {
        motoboy: Motoboy;
        entregas: number;
        dinheiro: number;
        cartao: number;
        taxasPedidos: number;
        taxaFixaTotal: number;
        saldoParaPadaria: number;
        pagamentoParaMotoboy: number;
      }
    > = {};

    entregasFiltradas.forEach((e) => {
      if (!map[e.motoboyId]) {
        const mb = motoboys.find((m) => m.id === e.motoboyId);
        if (!mb) return;
        map[e.motoboyId] = {
          motoboy: mb,
          entregas: 0,
          dinheiro: 0,
          cartao: 0,
          taxasPedidos: 0,
          taxaFixaTotal: 0,
          saldoParaPadaria: 0,
          pagamentoParaMotoboy: 0,
        };
      }
      map[e.motoboyId].entregas += 1;
      map[e.motoboyId].dinheiro += e.dinheiro;
      map[e.motoboyId].cartao += e.cartao;
      map[e.motoboyId].taxasPedidos += e.taxaPedido;
      map[e.motoboyId].taxaFixaTotal += taxaFixa;
    });

    Object.values(map).forEach((r) => {
      r.saldoParaPadaria = r.dinheiro + r.cartao;
      r.pagamentoParaMotoboy = r.taxaFixaTotal + r.taxasPedidos;
    });

    return Object.values(map).sort((a, b) =>
      a.motoboy.nome.localeCompare(b.motoboy.nome)
    );
  }, [entregasFiltradas, motoboys, taxaFixa]);

  // ---- CRUD Motoboy ----
  function abrirFormMotoboy(mb?: Motoboy) {
    setEditandoMotoboy(mb || null);
    setNomeMotoboy(mb?.nome || "");
    setStatusMotoboy(mb?.status || "ativo");
    setMostrarFormMotoboy(true);
  }

  async function salvarMotoboy() {
    if (!nomeMotoboy.trim()) {
      toast.error("Informe o nome do motoboy");
      return;
    }
    try {
      if (editandoMotoboy) {
        const at = await motoboyAPI.atualizar(editandoMotoboy.id, {
          nome: nomeMotoboy.trim(),
          status: statusMotoboy,
        });
        setMotoboys((p) => p.map((m) => (m.id === at.id ? at : m)));
        toast.success("Motoboy atualizado!");
      } else {
        const novo = await motoboyAPI.criar({ nome: nomeMotoboy.trim(), status: statusMotoboy });
        setMotoboys((p) => [...p, novo]);
        toast.success("Motoboy cadastrado!");
      }
      setMostrarFormMotoboy(false);
    } catch {
      toast.error("Erro ao salvar motoboy");
    }
  }

  async function excluirMotoboy(id: string) {
    try {
      await motoboyAPI.excluir(id);
      setMotoboys((p) => p.filter((m) => m.id !== id));
      setExcluindoMotoboyId(null);
      toast.success("Motoboy removido!");
    } catch {
      toast.error("Erro ao excluir motoboy");
    }
  }

  // ---- Modal entrega ----
  function abrirModalNovo() {
    setEditandoEntrega(null);
    setModalData(dataHoje());
    setModalPedido("");
    setModalDinheiro("");
    setModalCartao("");
    setModalTaxaPedido("");
    setModalObs("");
    setMostrarModal(true);
    // se motoboy já está fixo, dispara foco no pedido após render
    if (modalMotoboyId) {
      setPedirFocoPedido((n) => n + 1);
    }
  }

  function abrirModalEditar(entrega: EntregaDelivery) {
    setEditandoEntrega(entrega);
    setModalMotoboyId(entrega.motoboyId);
    setModalData(entrega.data);
    setModalPedido(entrega.numeroPedido);
    setModalDinheiro(entrega.dinheiro > 0 ? entrega.dinheiro.toString() : "");
    setModalCartao(entrega.cartao > 0 ? entrega.cartao.toString() : "");
    setModalTaxaPedido(entrega.taxaPedido > 0 ? entrega.taxaPedido.toString() : "");
    setModalObs(entrega.observacoes);
    setMostrarModal(true);
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditandoEntrega(null);
  }

  // Limpa campos para próximo lançamento, mantendo motoboy e data
  function limparParaProximo() {
    setModalPedido("");
    setModalDinheiro("");
    setModalCartao("");
    setModalTaxaPedido("");
    setModalObs("");
    // dispara foco no Nº Pedido APÓS o React re-renderizar com os campos limpos
    setPedirFocoPedido((n) => n + 1);
  }

  const parseMoeda = (s: string) => {
    // aceita vírgula ou ponto como separador decimal
    const norm = s.replace(",", ".");
    const v = parseFloat(norm);
    return isNaN(v) ? 0 : Math.max(0, v);
  };

  const construirPayload = useCallback((): Omit<EntregaDelivery, "id"> | null => {
    if (!modalMotoboyId) {
      toast.error("Selecione o motoboy");
      return null;
    }
    if (!modalData) {
      toast.error("Informe a data");
      return null;
    }
    if (!modalPedido.trim()) {
      toast.error("Número do Pedido é obrigatório");
      refPedido.current?.focus();
      return null;
    }
    const din = parseMoeda(modalDinheiro);
    const car = parseMoeda(modalCartao);
    const tax = parseMoeda(modalTaxaPedido);
    if (din === 0 && car === 0 && tax === 0) {
      toast.error("Preencha os dados obrigatórios antes de continuar: informe Dinheiro, Cartão ou Taxa do Pedido");
      refDinheiro.current?.focus();
      return null;
    }
    const motoboy = motoboys.find((m) => m.id === modalMotoboyId);
    if (!motoboy) return null;
    return {
      motoboyId: modalMotoboyId,
      motoboyNome: motoboy.nome,
      data: modalData,
      numeroPedido: modalPedido.trim(),
      dinheiro: din,
      cartao: car,
      taxaPedido: tax,
      observacoes: modalObs.trim(),
    };
  }, [modalMotoboyId, modalData, modalPedido, modalDinheiro, modalCartao, modalTaxaPedido, modalObs, motoboys]);

  async function salvarEntrega() {
    const payload = construirPayload();
    if (!payload) return;
    setSalvando(true);
    try {
      if (editandoEntrega) {
        const at = await entregasDeliveryAPI.atualizar(editandoEntrega.id, payload);
        setEntregas((p) => p.map((e) => (e.id === at.id ? at : e)));
        toast.success("Entrega atualizada!");
        fecharModal();
      } else {
        const nova = await entregasDeliveryAPI.criar(payload);
        setEntregas((p) => [...p, nova]);
        toast.success("Entrega salva!");
        fecharModal();
      }
    } catch {
      toast.error("Erro ao salvar entrega");
    } finally {
      setSalvando(false);
    }
  }

  // Salva e imediatamente abre para próximo lançamento (motoboy fixo)
  async function salvarEContinuar() {
    const payload = construirPayload();
    if (!payload) return;
    setSalvando(true);
    try {
      const nova = await entregasDeliveryAPI.criar(payload);
      setEntregas((p) => [...p, nova]);
      toast.success(`Entrega #${payload.numeroPedido || "—"} lançada! Continue digitando.`);
      limparParaProximo();
    } catch {
      toast.error("Erro ao salvar entrega");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirEntrega(id: string) {
    try {
      await entregasDeliveryAPI.excluir(id);
      setEntregas((p) => p.filter((e) => e.id !== id));
      setExcluindoEntregaId(null);
      toast.success("Entrega excluída!");
    } catch {
      toast.error("Erro ao excluir entrega");
    }
  }

  // ---- Taxa fixa ----
  function salvarTaxaFixa() {
    const nova = parseFloat(taxaTemp);
    if (isNaN(nova) || nova < 0) {
      toast.error("Valor inválido para taxa fixa");
      return;
    }
    deliveryConfigAPI.salvarTaxaFixa(nova);
    setTaxaFixa(nova);
    setEditandoTaxa(false);
    toast.success("Taxa fixa atualizada!");
  }

  const motoboyAtivos = motoboys.filter((m) => m.status === "ativo");

  // ---- entradas ordenadas para tabela ----
  const entregasOrdenadas = useMemo(
    () =>
      entregasFiltradas.slice().sort((a, b) => {
        if (b.data !== a.data) return b.data.localeCompare(a.data);
        return a.motoboyNome.localeCompare(b.motoboyNome);
      }),
    [entregasFiltradas]
  );

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Bike className="w-12 h-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Carregando Delivery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ===== CABEÇALHO ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bike className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Delivery</h1>
            <p className="text-sm text-muted-foreground">
              Controle de motoboys e entregas
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              abrirModalNovo();
              setAba("lancamentos");
            }}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Nova Entrega
          </Button>
        </div>
      </div>

      {/* ===== FILTROS ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Botões de período */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Período
              </Label>
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    { key: "dia", label: "Hoje" },
                    { key: "semana", label: "Semana" },
                    { key: "mes", label: "Mês" },
                    { key: "personalizado", label: "Personalizado" },
                  ] as { key: Periodo; label: string }[]
                ).map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={periodo === p.key ? "default" : "outline"}
                    onClick={() => setPeriodo(p.key)}
                    className="h-8 text-xs"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Datas personalizadas */}
            {periodo === "personalizado" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="h-8 text-sm w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="h-8 text-sm w-36"
                  />
                </div>
              </>
            )}

            {/* Filtro motoboy */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Motoboy
              </Label>
              <Select value={filtroMotoboyId} onValueChange={setFiltroMotoboyId}>
                <SelectTrigger className="h-8 text-sm w-44">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os motoboys</SelectItem>
                  {motoboys.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Indicador de período ativo */}
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm font-semibold">
                {periodo === "dia"
                  ? formatarDataBR(filtroDataInicio)
                  : `${formatarDataBR(filtroDataInicio)} → ${formatarDataBR(filtroDataFim)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== DASHBOARD – CARDS TOTAIS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{totaisGerais.entregas}</p>
            <p className="text-xs text-muted-foreground">Entregas</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-base font-bold text-green-700 dark:text-green-400">
              {fmt(totaisGerais.dinheiro)}
            </p>
            <p className="text-xs text-muted-foreground">Dinheiro</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-base font-bold text-blue-700 dark:text-blue-400">
              {fmt(totaisGerais.cartao)}
            </p>
            <p className="text-xs text-muted-foreground">Cartão</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-base font-bold text-orange-700 dark:text-orange-400">
              {fmt(totaisGerais.taxasPedidos)}
            </p>
            <p className="text-xs text-muted-foreground">Taxas Pedidos</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <p className="text-base font-bold text-purple-700 dark:text-purple-400">
              {fmt(totaisGerais.dinheiro + totaisGerais.cartao)}
            </p>
            <p className="text-xs text-muted-foreground">Total Recebido</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== ABAS ===== */}
      <div className="flex gap-0 border-b">
        {(
          [
            { key: "lancamentos", label: "📦 Lançamentos" },
            { key: "resumo", label: "📊 Resumo Financeiro" },
            { key: "motoboys", label: "🏍️ Motoboys" },
          ] as { key: Aba; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAba(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              aba === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== ABA LANÇAMENTOS ===== */}
      {aba === "lancamentos" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Entregas do Período</span>
              <span className="text-sm font-normal text-muted-foreground">
                {entregasFiltradas.length} registro(s)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {entregasOrdenadas.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground space-y-3">
                <Bike className="w-12 h-12 mx-auto opacity-20" />
                <p>Nenhuma entrega no período selecionado.</p>
                <Button className="gap-2 mt-2" onClick={() => abrirModalNovo()}>
                  <Zap className="w-4 h-4" />
                  Lançar Primeira Entrega
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-semibold">Motoboy</th>
                      <th className="text-left p-3 font-semibold">Data</th>
                      <th className="text-left p-3 font-semibold">Pedido</th>
                      <th className="text-right p-3 font-semibold">Dinheiro</th>
                      <th className="text-right p-3 font-semibold">Cartão</th>
                      <th className="text-right p-3 font-semibold">Taxa</th>
                      <th className="text-left p-3 font-semibold">Obs</th>
                      <th className="text-center p-3 font-semibold w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entregasOrdenadas.map((e) => (
                      <tr key={e.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{e.motoboyNome}</td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatarDataBR(e.data)}
                        </td>
                        <td className="p-3">{e.numeroPedido || "-"}</td>
                        <td className="p-3 text-right font-medium text-green-700 dark:text-green-400">
                          {e.dinheiro > 0 ? fmt(e.dinheiro) : "-"}
                        </td>
                        <td className="p-3 text-right font-medium text-blue-700 dark:text-blue-400">
                          {e.cartao > 0 ? fmt(e.cartao) : "-"}
                        </td>
                        <td className="p-3 text-right text-orange-700 dark:text-orange-400">
                          {e.taxaPedido > 0 ? fmt(e.taxaPedido) : "-"}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[120px] truncate">
                          {e.observacoes || "-"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModalEditar(e)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExcluindoEntregaId(e.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/60 border-t-2 font-semibold">
                    <tr>
                      <td className="p-3" colSpan={3}>
                        TOTAIS — {entregasFiltradas.length} entregas
                      </td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400">
                        {fmt(totaisGerais.dinheiro)}
                      </td>
                      <td className="p-3 text-right text-blue-700 dark:text-blue-400">
                        {fmt(totaisGerais.cartao)}
                      </td>
                      <td className="p-3 text-right text-orange-700 dark:text-orange-400">
                        {fmt(totaisGerais.taxasPedidos)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== ABA RESUMO FINANCEIRO ===== */}
      {aba === "resumo" && (
        <div className="space-y-4">
          {/* Taxa fixa */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Taxa Fixa por Entrega:</span>
                  {editandoTaxa ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxaTemp}
                        onChange={(e) => setTaxaTemp(e.target.value)}
                        className="h-7 w-24 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") salvarTaxaFixa();
                          if (e.key === "Escape") setEditandoTaxa(false);
                        }}
                      />
                      <Button size="sm" className="h-7 w-7 p-0" onClick={salvarTaxaFixa}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setEditandoTaxa(false)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-bold text-primary">{fmt(taxaFixa)}</span>
                  )}
                </div>
                {!editandoTaxa && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      setTaxaTemp(taxaFixa.toString());
                      setEditandoTaxa(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                    Alterar Taxa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {resumoPorMotoboy.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                <Bike className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum dado no período selecionado.</p>
              </CardContent>
            </Card>
          ) : (
            resumoPorMotoboy.map((r) => {
              const aberto = resumoAbertos[r.motoboy.id] !== false;
              return (
                <Card key={r.motoboy.id} className="overflow-hidden border-2">
                  <button
                    className="w-full"
                    onClick={() =>
                      setResumoAbertos((p) => ({ ...p, [r.motoboy.id]: !aberto }))
                    }
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{r.motoboy.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.entregas} entrega(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Recebido</p>
                          <p className="font-bold text-green-600">
                            {fmt(r.saldoParaPadaria)}
                          </p>
                        </div>
                        {aberto ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {aberto && (
                    <CardContent className="p-4 space-y-4">
                      {/* Detalhes */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Entregas</p>
                          <p className="text-xl font-bold text-primary">{r.entregas}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Dinheiro</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">
                            {fmt(r.dinheiro)}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Cartão</p>
                          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                            {fmt(r.cartao)}
                          </p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Taxas Pedidos</p>
                          <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                            {fmt(r.taxasPedidos)}
                          </p>
                        </div>
                      </div>

                      {/* Dois resultados principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-950/30 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <p className="font-bold text-sm text-green-800 dark:text-green-300 uppercase tracking-wide">
                              Valor que o Motoboy Devolve
                            </p>
                          </div>
                          <div className="space-y-1 text-sm mb-3">
                            <div className="flex justify-between text-green-700 dark:text-green-400">
                              <span>Dinheiro</span>
                              <span>{fmt(r.dinheiro)}</span>
                            </div>
                            <div className="flex justify-between text-green-700 dark:text-green-400">
                              <span>Cartão</span>
                              <span>{fmt(r.cartao)}</span>
                            </div>
                          </div>
                          <div className="border-t border-green-300 pt-2 flex justify-between items-center">
                            <span className="font-bold text-green-800 dark:text-green-300 text-sm">
                              SALDO PARA A PADARIA
                            </span>
                            <span className="text-xl font-bold text-green-700 dark:text-green-300">
                              {fmt(r.saldoParaPadaria)}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            <p className="font-bold text-sm text-red-800 dark:text-red-300 uppercase tracking-wide">
                              Valor que a Padaria Deve Pagar
                            </p>
                          </div>
                          <div className="space-y-1 text-sm mb-3">
                            <div className="flex justify-between text-red-700 dark:text-red-400">
                              <span>
                                Taxa Fixa ({r.entregas} × {fmt(taxaFixa)})
                              </span>
                              <span>{fmt(r.taxaFixaTotal)}</span>
                            </div>
                            <div className="flex justify-between text-red-700 dark:text-red-400">
                              <span>Taxas dos Pedidos</span>
                              <span>{fmt(r.taxasPedidos)}</span>
                            </div>
                          </div>
                          <div className="border-t border-red-300 pt-2 flex justify-between items-center">
                            <span className="font-bold text-red-800 dark:text-red-300 text-sm">
                              PAGAMENTO AO MOTOBOY
                            </span>
                            <span className="text-xl font-bold text-red-700 dark:text-red-300">
                              {fmt(r.pagamentoParaMotoboy)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ===== ABA MOTOBOYS ===== */}
      {aba === "motoboys" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Cadastro de Motoboys</span>
              <Button size="sm" onClick={() => abrirFormMotoboy()} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Novo Motoboy
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostrarFormMotoboy && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
                <h3 className="font-semibold text-sm">
                  {editandoMotoboy ? "Editar Motoboy" : "Novo Motoboy"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label>Nome</Label>
                    <Input
                      value={nomeMotoboy}
                      onChange={(e) => setNomeMotoboy(e.target.value)}
                      placeholder="Nome do motoboy"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") salvarMotoboy();
                        if (e.key === "Escape") setMostrarFormMotoboy(false);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={statusMotoboy}
                      onValueChange={(v) => setStatusMotoboy(v as "ativo" | "inativo")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={salvarMotoboy} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setMostrarFormMotoboy(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {motoboys.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Bike className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>Nenhum motoboy cadastrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {motoboys
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{m.nome}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.status === "ativo"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirFormMotoboy(m)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExcluindoMotoboyId(m.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== MODAL – LANÇAMENTO RÁPIDO ===== */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>
                    {editandoEntrega ? "Editar Entrega" : "Lançamento Rápido"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={fecharModal}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
              {!editandoEntrega && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Enter</kbd> para avançar. No campo Taxa, Enter aciona <strong>Nova Entrega</strong> automaticamente.
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* 1. Motoboy */}
              <div className="space-y-1">
                <Label className="text-sm font-semibold">
                  Motoboy *
                  {!editandoEntrega && modalMotoboyId && (
                    <span className="ml-2 text-xs font-normal text-primary">
                      (fixo durante sequência)
                    </span>
                  )}
                </Label>
                <Select
                  value={modalMotoboyId}
                  onValueChange={(v) => {
                    setModalMotoboyId(v);
                    // após selecionar motoboy, foca direto no Nº Pedido
                    requestAnimationFrame(() => {
                      refPedido.current?.focus();
                      refPedido.current?.select();
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motoboy" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoboyAtivos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Data */}
              <div className="space-y-1">
                <Label className="text-sm">Data *</Label>
                <Input
                  ref={refData}
                  type="date"
                  value={modalData}
                  onChange={(e) => setModalData(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ir(refPedido); }
                  }}
                />
              </div>

              {/* 3. Nº Pedido */}
              <div className="space-y-1">
                <Label className="text-sm">
                  Nº Pedido <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={refPedido}
                  value={modalPedido}
                  onChange={(e) => setModalPedido(e.target.value)}
                  placeholder="001"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ir(refDinheiro); }
                  }}
                />
              </div>

              {/* 4+5. Dinheiro + Cartão */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm text-green-700 dark:text-green-400">
                    💵 Dinheiro (R$)
                  </Label>
                  <Input
                    ref={refDinheiro}
                    type="text"
                    inputMode="decimal"
                    value={modalDinheiro}
                    onChange={(e) => setModalDinheiro(e.target.value)}
                    placeholder="0,00"
                    autoComplete="off"
                    className="border-green-300 focus:border-green-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ir(refCartao); }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-blue-700 dark:text-blue-400">
                    💳 Cartão (R$)
                  </Label>
                  <Input
                    ref={refCartao}
                    type="text"
                    inputMode="decimal"
                    value={modalCartao}
                    onChange={(e) => setModalCartao(e.target.value)}
                    placeholder="0,00"
                    autoComplete="off"
                    className="border-blue-300 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ir(refTaxa); }
                    }}
                  />
                </div>
              </div>

              {/* 6. Taxa do Pedido */}
              <div className="space-y-1">
                <Label className="text-sm">Taxa do Pedido (R$)</Label>
                <Input
                  ref={refTaxa}
                  type="text"
                  inputMode="decimal"
                  value={modalTaxaPedido}
                  onChange={(e) => setModalTaxaPedido(e.target.value)}
                  placeholder="0,00"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ir(refObs); }
                  }}
                />
              </div>

              {/* 7. Observações */}
              <div className="space-y-1">
                <Label className="text-sm">Observações</Label>
                <Input
                  ref={refObs}
                  value={modalObs}
                  onChange={(e) => setModalObs(e.target.value)}
                  placeholder="Opcional"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      editandoEntrega ? salvarEntrega() : salvarEContinuar();
                    }
                  }}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                {!editandoEntrega ? (
                  <>
                    <Button
                      onClick={salvarEContinuar}
                      disabled={salvando}
                      className="flex-1 gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Nova Entrega
                    </Button>
                    <Button
                      onClick={salvarEntrega}
                      disabled={salvando}
                      variant="outline"
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar e Fechar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={salvarEntrega}
                      disabled={salvando}
                      className="flex-1 gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={fecharModal}>
                      Cancelar
                    </Button>
                  </>
                )}
              </div>

              {!editandoEntrega && (
                <p className="text-xs text-center text-muted-foreground">
                  Enter avança campo a campo → Obs Enter aciona <strong>Nova Entrega</strong>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== CONFIRM – EXCLUIR ENTREGA ===== */}
      <AlertDialog
        open={!!excluindoEntregaId}
        onOpenChange={(o) => !o && setExcluindoEntregaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluindoEntregaId && excluirEntrega(excluindoEntregaId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== CONFIRM – EXCLUIR MOTOBOY ===== */}
      <AlertDialog
        open={!!excluindoMotoboyId}
        onOpenChange={(o) => !o && setExcluindoMotoboyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir motoboy?</AlertDialogTitle>
            <AlertDialogDescription>
              As entregas associadas permanecerão no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluindoMotoboyId && excluirMotoboy(excluindoMotoboyId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
