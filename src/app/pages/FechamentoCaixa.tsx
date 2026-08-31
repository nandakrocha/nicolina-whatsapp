import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "../components/ui/card";
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
import { Plus, Trash2, Save, CheckCircle2, Printer, History, ChevronDown, ChevronUp, Search, Settings, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  funcionarioFechamentoAPI,
  motoboyFechamentoAPI,
  fechamentoDiarioAPI,
  type FuncionarioFechamento,
  type MotoboyFechamento,
  type DadosFechamentoDiario,
  type LinhaDeliveryFechamento,
  type LinhaPagamentoFechamento,
} from "../services/api";

// ─── Constantes ─────────────────────────────────────────────────────────────

const NOTAS = [
  { valor: 2, label: "R$ 2" },
  { valor: 5, label: "R$ 5" },
  { valor: 10, label: "R$ 10" },
  { valor: 20, label: "R$ 20" },
  { valor: 50, label: "R$ 50" },
  { valor: 100, label: "R$ 100" },
];

const MOEDAS = [
  { valor: 0.05, label: "R$ 0,05" },
  { valor: 0.1, label: "R$ 0,10" },
  { valor: 0.25, label: "R$ 0,25" },
  { valor: 0.5, label: "R$ 0,50" },
  { valor: 1.0, label: "R$ 1,00" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  (v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const gerarId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ID único para cada fechamento — sem traços para que salvar() use como chave direta no Firebase
// (a API converte IDs com traços para o formato de data; sem traços usa o ID como está)
const gerarNovoFechamentoId = () =>
  `fch${Date.now()}${Math.random().toString(36).substr(2, 8)}`;

const linhaVazia = (): LinhaPagamentoFechamento => ({
  id: gerarId(),
  descricao: "",
  valor: 0,
});

const entregaVazia = (): LinhaDeliveryFechamento => ({
  id: gerarId(),
  comanda: "",
  dinheiro: 0,
  cartao: 0,
  taxa: 0,
});

// Avança para o próximo elemento [data-nav] ao pressionar Enter
const navNext = (e: React.KeyboardEvent) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const els = Array.from(
    document.querySelectorAll("[data-nav]")
  ) as HTMLElement[];
  const idx = els.indexOf(e.currentTarget as HTMLElement);
  if (idx >= 0 && idx < els.length - 1) els[idx + 1].focus();
};

// ─── InputBRL — Entrada monetária (pinhole cents) ─────────────────────────────

const InputBRL = React.forwardRef<
  HTMLInputElement,
  {
    value: number;
    onChange: (v: number) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    "data-nav"?: string;
    placeholder?: string;
  }
>(({ value, onChange, onKeyDown, className, placeholder = "0,00", ...rest }, ref) => {
  const [cents, setCents] = useState(() => Math.round((value || 0) * 100));
  const focused = React.useRef(false);

  useEffect(() => {
    if (!focused.current) setCents(Math.round((value || 0) * 100));
  }, [value]);

  const display = useMemo(
    () =>
      cents === 0
        ? ""
        : (cents / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
    [cents]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const n = Math.min(cents * 10 + parseInt(e.key, 10), 999999999);
      setCents(n);
      onChange(n / 100);
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const n = Math.floor(cents / 10);
      setCents(n);
      onChange(n / 100);
      return;
    }
    if (e.key === "Delete") {
      e.preventDefault();
      setCents(0);
      onChange(0);
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <Input
      ref={ref}
      value={display}
      placeholder={placeholder}
      readOnly
      onKeyDown={handleKeyDown}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
      }}
      className={className}
      style={{ cursor: "text" }}
      {...rest}
    />
  );
});
InputBRL.displayName = "InputBRL";

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  title,
  total,
}: {
  emoji: string;
  title: string;
  total?: string;
}) {
  return (
    <div className="flex items-center justify-between pb-2 border-b mb-4">
      <h2 className="text-base font-bold flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h2>
      {total !== undefined && (
        <span className="text-base font-bold text-primary">R$ {total}</span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FechamentoCaixa() {
  const hoje = new Date().toISOString().split("T")[0];

  // Identificação
  const [data, setData] = useState(hoje);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [motoboyId, setMotoboyId] = useState("");
  const [funcionarios, setFuncionarios] = useState<FuncionarioFechamento[]>([]);
  const [motoboys, setMotoboys] = useState<MotoboyFechamento[]>([]);

  // Caixa
  const [moedas, setMoedas] = useState<number[]>(Array(5).fill(0));
  const [notas, setNotas] = useState<number[]>(Array(6).fill(0));
  const [moedasVariadas, setMoedasVariadas] = useState(0);

  // Pagamentos e Sangrias
  const [pagamentos, setPagamentos] = useState<LinhaPagamentoFechamento[]>([
    linhaVazia(),
  ]);
  const [sangrias, setSangrias] = useState<LinhaPagamentoFechamento[]>([
    linhaVazia(),
  ]);
  const [obsPagamentos, setObsPagamentos] = useState("");

  // Delivery
  const [deliveryMotoboyId, setDeliveryMotoboyId] = useState("");
  const [deliveryLinhas, setDeliveryLinhas] = useState<
    LinhaDeliveryFechamento[]
  >([entregaVazia()]);
  const [taxaFixa, setTaxaFixa] = useState(0);
  const [obsDelivery, setObsDelivery] = useState("");

  // Geral
  const [obsGeral, setObsGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [fechamentoId, setFechamentoId] = useState<string>(() => gerarNovoFechamentoId());

  // ── Refs para navegação via teclado ────────────────────────────────────────

  // delivery: [linha][coluna] — 0=comanda, 1=cartao, 2=dinheiro, 3=taxa
  const deliveryRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const pendingDeliveryFocus = useRef<number | null>(null);

  // pagamentos: [linha][0=descricao, 1=valor]
  const pagamentosRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const pendingPagFocus = useRef<number | null>(null);

  // sangrias: [linha][0=descricao, 1=valor]
  const sangriasRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const pendingSanFocus = useRef<number | null>(null);

  // ── Auto-save e controle de inicialização ──────────────────────────────────
  const isLoadedRef = useRef(false);
  const criadoEmRef = useRef("");
  const skipNextLoad = useRef(false); // evita reload quando carregarNoForm já preencheu o estado
  // Sincronização em tempo real: conta quantos callbacks do Firebase são ecos das nossas próprias saves
  const skipRemoteCount = useRef(0);
  // Verdadeiro enquanto aplicamos dados remotos; impede que o auto-save dispare nesse momento
  const isApplyingRemote = useRef(false);

  // ── Histórico e consulta ───────────────────────────────────────────────────
  const [historico, setHistorico] = useState<DadosFechamentoDiario[]>([]);
  const [historicoExpandido, setHistoricoExpandido] = useState(false);
  const [filtroHistData, setFiltroHistData] = useState({ inicio: "", fim: "" });
  const [filtroConferido, setFiltroConferido] = useState<"todos" | "nao_conferido" | "conferido">("todos");
  const [registroAberto, setRegistroAberto] = useState<DadosFechamentoDiario | null>(null);
  const [confirmarExcluirFechId, setConfirmarExcluirFechId] = useState<string | null>(null);
  const [statusAtual, setStatusAtual] = useState<"em_andamento" | "finalizado">("em_andamento");

  // ── Cadastro de funcionários e motoboys ────────────────────────────────────
  const [dialogCadastro, setDialogCadastro] = useState<"funcionario" | "motoboy" | null>(null);
  const [cadastroItems, setCadastroItems] = useState<Array<{ id: string; nome: string; ativo: boolean }>>([]);
  const [novoNomeCad, setNovoNomeCad] = useState("");
  const [editandoCad, setEditandoCad] = useState<{ id: string; nome: string } | null>(null);
  const [confirmExclusao, setConfirmExclusao] = useState<string | null>(null);
  const [salvandoCad, setSalvandoCad] = useState(false);

  // ── Carregar listas e dados existentes ──────────────────────────────────────

  const recarregarHistorico = () => {
    fechamentoDiarioAPI.listarTodos().then((lista) =>
      setHistorico(lista.sort((a, b) => (b.data || "").localeCompare(a.data || "")))
    );
  };

  // Carrega um registro do histórico diretamente nos campos do formulário
  const carregarNoForm = (r: DadosFechamentoDiario) => {
    isLoadedRef.current = false;
    skipNextLoad.current = true; // impede que useEffect([data]) sobrescreva o que vamos setar
    setData(r.data);
    setFechamentoId(r.id);
    criadoEmRef.current = r.criadoEm || "";
    setFuncionarioId(r.funcionarioId || "");
    setMotoboyId(r.motoboyId || "");
    const m = r.caixa?.moedas ?? [];
    const n = r.caixa?.notas  ?? [];
    setMoedas(m.length === 5 ? m : Array(5).fill(0));
    setNotas(n.length === 6 ? n : Array(6).fill(0));
    setMoedasVariadas(r.caixa?.moedasVariadas || 0);
    setPagamentos((r.pagamentos || []).length ? r.pagamentos : [linhaVazia()]);
    setSangrias((r.sangrias   || []).length ? r.sangrias   : [linhaVazia()]);
    setObsPagamentos(r.observacaoPagamentos || "");
    setDeliveryMotoboyId(r.delivery?.motoboyId || "");
    setDeliveryLinhas((r.delivery?.linhas || []).length ? r.delivery.linhas : [entregaVazia()]);
    setTaxaFixa(r.delivery?.taxaFixa || 0);
    setObsDelivery(r.delivery?.observacao || "");
    setObsGeral("");
    setStatusAtual(r.status || "em_andamento");
    setRegistroAberto(null);
    setConfirmarExcluirFechId(null);
    setTimeout(() => { isLoadedRef.current = true; }, 300);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const excluirFechamento = async (id: string) => {
    try {
      await fechamentoDiarioAPI.excluirPorId(id);
      setConfirmarExcluirFechId(null);
      setRegistroAberto(null);
      recarregarHistorico();
      toast.success("Fechamento excluído.");
    } catch {
      toast.error("Erro ao excluir fechamento.");
    }
  };

  // Marca/desmarca conferência — usa update() para não sobrescrever nenhum dado do fechamento
  const alterarConferido = async (id: string, valor: boolean) => {
    try {
      await fechamentoDiarioAPI.marcarConferido(id, valor);
      // observarTodos() atualiza o historico automaticamente em tempo real
    } catch {
      toast.error("Erro ao salvar conferência.");
    }
  };

  useEffect(() => {
    funcionarioFechamentoAPI
      .listar()
      .then((lista) => setFuncionarios(lista.filter((f) => f.ativo)));
    motoboyFechamentoAPI
      .listar()
      .then((lista) => setMotoboys(lista.filter((m) => m.ativo)));
    // Histórico em tempo real: qualquer alteração no Firebase atualiza a lista automaticamente
    const unsubHist = fechamentoDiarioAPI.observarTodos((lista) =>
      setHistorico(lista.sort((a, b) => (b.data || "").localeCompare(a.data || "")))
    );
    return unsubHist;
  }, []);

  useEffect(() => {
    if (!data) return;
    if (skipNextLoad.current) { skipNextLoad.current = false; return; }
    isLoadedRef.current = false;
    // Busca todos os registros para esta data e carrega o mais recente em_andamento.
    // NÃO usa carregar(data) porque a chave no Firebase é o ID único, não a data.
    fechamentoDiarioAPI.listarTodos().then((todos) => {
      const d = todos
        .filter((r) => r.data === data && r.status === "em_andamento")
        .sort((a, b) => (b.atualizadoEm || "").localeCompare(a.atualizadoEm || ""))[0] ?? null;
      if (!d) {
        setFechamentoId(gerarNovoFechamentoId());
        criadoEmRef.current = "";
        setFuncionarioId("");
        setMotoboyId("");
        setMoedas(Array(5).fill(0));
        setNotas(Array(6).fill(0));
        setMoedasVariadas(0);
        setPagamentos([linhaVazia()]);
        setSangrias([linhaVazia()]);
        setObsPagamentos("");
        setDeliveryMotoboyId("");
        setDeliveryLinhas([entregaVazia()]);
        setTaxaFixa(0);
        setObsDelivery("");
        setObsGeral("");
        setStatusAtual("em_andamento");
      } else {
        setFechamentoId(d.id);
        criadoEmRef.current = d.criadoEm;
        setFuncionarioId(d.funcionarioId);
        setMotoboyId(d.motoboyId);
        setMoedas(d.caixa.moedas.length === 5 ? d.caixa.moedas : Array(5).fill(0));
        setNotas(d.caixa.notas.length === 6 ? d.caixa.notas : Array(6).fill(0));
        setMoedasVariadas(d.caixa.moedasVariadas || 0);
        setPagamentos(d.pagamentos.length ? d.pagamentos : [linhaVazia()]);
        setSangrias(d.sangrias.length ? d.sangrias : [linhaVazia()]);
        setObsPagamentos(d.observacaoPagamentos || "");
        setDeliveryMotoboyId(d.delivery.motoboyId);
        setDeliveryLinhas(d.delivery.linhas.length ? d.delivery.linhas : [entregaVazia()]);
        setTaxaFixa(d.delivery.taxaFixa || 0);
        setObsDelivery(d.delivery.observacao || "");
        setStatusAtual(d.status);
      }
      setTimeout(() => { isLoadedRef.current = true; }, 250);
    });
  }, [data]);

  // ── Sincronização em tempo real do fechamento aberto ──────────────────────
  // Usa observarPorId(fechamentoId) — segue o REGISTRO ESPECÍFICO, não a data.
  // Com IDs únicos, cada fechamento tem seu próprio nó no Firebase; nunca haverá colisão.
  // Lógica anti-loop: skipRemoteCount descarta os ecos das nossas próprias saves.
  useEffect(() => {
    if (!fechamentoId) return;
    const unsubscribe = fechamentoDiarioAPI.observarPorId(fechamentoId, (d) => {
      // Ainda carregando: aguarda o useEffect([data]) de cima terminar
      if (!isLoadedRef.current) return;
      // Eco do nosso próprio save: descarta
      if (skipRemoteCount.current > 0) { skipRemoteCount.current--; return; }
      // Nó ainda não existe no Firebase (novo fechamento não salvo) — ignora
      if (!d) return;
      // Aplica dados remotos no estado local (atualização de outro computador)
      isApplyingRemote.current = true;
      criadoEmRef.current = d.criadoEm || "";
      setFuncionarioId(d.funcionarioId || "");
      setMotoboyId(d.motoboyId || "");
      setMoedas(d.caixa?.moedas?.length === 5 ? d.caixa.moedas : Array(5).fill(0));
      setNotas(d.caixa?.notas?.length === 6 ? d.caixa.notas : Array(6).fill(0));
      setMoedasVariadas(d.caixa?.moedasVariadas || 0);
      setPagamentos((d.pagamentos || []).length ? d.pagamentos : [linhaVazia()]);
      setSangrias((d.sangrias || []).length ? d.sangrias : [linhaVazia()]);
      setObsPagamentos(d.observacaoPagamentos || "");
      setDeliveryMotoboyId(d.delivery?.motoboyId || "");
      setDeliveryLinhas((d.delivery?.linhas || []).length ? d.delivery.linhas : [entregaVazia()]);
      setTaxaFixa(d.delivery?.taxaFixa || 0);
      setObsDelivery(d.delivery?.observacao || "");
      setStatusAtual(d.status || "em_andamento");
      setTimeout(() => { isApplyingRemote.current = false; }, 400);
    });
    return unsubscribe;
  }, [fechamentoId]);

  // ── Foco pendente após adicionar linhas ────────────────────────────────────

  useEffect(() => {
    if (pendingDeliveryFocus.current === null) return;
    const row = pendingDeliveryFocus.current;
    pendingDeliveryFocus.current = null;
    requestAnimationFrame(() => deliveryRefs.current[row]?.[0]?.focus());
  }, [deliveryLinhas.length]);

  useEffect(() => {
    if (pendingPagFocus.current === null) return;
    const row = pendingPagFocus.current;
    pendingPagFocus.current = null;
    requestAnimationFrame(() => pagamentosRefs.current[row]?.[0]?.focus());
  }, [pagamentos.length]);

  useEffect(() => {
    if (pendingSanFocus.current === null) return;
    const row = pendingSanFocus.current;
    pendingSanFocus.current = null;
    requestAnimationFrame(() => sangriasRefs.current[row]?.[0]?.focus());
  }, [sangrias.length]);

  // ── Handlers de ENTER por seção ────────────────────────────────────────────

  // COMANDA → CARTÃO → DINHEIRO → TAXA → próxima linha (cria se necessário)
  const onDeliveryEnter = (rowIdx: number, colIdx: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (colIdx < 3) {
      deliveryRefs.current[rowIdx]?.[colIdx + 1]?.focus();
    } else {
      const nextRow = rowIdx + 1;
      if (nextRow < deliveryLinhas.length) {
        deliveryRefs.current[nextRow]?.[0]?.focus();
      } else {
        setDeliveryLinhas((prev) => [...prev, entregaVazia()]);
        pendingDeliveryFocus.current = nextRow;
      }
    }
  };

  // DESCRIÇÃO → VALOR → próxima linha de pagamento
  const onPagEnter = (rowIdx: number, colIdx: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (colIdx === 0) {
      pagamentosRefs.current[rowIdx]?.[1]?.focus();
    } else {
      const nextRow = rowIdx + 1;
      if (nextRow < pagamentos.length) {
        pagamentosRefs.current[nextRow]?.[0]?.focus();
      } else {
        setPagamentos((prev) => [...prev, linhaVazia()]);
        pendingPagFocus.current = nextRow;
      }
    }
  };

  // DESCRIÇÃO → VALOR → próxima linha de sangria
  const onSanEnter = (rowIdx: number, colIdx: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (colIdx === 0) {
      sangriasRefs.current[rowIdx]?.[1]?.focus();
    } else {
      const nextRow = rowIdx + 1;
      if (nextRow < sangrias.length) {
        sangriasRefs.current[nextRow]?.[0]?.focus();
      } else {
        setSangrias((prev) => [...prev, linhaVazia()]);
        pendingSanFocus.current = nextRow;
      }
    }
  };

  // ── Totais calculados ───────────────────────────────────────────────────────

  const totalMoedas = useMemo(
    () =>
      moedas.reduce((s, q, i) => s + q * MOEDAS[i].valor, 0) + moedasVariadas,
    [moedas, moedasVariadas]
  );

  const totalNotas = useMemo(
    () => notas.reduce((s, q, i) => s + q * NOTAS[i].valor, 0),
    [notas]
  );

  const totalCaixa = totalMoedas + totalNotas;

  const totalPagamentos = useMemo(
    () => pagamentos.reduce((s, p) => s + (p.valor || 0), 0),
    [pagamentos]
  );

  const totalSangrias = useMemo(
    () => sangrias.reduce((s, x) => s + (x.valor || 0), 0),
    [sangrias]
  );

  const totalDelDinheiro = useMemo(
    () => deliveryLinhas.reduce((s, l) => s + (l.dinheiro || 0), 0),
    [deliveryLinhas]
  );

  const totalDelCartao = useMemo(
    () => deliveryLinhas.reduce((s, l) => s + (l.cartao || 0), 0),
    [deliveryLinhas]
  );

  const totalDelTaxa = useMemo(
    () => deliveryLinhas.reduce((s, l) => s + (l.taxa || 0), 0),
    [deliveryLinhas]
  );

  const totalDelivery = totalDelDinheiro + totalDelCartao;
  const totalTaxasGeral = totalDelTaxa + taxaFixa;
  const totalGeral = totalCaixa + totalPagamentos - totalSangrias;

  // ── Salvar ──────────────────────────────────────────────────────────────────

  // ── Cadastro CRUD ──────────────────────────────────────────────────────────

  const recarregarSelects = () => {
    funcionarioFechamentoAPI.listar().then((l) => setFuncionarios(l.filter((f) => f.ativo)));
    motoboyFechamentoAPI.listar().then((l) => setMotoboys(l.filter((m) => m.ativo)));
  };

  const abrirCadastro = async (tipo: "funcionario" | "motoboy") => {
    setDialogCadastro(tipo);
    setNovoNomeCad("");
    setEditandoCad(null);
    setConfirmExclusao(null);
    const lista =
      tipo === "funcionario"
        ? await funcionarioFechamentoAPI.listar()
        : await motoboyFechamentoAPI.listar();
    setCadastroItems(lista.sort((a, b) => a.nome.localeCompare(b.nome)));
  };

  const fecharCadastro = () => {
    setDialogCadastro(null);
    setEditandoCad(null);
    setNovoNomeCad("");
    setConfirmExclusao(null);
    recarregarSelects();
  };

  const adicionarCad = async () => {
    const nome = novoNomeCad.trim();
    if (!nome) return;
    setSalvandoCad(true);
    try {
      const novo =
        dialogCadastro === "funcionario"
          ? await funcionarioFechamentoAPI.criar({ nome, ativo: true })
          : await motoboyFechamentoAPI.criar({ nome, ativo: true });
      setCadastroItems((prev) =>
        [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setNovoNomeCad("");
    } catch {
      toast.error("Erro ao adicionar.");
    } finally {
      setSalvandoCad(false);
    }
  };

  const salvarEdicaoCad = async () => {
    const nome = editandoCad?.nome.trim();
    if (!nome || !editandoCad) return;
    setSalvandoCad(true);
    try {
      if (dialogCadastro === "funcionario") {
        await funcionarioFechamentoAPI.atualizar(editandoCad.id, { nome });
      } else {
        await motoboyFechamentoAPI.atualizar(editandoCad.id, { nome });
      }
      setCadastroItems((prev) =>
        prev
          .map((item) => (item.id === editandoCad.id ? { ...item, nome } : item))
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setEditandoCad(null);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSalvandoCad(false);
    }
  };

  const excluirCad = async (id: string) => {
    try {
      if (dialogCadastro === "funcionario") {
        await funcionarioFechamentoAPI.excluir(id);
      } else {
        await motoboyFechamentoAPI.excluir(id);
      }
      setCadastroItems((prev) => prev.filter((item) => item.id !== id));
      setConfirmExclusao(null);
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const buildPayload = (
    status: "em_andamento" | "finalizado"
  ): DadosFechamentoDiario => {
    const func = funcionarios.find((f) => f.id === funcionarioId);
    const moto = motoboys.find((m) => m.id === motoboyId);
    const delMoto = motoboys.find((m) => m.id === deliveryMotoboyId);
    const agora = new Date().toISOString();
    return {
      id: fechamentoId,
      data,
      funcionarioId,
      funcionarioNome: func?.nome || "",
      motoboyId,
      motoboyNome: moto?.nome || "",
      caixa: { notas, moedas, moedasVariadas, observacao: "" },
      pagamentos: pagamentos.filter((p) => p.descricao || p.valor),
      sangrias: sangrias.filter((s) => s.descricao || s.valor),
      observacaoPagamentos: obsPagamentos,
      delivery: {
        motoboyId: deliveryMotoboyId,
        motoboyNome: delMoto?.nome || "",
        linhas: deliveryLinhas.filter(
          (l) => l.comanda || l.dinheiro || l.cartao || l.taxa
        ),
        taxaFixa,
        observacao: obsDelivery,
      },
      status,
      criadoEm: criadoEmRef.current || agora,
      atualizadoEm: agora,
      finalizadoEm: status === "finalizado" ? agora : undefined,
    };
  };

  // ── Auto-save (dispara 1,5s após qualquer mudança) ──────────────────────────
  // skipRemoteCount é incrementado antes de cada save para que o callback do Firebase
  // (eco do nosso próprio write) não sobrescreva o estado local.

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (statusAtual === "finalizado") return;
    const timer = setTimeout(() => {
      skipRemoteCount.current++;
      fechamentoDiarioAPI.salvar(buildPayload("em_andamento")).catch(() => {
        // Se o save falhar, desfaz o incremento para não bloquear futuros updates remotos
        skipRemoteCount.current = Math.max(0, skipRemoteCount.current - 1);
      });
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, fechamentoId, moedas, notas, moedasVariadas, pagamentos, sangrias, deliveryLinhas,
      taxaFixa, funcionarioId, motoboyId, deliveryMotoboyId,
      obsPagamentos, obsDelivery, obsGeral, statusAtual]);

  // ── Impressão térmica 80 mm ─────────────────────────────────────────────────

  const imprimir = (reg?: DadosFechamentoDiario) => {
    const r = reg ?? buildPayload(statusAtual);
    const dataFmt = new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR");
    const tMoedas = r.caixa.moedas.reduce((s, q, i) => s + q * MOEDAS[i].valor, 0) + (r.caixa.moedasVariadas || 0);
    const tNotas  = r.caixa.notas.reduce((s, q, i) => s + q * NOTAS[i].valor, 0);
    const tCaixa  = tMoedas + tNotas;
    const tPag    = r.pagamentos.reduce((s, p) => s + (p.valor || 0), 0);
    const tSan    = r.sangrias.reduce((s, x) => s + (x.valor || 0), 0);
    const tDelCart  = r.delivery.linhas.reduce((s, l) => s + (l.cartao || 0), 0);
    const tDelDin   = r.delivery.linhas.reduce((s, l) => s + (l.dinheiro || 0), 0);
    const tDelTaxa  = r.delivery.linhas.reduce((s, l) => s + (l.taxa || 0), 0);
    const tTaxaFix  = r.delivery.taxaFixa || 0;
    const tTaxaTotal = tDelTaxa + tTaxaFix;
    const tGeral  = tCaixa + tPag - tSan;

    const row = (label: string, val: string) =>
      `<div class="row"><span>${label}</span><span>${val}</span></div>`;
    const sep = `<div class="sep"></div>`;

    // Delivery: header + each comanda line
    const delHeader = `<div class="del-row del-head"><span class="dc">COMANDA</span><span class="dv">CARTÃO</span><span class="dv">DINHEIRO</span><span class="dv">TAXA</span></div>`;
    const delLinhas = r.delivery.linhas.map(l =>
      `<div class="del-row"><span class="dc">${l.comanda || "—"}</span><span class="dv">${brl(l.cartao || 0)}</span><span class="dv">${brl(l.dinheiro || 0)}</span><span class="dv">${brl(l.taxa || 0)}</span></div>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Fechamento ${dataFmt}</title>
<style>
  @page { size: 80mm auto; margin: 3mm 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: bold; width: 72mm; }
  .center { text-align: center; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .sep { border-top: 1px dashed #000; margin: 5px 0; }
  .sec { margin: 5px 0 3px; text-transform: uppercase; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 2px; }
  .total-line { display: flex; justify-content: space-between; font-size: 13pt; margin: 5px 0 3px; border-top: 2px solid #000; padding-top: 3px; }
  .sub-total { border-top: 1px solid #000; padding-top: 2px; margin-top: 3px; }
  .del-row { display: flex; font-size: 10pt; margin: 1px 0; }
  .del-head { font-size: 9pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 3px; }
  .dc { flex: 2; overflow: hidden; }
  .dv { flex: 1.5; text-align: right; }
  .taxa-total { border-top: 2px solid #000; padding-top: 3px; margin-top: 3px; font-size: 12pt; }
</style></head><body>
<div class="center" style="font-size:14pt">FECHAMENTO CAIXA</div>
<div class="center">${dataFmt}</div>
${sep}
${row("Funcionário:", r.funcionarioNome || "-")}
${row("Motoboy:", r.motoboyNome || "-")}
${sep}
<div class="sec">CAIXA — MOEDAS</div>
${MOEDAS.map((m, i) => row(`${m.label}&nbsp;&nbsp;&nbsp;&nbsp;Qtd: ${r.caixa.moedas[i]}`, `R$ ${brl(r.caixa.moedas[i] * m.valor)}`)).join("")}
${row("Variadas:", `R$ ${brl(r.caixa.moedasVariadas || 0)}`)}
<div class="row sub-total">${"<span>TOTAL MOEDAS</span><span>R$ " + brl(tMoedas) + "</span>"}</div>
${sep}
<div class="sec">CAIXA — NOTAS</div>
${NOTAS.map((n, i) => row(`${n.label}&nbsp;&nbsp;&nbsp;&nbsp;Qtd: ${r.caixa.notas[i]}`, `R$ ${brl(r.caixa.notas[i] * n.valor)}`)).join("")}
<div class="row sub-total">${"<span>TOTAL NOTAS</span><span>R$ " + brl(tNotas) + "</span>"}</div>
${sep}
<div class="total-line"><span>TOTAL CAIXA</span><span>R$ ${brl(tCaixa)}</span></div>
${r.pagamentos.length > 0 ? `${sep}<div class="sec">PAGAMENTOS</div>${r.pagamentos.map(p => row(p.descricao || "—", `R$ ${brl(p.valor)}`)).join("")}<div class="row sub-total"><span>TOTAL PAGAMENTOS</span><span>R$ ${brl(tPag)}</span></div>` : ""}
${r.sangrias.length > 0 ? `${sep}<div class="sec">SANGRIAS</div>${r.sangrias.map(s => row(s.descricao || "—", `R$ ${brl(s.valor)}`)).join("")}<div class="row sub-total"><span>TOTAL SANGRIAS</span><span>R$ ${brl(tSan)}</span></div>` : ""}
${sep}
<div class="sec">DELIVERY</div>
${delHeader}
${delLinhas}
<div class="row sub-total"><span>Total Cartão</span><span>R$ ${brl(tDelCart)}</span></div>
${row("Total Dinheiro", `R$ ${brl(tDelDin)}`)}
${sep}
${row("Taxa dos Pedidos", `R$ ${brl(tDelTaxa)}`)}
${row("Taxa Fixa Motoboy", `R$ ${brl(tTaxaFix)}`)}
<div class="row taxa-total"><span>TOTAL DAS TAXAS</span><span>R$ ${brl(tTaxaTotal)}</span></div>
${sep}
<div class="total-line"><span>TOTAL GERAL</span><span>R$ ${brl(tGeral)}</span></div>
${r.status === "finalizado" ? `${sep}<div class="center" style="font-size:9pt">Finalizado ${r.finalizadoEm ? new Date(r.finalizadoEm).toLocaleString("pt-BR") : ""}</div>` : ""}
</body></html>`;

    const win = window.open("", "_blank", "width=420,height=700");
    if (!win) { toast.error("Permita pop-ups para imprimir."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  // ── Impressão térmica — somente Delivery ───────────────────────────────────

  const imprimirDelivery = () => {
    const r = buildPayload(statusAtual);
    const dataFmt = new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR");
    const tDelCart  = r.delivery.linhas.reduce((s, l) => s + (l.cartao || 0), 0);
    const tDelDin   = r.delivery.linhas.reduce((s, l) => s + (l.dinheiro || 0), 0);
    const tDelTaxa  = r.delivery.linhas.reduce((s, l) => s + (l.taxa || 0), 0);
    const tTaxaFix  = r.delivery.taxaFixa || 0;
    const tTaxaTotal = tDelTaxa + tTaxaFix;

    const row = (label: string, val: string) =>
      `<div class="row"><span>${label}</span><span>${val}</span></div>`;
    const sep = `<div class="sep"></div>`;
    const delHeader = `<div class="del-row del-head"><span class="dc">COMANDA</span><span class="dv">CARTÃO</span><span class="dv">DINHEIRO</span><span class="dv">TAXA</span></div>`;
    const delLinhas = r.delivery.linhas.map(l =>
      `<div class="del-row"><span class="dc">${l.comanda || "—"}</span><span class="dv">${brl(l.cartao || 0)}</span><span class="dv">${brl(l.dinheiro || 0)}</span><span class="dv">${brl(l.taxa || 0)}</span></div>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Delivery ${dataFmt}</title>
<style>
  @page { size: 80mm auto; margin: 3mm 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: bold; width: 72mm; }
  .center { text-align: center; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .sep { border-top: 1px dashed #000; margin: 5px 0; }
  .sec { margin: 5px 0 3px; text-transform: uppercase; font-size: 10pt; border-bottom: 1px solid #000; padding-bottom: 2px; }
  .sub-total { border-top: 1px solid #000; padding-top: 2px; margin-top: 3px; }
  .del-row { display: flex; font-size: 10pt; margin: 1px 0; }
  .del-head { font-size: 9pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 3px; }
  .dc { flex: 2; overflow: hidden; }
  .dv { flex: 1.5; text-align: right; }
  .taxa-total { border-top: 2px solid #000; padding-top: 3px; margin-top: 3px; font-size: 12pt; }
  .total-line { display: flex; justify-content: space-between; font-size: 13pt; margin: 5px 0 3px; border-top: 2px solid #000; padding-top: 3px; }
</style></head><body>
<div class="center" style="font-size:14pt">DELIVERY</div>
<div class="center">${dataFmt}</div>
${sep}
${row("Funcionário:", r.funcionarioNome || "-")}
${row("Motoboy:", r.delivery.motoboyNome || r.motoboyNome || "-")}
${sep}
<div class="sec">COMANDAS</div>
${delHeader}
${delLinhas}
<div class="row sub-total"><span>Total Cartão</span><span>R$ ${brl(tDelCart)}</span></div>
${row("Total Dinheiro", `R$ ${brl(tDelDin)}`)}
${sep}
${row("Taxa dos Pedidos", `R$ ${brl(tDelTaxa)}`)}
${row("Taxa Fixa Motoboy", `R$ ${brl(tTaxaFix)}`)}
<div class="row taxa-total"><span>TOTAL DAS TAXAS</span><span>R$ ${brl(tTaxaTotal)}</span></div>
</body></html>`;

    const win = window.open("", "_blank", "width=420,height=600");
    if (!win) { toast.error("Permita pop-ups para imprimir."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const salvarRascunho = async () => {
    setSalvando(true);
    try {
      skipRemoteCount.current++;
      await fechamentoDiarioAPI.salvar(buildPayload("em_andamento"));
      toast.success("Rascunho salvo! Aparece no Histórico como Pendente.");
    } catch {
      skipRemoteCount.current = Math.max(0, skipRemoteCount.current - 1);
      toast.error("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  // Limpa o formulário para um novo fechamento em branco com ID único próprio
  const novoFechamento = (dataInicio: string) => {
    isLoadedRef.current = false;
    skipNextLoad.current = true;
    setData(dataInicio);
    setFechamentoId(gerarNovoFechamentoId()); // ID único — nunca reutiliza o ID de outro fechamento
    criadoEmRef.current = "";
    setFuncionarioId("");
    setMotoboyId("");
    setMoedas(Array(5).fill(0));
    setNotas(Array(6).fill(0));
    setMoedasVariadas(0);
    setPagamentos([linhaVazia()]);
    setSangrias([linhaVazia()]);
    setObsPagamentos("");
    setDeliveryMotoboyId("");
    setDeliveryLinhas([entregaVazia()]);
    setTaxaFixa(0);
    setObsDelivery("");
    setObsGeral("");
    setStatusAtual("em_andamento");
    setTimeout(() => { isLoadedRef.current = true; }, 300);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Salva o fechamento atual (se não finalizado) e abre um novo em branco
  const iniciarNovoFechamento = async () => {
    if (statusAtual !== "finalizado") {
      try {
        skipRemoteCount.current++;
        await fechamentoDiarioAPI.salvar(buildPayload("em_andamento"));
      } catch {
        skipRemoteCount.current = Math.max(0, skipRemoteCount.current - 1);
      }
    }
    const novaData = new Date().toISOString().split("T")[0];
    novoFechamento(novaData);
    toast.success("Novo fechamento iniciado.");
  };

  const finalizar = async () => {
    if (!funcionarioId) {
      toast.error("Selecione um funcionário.");
      return;
    }
    setSalvando(true);
    try {
      skipRemoteCount.current++;
      const payload = buildPayload("finalizado");
      await fechamentoDiarioAPI.salvar(payload);
      toast.success("Fechamento finalizado e salvo! Iniciando novo fechamento...");
      setTimeout(() => {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        novoFechamento(amanha.toISOString().split("T")[0]);
      }, 800);
    } catch {
      skipRemoteCount.current = Math.max(0, skipRemoteCount.current - 1);
      toast.error("Erro ao finalizar.");
    } finally {
      setSalvando(false);
    }
  };

  // Finaliza, imprime o relatório completo e inicia novo fechamento
  const finalizarEImprimir = async () => {
    if (!funcionarioId) {
      toast.error("Selecione um funcionário.");
      return;
    }
    setSalvando(true);
    try {
      skipRemoteCount.current++;
      const payload = buildPayload("finalizado");
      await fechamentoDiarioAPI.salvar(payload);
      // Imprime com os dados do payload ANTES de resetar o formulário
      imprimir(payload);
      toast.success("Fechamento finalizado! Imprimindo e iniciando novo fechamento...");
      setTimeout(() => {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        novoFechamento(amanha.toISOString().split("T")[0]);
      }, 800);
    } catch {
      skipRemoteCount.current = Math.max(0, skipRemoteCount.current - 1);
      toast.error("Erro ao finalizar.");
    } finally {
      setSalvando(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💰 Fechamento Caixa</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Salvo automaticamente · ENTER avança campos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => imprimir()}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={salvarRascunho}
            disabled={salvando || statusAtual === "finalizado"}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            Salvar
          </Button>
          <Button
            size="sm"
            onClick={iniciarNovoFechamento}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Novo Fechamento
          </Button>
        </div>
      </div>

      {/* Banner de finalizado */}
      {statusAtual === "finalizado" && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/40 bg-green-50 dark:bg-green-950/20 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">Este fechamento foi <strong>finalizado</strong>. Consulte e imprima à vontade — nenhuma alteração será salva.</span>
          <Button
            size="sm"
            onClick={iniciarNovoFechamento}
            className="gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Novo Fechamento
          </Button>
        </div>
      )}

      {/* ── 1. IDENTIFICAÇÃO ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader emoji="📋" title="Identificação" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between h-5 mb-1">
                <Label className="text-xs">Data</Label>
              </div>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                onKeyDown={navNext}
                data-nav=""
              />
            </div>
            <div>
              <div className="flex items-center justify-between h-5 mb-1">
                <Label className="text-xs">Funcionário</Label>
                <button
                  type="button"
                  onClick={() => abrirCadastro("funcionario")}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  Gerenciar
                </button>
              </div>
              <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between h-5 mb-1">
                <Label className="text-xs">Motoboy</Label>
                <button
                  type="button"
                  onClick={() => abrirCadastro("motoboy")}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  Gerenciar
                </button>
              </div>
              <Select value={motoboyId} onValueChange={setMotoboyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {motoboys.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. DELIVERY ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader emoji="🏍️" title="Delivery" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <Label className="text-xs">Motoboy do Delivery</Label>
              <Select
                value={deliveryMotoboyId}
                onValueChange={setDeliveryMotoboyId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {motoboys.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Taxa Fixa (R$)</Label>
              <InputBRL
                value={taxaFixa}
                onChange={setTaxaFixa}
                onKeyDown={navNext}
                data-nav=""
                className="mt-1"
              />
            </div>
          </div>

          {/* Cabeçalho da tabela — COMANDA | CARTÃO | DINHEIRO | TAXA */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_28px] gap-1.5 mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Comanda</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Cartão</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Dinheiro</span>
            <span className="text-xs font-semibold text-muted-foreground text-center">Taxa</span>
            <span />
          </div>

          {/* Linhas — navegação ENTER: comanda→cartão→dinheiro→taxa→próxima linha */}
          <div className="space-y-1">
            {deliveryLinhas.map((linha, i) => (
              <div
                key={linha.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_28px] gap-1.5 items-center"
              >
                {/* col 0 — comanda */}
                <Input
                  ref={(el) => {
                    if (!deliveryRefs.current[i]) deliveryRefs.current[i] = [];
                    deliveryRefs.current[i][0] = el;
                  }}
                  value={linha.comanda}
                  onChange={(e) => {
                    const next = [...deliveryLinhas];
                    next[i] = { ...next[i], comanda: e.target.value };
                    setDeliveryLinhas(next);
                  }}
                  onKeyDown={onDeliveryEnter(i, 0)}
                  placeholder="125 / JOÃO"
                  className="h-8 text-sm"
                />
                {/* col 1 — cartão */}
                <InputBRL
                  ref={(el) => {
                    if (!deliveryRefs.current[i]) deliveryRefs.current[i] = [];
                    deliveryRefs.current[i][1] = el;
                  }}
                  value={linha.cartao}
                  onChange={(v) => {
                    const next = [...deliveryLinhas];
                    next[i] = { ...next[i], cartao: v };
                    setDeliveryLinhas(next);
                  }}
                  onKeyDown={onDeliveryEnter(i, 1)}
                  className="h-8"
                />
                {/* col 2 — dinheiro */}
                <InputBRL
                  ref={(el) => {
                    if (!deliveryRefs.current[i]) deliveryRefs.current[i] = [];
                    deliveryRefs.current[i][2] = el;
                  }}
                  value={linha.dinheiro}
                  onChange={(v) => {
                    const next = [...deliveryLinhas];
                    next[i] = { ...next[i], dinheiro: v };
                    setDeliveryLinhas(next);
                  }}
                  onKeyDown={onDeliveryEnter(i, 2)}
                  className="h-8"
                />
                {/* col 3 — taxa (ENTER → próxima linha) */}
                <InputBRL
                  ref={(el) => {
                    if (!deliveryRefs.current[i]) deliveryRefs.current[i] = [];
                    deliveryRefs.current[i][3] = el;
                  }}
                  value={linha.taxa}
                  onChange={(v) => {
                    const next = [...deliveryLinhas];
                    next[i] = { ...next[i], taxa: v };
                    setDeliveryLinhas(next);
                  }}
                  onKeyDown={onDeliveryEnter(i, 3)}
                  className="h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDeliveryLinhas(deliveryLinhas.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-destructive px-1"
                  tabIndex={-1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeliveryLinhas((prev) => [...prev, entregaVazia()]);
              pendingDeliveryFocus.current = deliveryLinhas.length;
            }}
            className="mt-2 gap-1 text-muted-foreground w-full"
            tabIndex={-1}
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar comanda
          </Button>

          {/* Totais do delivery */}
          <div className="mt-3 border-t pt-3 space-y-1.5">
            {/* Cartão e Dinheiro */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-muted/50 rounded-md py-1.5 px-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Cartão
                </p>
                <p className="font-bold text-sm text-primary mt-0.5">
                  R$ {brl(totalDelCartao)}
                </p>
              </div>
              <div className="text-center bg-muted/50 rounded-md py-1.5 px-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Dinheiro
                </p>
                <p className="font-bold text-sm text-primary mt-0.5">
                  R$ {brl(totalDelDinheiro)}
                </p>
              </div>
            </div>
            {/* Taxas */}
            <div className="border-t pt-1.5 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Taxa dos Pedidos</span>
                <span className="font-semibold">R$ {brl(totalDelTaxa)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Taxa Fixa Motoboy</span>
                <span className="font-semibold">R$ {brl(taxaFixa)}</span>
              </div>
              <div className="flex justify-between items-center bg-primary/10 border border-primary/30 rounded-md px-3 py-1.5 mt-1">
                <span className="font-bold text-sm text-primary uppercase tracking-wide">
                  Total das Taxas
                </span>
                <span className="font-bold text-sm text-primary">
                  R$ {brl(totalTaxasGeral)}
                </span>
              </div>
              {/* Botão único: salva e imprime delivery */}
              <Button
                onClick={async () => { await salvarRascunho(); imprimirDelivery(); }}
                disabled={salvando || statusAtual === "finalizado"}
                className="w-full mt-1 gap-2 bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 dark:border-green-700"
                variant="outline"
              >
                <Printer className="w-4 h-4" />
                Salvar e Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3 & 4. CAIXA — MOEDAS + NOTAS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Moedas */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader emoji="🪙" title="Caixa — Moedas" />

            {/* Cabeçalho das colunas */}
            <div className="grid grid-cols-[62px_80px_1fr] items-center gap-x-2 mb-1 px-0.5">
              <span className="text-xs text-muted-foreground text-right">Valor</span>
              <span className="text-xs text-muted-foreground text-center">Qtd</span>
              <span className="text-xs text-muted-foreground pl-2">Total</span>
            </div>

            {/* Linhas de moedas */}
            <div className="space-y-1">
              {MOEDAS.map(({ valor, label }, i) => (
                <div key={i} className="grid grid-cols-[62px_80px_1fr] items-center gap-x-2">
                  <span className="text-sm font-medium text-right">{label}</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={moedas[i] || ""}
                    onChange={(e) => {
                      const next = [...moedas];
                      next[i] = Math.max(0, parseInt(e.target.value) || 0);
                      setMoedas(next);
                    }}
                    onKeyDown={navNext}
                    data-nav=""
                    placeholder="0"
                    className="h-8 text-center text-sm"
                  />
                  <span className="text-sm font-semibold text-primary pl-2">
                    R$ {brl(moedas[i] * valor)}
                  </span>
                </div>
              ))}
            </div>

            {/* Moedas variadas */}
            <div className="grid grid-cols-[62px_80px_1fr] items-center gap-x-2 mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground text-right">Variadas</span>
              <InputBRL
                value={moedasVariadas}
                onChange={setMoedasVariadas}
                onKeyDown={navNext}
                data-nav=""
                className="h-8 text-sm"
              />
              <span className="text-sm font-semibold text-primary pl-2">
                R$ {brl(moedasVariadas)}
              </span>
            </div>

            <div className="mt-3 flex justify-between items-center border-t pt-2 text-sm">
              <span className="text-muted-foreground">Total Moedas</span>
              <span className="font-bold text-primary">R$ {brl(totalMoedas)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader emoji="💵" title="Caixa — Notas" />

            {/* Cabeçalho das colunas */}
            <div className="grid grid-cols-[62px_80px_1fr] items-center gap-x-2 mb-1 px-0.5">
              <span className="text-xs text-muted-foreground text-right">Valor</span>
              <span className="text-xs text-muted-foreground text-center">Qtd</span>
              <span className="text-xs text-muted-foreground pl-2">Total</span>
            </div>

            {/* Linhas de notas */}
            <div className="space-y-1">
              {NOTAS.map(({ valor, label }, i) => (
                <div key={i} className="grid grid-cols-[62px_80px_1fr] items-center gap-x-2">
                  <span className="text-sm font-medium text-right">{label}</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={notas[i] || ""}
                    onChange={(e) => {
                      const next = [...notas];
                      next[i] = Math.max(0, parseInt(e.target.value) || 0);
                      setNotas(next);
                    }}
                    onKeyDown={navNext}
                    data-nav=""
                    placeholder="0"
                    className="h-8 text-center text-sm"
                  />
                  <span className="text-sm font-semibold text-primary pl-2">
                    R$ {brl(notas[i] * valor)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between items-center border-t pt-2 text-sm">
              <span className="text-muted-foreground">Total Notas</span>
              <span className="font-bold text-primary">R$ {brl(totalNotas)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner Total Caixa */}
      <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-5 py-3">
        <span className="text-sm font-semibold">Total do Caixa</span>
        <span className="text-xl font-bold text-primary">R$ {brl(totalCaixa)}</span>
      </div>

      {/* ── 5 & 6. PAGAMENTOS E SANGRIAS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pagamentos */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              emoji="💳"
              title="Pagamentos"
              total={brl(totalPagamentos)}
            />
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_120px_32px] gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Descrição</span>
              <span className="text-xs text-muted-foreground text-center">Valor</span>
              <span />
            </div>
            <div className="space-y-1">
              {pagamentos.map((linha, i) => (
                <div key={linha.id} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                  <Input
                    ref={(el) => {
                      if (!pagamentosRefs.current[i]) pagamentosRefs.current[i] = [];
                      pagamentosRefs.current[i][0] = el;
                    }}
                    value={linha.descricao}
                    onChange={(e) => {
                      const next = [...pagamentos];
                      next[i] = { ...next[i], descricao: e.target.value };
                      setPagamentos(next);
                    }}
                    onKeyDown={onPagEnter(i, 0)}
                    placeholder="Descrição"
                    className="h-8 text-sm"
                  />
                  <InputBRL
                    ref={(el) => {
                      if (!pagamentosRefs.current[i]) pagamentosRefs.current[i] = [];
                      pagamentosRefs.current[i][1] = el;
                    }}
                    value={linha.valor}
                    onChange={(v) => {
                      const next = [...pagamentos];
                      next[i] = { ...next[i], valor: v };
                      setPagamentos(next);
                    }}
                    onKeyDown={onPagEnter(i, 1)}
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPagamentos(pagamentos.filter((_, j) => j !== i))
                    }
                    className="text-muted-foreground hover:text-destructive px-1.5"
                    tabIndex={-1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPagamentos((prev) => [...prev, linhaVazia()]);
                pendingPagFocus.current = pagamentos.length;
              }}
              className="mt-1.5 gap-1 text-muted-foreground w-full"
              tabIndex={-1}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar linha
            </Button>
            <div className="mt-2 flex justify-between items-center text-sm font-bold border-t pt-2">
              <span className="text-muted-foreground font-normal">Total Pagamentos</span>
              <span className="text-primary">R$ {brl(totalPagamentos)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sangrias */}
        <Card>
          <CardContent className="pt-5">
            <SectionHeader
              emoji="🔻"
              title="Sangrias"
              total={brl(totalSangrias)}
            />
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_120px_32px] gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Descrição</span>
              <span className="text-xs text-muted-foreground text-center">Valor</span>
              <span />
            </div>
            <div className="space-y-1">
              {sangrias.map((linha, i) => (
                <div key={linha.id} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                  <Input
                    ref={(el) => {
                      if (!sangriasRefs.current[i]) sangriasRefs.current[i] = [];
                      sangriasRefs.current[i][0] = el;
                    }}
                    value={linha.descricao}
                    onChange={(e) => {
                      const next = [...sangrias];
                      next[i] = { ...next[i], descricao: e.target.value };
                      setSangrias(next);
                    }}
                    onKeyDown={onSanEnter(i, 0)}
                    placeholder="Descrição"
                    className="h-8 text-sm"
                  />
                  <InputBRL
                    ref={(el) => {
                      if (!sangriasRefs.current[i]) sangriasRefs.current[i] = [];
                      sangriasRefs.current[i][1] = el;
                    }}
                    value={linha.valor}
                    onChange={(v) => {
                      const next = [...sangrias];
                      next[i] = { ...next[i], valor: v };
                      setSangrias(next);
                    }}
                    onKeyDown={onSanEnter(i, 1)}
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSangrias(sangrias.filter((_, j) => j !== i))
                    }
                    className="text-muted-foreground hover:text-destructive px-1.5"
                    tabIndex={-1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSangrias((prev) => [...prev, linhaVazia()]);
                pendingSanFocus.current = sangrias.length;
              }}
              className="mt-1.5 gap-1 text-muted-foreground w-full"
              tabIndex={-1}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar linha
            </Button>
            <div className="mt-2 flex justify-between items-center text-sm font-bold border-t pt-2">
              <span className="text-muted-foreground font-normal">Total Sangrias</span>
              <span className="text-destructive">R$ {brl(totalSangrias)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 7. TOTAIS ────────────────────────────────────────────────────────── */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-5">
          <SectionHeader emoji="🧮" title="Totais" />
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Total Caixa (Moedas + Notas)
              </span>
              <span className="font-semibold">R$ {brl(totalCaixa)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Pagamentos</span>
              <span className="font-semibold">
                + R$ {brl(totalPagamentos)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Sangrias</span>
              <span className="font-semibold text-destructive">
                − R$ {brl(totalSangrias)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-base font-bold">TOTAL GERAL</span>
              <span className="text-2xl font-bold text-primary">
                R$ {brl(totalGeral)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Delivery</span>
              <span className="font-semibold">R$ {brl(totalDelivery)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 8. FINALIZAR ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <SectionHeader emoji="✅" title="Finalizar Fechamento" />
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Observações Gerais</Label>
              <textarea
                value={obsGeral}
                onChange={(e) => setObsGeral(e.target.value)}
                placeholder="Observações sobre o fechamento..."
                className="flex mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                disabled={statusAtual === "finalizado"}
              />
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              <Button
                onClick={finalizarEImprimir}
                disabled={salvando || statusAtual === "finalizado"}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Finalizar e Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 8. HISTÓRICO ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setHistoricoExpandido((v) => !v)}
          >
            <h2 className="text-base font-bold flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Fechamentos
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({historico.filter((r) => r?.status === "finalizado").length} registros)
              </span>
            </h2>
            {historicoExpandido ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {historicoExpandido && (
            <div className="mt-4 space-y-3">
              {/* Filtros */}
              <div className="grid grid-cols-3 gap-2 items-center">
                <Input
                  type="date"
                  value={filtroHistData.inicio}
                  onChange={(e) =>
                    setFiltroHistData((p) => ({ ...p, inicio: e.target.value }))
                  }
                  placeholder="Data início"
                  className="h-8 text-sm"
                />
                <Input
                  type="date"
                  value={filtroHistData.fim}
                  onChange={(e) =>
                    setFiltroHistData((p) => ({ ...p, fim: e.target.value }))
                  }
                  placeholder="Data fim"
                  className="h-8 text-sm"
                />
                <Select
                  value={filtroConferido}
                  onValueChange={(v) => setFiltroConferido(v as typeof filtroConferido)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os caixas</SelectItem>
                    <SelectItem value="nao_conferido">Não conferidos</SelectItem>
                    <SelectItem value="conferido">Conferidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista — somente fechamentos FINALIZADOS */}
              {(() => {
                const filtrados = historico.filter((r) => {
                  if (!r || !r.data) return false;
                  if (r.status !== "finalizado") return false;
                  if (filtroHistData.inicio && r.data < filtroHistData.inicio) return false;
                  if (filtroHistData.fim && r.data > filtroHistData.fim) return false;

                  if (filtroConferido === "conferido" && !r.conferido) return false;
                  if (filtroConferido === "nao_conferido" && r.conferido) return false;
                  return true;
                });

                if (filtrados.length === 0)
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum registro encontrado.
                    </p>
                  );

                return (
                  <div className="border rounded-md overflow-hidden">
                    {/* Cabeçalho */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_80px_54px_96px_36px] gap-2 px-3 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground">
                      <span>Data</span>
                      <span>Funcionário</span>
                      <span>Motoboy</span>
                      <span className="text-right">Total</span>
                      <span className="text-center">Status</span>
                      <span className="text-center">Conferência</span>
                      <span></span>
                    </div>
                    <div className="divide-y">
                      {filtrados.map((r) => {
                        const moedas = r.caixa?.moedas ?? [];
                        const notas  = r.caixa?.notas  ?? [];
                        const tM = moedas.reduce((s: number, q: number, i: number) => s + (q || 0) * (MOEDAS[i]?.valor || 0), 0) + (r.caixa?.moedasVariadas || 0);
                        const tN = notas.reduce((s: number, q: number, i: number) => s + (q || 0) * (NOTAS[i]?.valor || 0), 0);
                        const tP = (r.pagamentos || []).reduce((s: number, p: LinhaPagamentoFechamento) => s + (p.valor || 0), 0);
                        const tS = (r.sangrias  || []).reduce((s: number, x: LinhaPagamentoFechamento) => s + (x.valor || 0), 0);
                        const total = tM + tN + tP - tS;
                        const excluindo = confirmarExcluirFechId === r.id;
                        return excluindo ? (
                              /* Linha de confirmação de exclusão */
                              <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-destructive/5">
                                <span className="flex-1 text-sm text-destructive font-medium">
                                  Deseja realmente excluir este fechamento?
                                </span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-3 text-xs"
                                  onClick={() => excluirFechamento(r.id)}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setConfirmarExcluirFechId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              /* Linha normal */
                              <div key={r.id} className="grid grid-cols-[1fr_1fr_1fr_80px_54px_96px_36px] gap-2 px-3 py-2.5 items-center hover:bg-muted/30 transition-colors">
                                {/* Colunas 1-5: clicáveis para abrir o registro */}
                                <button
                                  className="contents text-left"
                                  onClick={() => { setRegistroAberto(r); setConfirmarExcluirFechId(null); }}
                                >
                                  <span className="text-sm font-medium">
                                    {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                                  </span>
                                  <span className="text-sm truncate">{r.funcionarioNome || "—"}</span>
                                  <span className="text-sm truncate text-muted-foreground">{r.motoboyNome || "—"}</span>
                                  <span className="text-sm text-right font-semibold text-primary">
                                    R$ {brl(total)}
                                  </span>
                                  <span className="text-center">
                                    <span className="inline-block text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded px-1.5 py-0.5">
                                      Final.
                                    </span>
                                  </span>
                                </button>
                                {/* Coluna 6: conferência — botão único que serve de badge e ação */}
                                <div className="flex items-center justify-center">
                                  {r.conferido ? (
                                    <button
                                      className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded px-1.5 py-0.5 font-semibold transition-colors"
                                      title="Conferido — clique para desmarcar"
                                      onClick={(e) => { e.stopPropagation(); alterarConferido(r.id, false); }}
                                    >
                                      ✓ Conf.
                                    </button>
                                  ) : (
                                    <button
                                      className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 rounded px-1.5 py-0.5 border border-orange-200 dark:border-orange-800 hover:border-blue-300 transition-colors"
                                      title="Não conferido — clique para marcar como conferido"
                                      onClick={(e) => { e.stopPropagation(); alterarConferido(r.id, true); }}
                                    >
                                      Não conf.
                                    </button>
                                  )}
                                </div>
                                {/* Coluna 7: excluir */}
                                <div className="flex justify-center">
                                  <button
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                                    title="Excluir fechamento"
                                    onClick={(e) => { e.stopPropagation(); setConfirmarExcluirFechId(r.id); setRegistroAberto(null); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog de cadastro de funcionários / motoboys ────────────────────── */}
      <Dialog open={!!dialogCadastro} onOpenChange={(open) => { if (!open) fecharCadastro(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogCadastro === "funcionario" ? "Funcionários" : "Motoboys"}
            </DialogTitle>
          </DialogHeader>

          {/* Campo adicionar novo */}
          <div className="flex gap-2">
            <Input
              value={novoNomeCad}
              onChange={(e) => setNovoNomeCad(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarCad(); } }}
              placeholder={dialogCadastro === "funcionario" ? "Nome do funcionário..." : "Nome do motoboy..."}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={adicionarCad}
              disabled={salvandoCad || !novoNomeCad.trim()}
              size="sm"
              className="gap-1 px-3"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>

          {/* Lista */}
          <div className="space-y-1 max-h-72 overflow-y-auto border rounded-md">
            {cadastroItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum registro ainda.
              </p>
            ) : (
              cadastroItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 border-b last:border-b-0"
                >
                  {editandoCad?.id === item.id ? (
                    /* Modo edição inline */
                    <>
                      <Input
                        value={editandoCad.nome}
                        onChange={(e) =>
                          setEditandoCad({ ...editandoCad, nome: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); salvarEdicaoCad(); }
                          if (e.key === "Escape") setEditandoCad(null);
                        }}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={salvarEdicaoCad}
                        disabled={salvandoCad}
                        title="Salvar"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditandoCad(null)}
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : confirmExclusao === item.id ? (
                    /* Confirmação de exclusão inline */
                    <>
                      <span className="flex-1 text-sm text-destructive truncate">
                        Excluir &quot;{item.nome}&quot;?
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => excluirCad(item.id)}
                      >
                        Excluir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setConfirmExclusao(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    /* Linha normal */
                    <>
                      <span className="flex-1 text-sm">{item.nome}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditandoCad({ id: item.id, nome: item.nome });
                          setConfirmExclusao(null);
                        }}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setConfirmExclusao(item.id);
                          setEditandoCad(null);
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal de consulta de registro — portal customizado ───────────────────
           Usando createPortal + position:fixed;inset:0 no overlay para garantir
           centralização relativa ao VIEWPORT em todos os browsers (incluindo Firefox).
           O flex-column no card + flex:1;overflow-y:auto no body resolve o scroll interno. */}
      {registroAberto && createPortal(
        (() => {
          const r = registroAberto;
          const fechar = () => { setRegistroAberto(null); setConfirmarExcluirFechId(null); };
          const dataFmt = new Date((r.data || "") + "T12:00:00").toLocaleDateString("pt-BR");
          const moedas = r.caixa?.moedas ?? [];
          const notas  = r.caixa?.notas  ?? [];
          const tMoedas = moedas.reduce((s: number, q: number, i: number) => s + (q || 0) * (MOEDAS[i]?.valor || 0), 0) + (r.caixa?.moedasVariadas || 0);
          const tNotas  = notas.reduce((s: number, q: number, i: number) => s + (q || 0) * (NOTAS[i]?.valor || 0), 0);
          const tCaixa  = tMoedas + tNotas;
          const tPag    = (r.pagamentos || []).reduce((s: number, p: LinhaPagamentoFechamento) => s + (p.valor || 0), 0);
          const tSan    = (r.sangrias   || []).reduce((s: number, x: LinhaPagamentoFechamento) => s + (x.valor || 0), 0);
          const tDelCart  = (r.delivery?.linhas || []).reduce((s: number, l: LinhaDeliveryFechamento) => s + (l.cartao || 0), 0);
          const tDelDin   = (r.delivery?.linhas || []).reduce((s: number, l: LinhaDeliveryFechamento) => s + (l.dinheiro || 0), 0);
          const tDelTaxa  = (r.delivery?.linhas || []).reduce((s: number, l: LinhaDeliveryFechamento) => s + (l.taxa || 0), 0);
          const tTaxaFix  = r.delivery?.taxaFixa || 0;
          const tGeral = tCaixa + tPag - tSan;

          return (
            /* Overlay: cobre todo o viewport, centraliza o card */
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
              onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}
            >
              {/* Card do modal: flex-column, altura máxima 90vh */}
              <div
                className="bg-background border shadow-lg rounded-lg"
                style={{
                  width: "min(512px, calc(100vw - 32px))",
                  maxHeight: "90vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Botão fechar (X) */}
                <button
                  onClick={fechar}
                  className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-foreground"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Cabeçalho — tamanho fixo (flexShrink:0) */}
                <div className="px-6 pt-6 pb-3 border-b" style={{ flexShrink: 0 }}>
                  <div className="flex items-center justify-between pr-6">
                    <h2 className="text-lg font-semibold">Fechamento — {dataFmt}</h2>
                    {r.status === "finalizado" ? (
                      <span className="text-xs font-normal bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded px-2 py-0.5">
                        Finalizado
                      </span>
                    ) : (
                      <span className="text-xs font-normal bg-yellow-100 text-yellow-800 rounded px-2 py-0.5">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Corpo — flex:1 + overflow-y:auto garante scroll interno */}
                <div
                  className="px-6 py-4 space-y-4"
                  style={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}
                >
                  {/* Identificação */}
                  <div className="grid grid-cols-3 gap-x-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">Data</p>
                      <p>{dataFmt}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">Funcionário</p>
                      <p>{r.funcionarioNome || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">Motoboy</p>
                      <p>{r.motoboyNome || "—"}</p>
                    </div>
                  </div>

                  {/* Moedas */}
                  <div className="border rounded-md p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Caixa — Moedas</p>
                    {MOEDAS.map((m, i) => {
                      const qtd = moedas[i] ?? 0;
                      return (
                        <div key={m.label} className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="text-center">Qtd: {qtd}</span>
                          <span className="text-right">R$ {brl(qtd * m.valor)}</span>
                        </div>
                      );
                    })}
                    {(r.caixa?.moedasVariadas || 0) > 0 && (
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-muted-foreground">Variadas</span>
                        <span />
                        <span className="text-right">R$ {brl(r.caixa?.moedasVariadas || 0)}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-sm">
                      <span>Total Moedas</span><span>R$ {brl(tMoedas)}</span>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="border rounded-md p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Caixa — Notas</p>
                    {NOTAS.map((n, i) => {
                      const qtd = notas[i] ?? 0;
                      return (
                        <div key={n.label} className="grid grid-cols-3 text-sm">
                          <span className="text-muted-foreground">{n.label}</span>
                          <span className="text-center">Qtd: {qtd}</span>
                          <span className="text-right">R$ {brl(qtd * n.valor)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-sm">
                      <span>Total Notas</span><span>R$ {brl(tNotas)}</span>
                    </div>
                  </div>

                  {/* Total Caixa */}
                  <div className="flex justify-between items-center bg-muted/40 rounded-md px-3 py-2 font-bold">
                    <span>Total Caixa</span><span className="text-primary">R$ {brl(tCaixa)}</span>
                  </div>

                  {/* Pagamentos */}
                  {(r.pagamentos || []).length > 0 && (
                    <div className="border rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pagamentos</p>
                      {(r.pagamentos || []).map((p, i) => (
                        <div key={p.id ?? i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate pr-2">{p.descricao || "—"}</span>
                          <span className="shrink-0">R$ {brl(p.valor)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-sm">
                        <span>Total Pagamentos</span><span>R$ {brl(tPag)}</span>
                      </div>
                    </div>
                  )}

                  {/* Sangrias */}
                  {(r.sangrias || []).length > 0 && (
                    <div className="border rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sangrias</p>
                      {(r.sangrias || []).map((s, i) => (
                        <div key={s.id ?? i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate pr-2">{s.descricao || "—"}</span>
                          <span className="shrink-0">R$ {brl(s.valor)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-sm">
                        <span>Total Sangrias</span><span>R$ {brl(tSan)}</span>
                      </div>
                    </div>
                  )}

                  {/* Delivery */}
                  {(r.delivery?.linhas || []).length > 0 && (
                    <div className="border rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Delivery — Pedidos</p>
                      <div className="grid grid-cols-4 text-xs font-semibold text-muted-foreground border-b pb-1 mb-1">
                        <span>Comanda</span>
                        <span className="text-right">Cartão</span>
                        <span className="text-right">Dinheiro</span>
                        <span className="text-right">Taxa</span>
                      </div>
                      {(r.delivery?.linhas || []).map((l, i) => (
                        <div key={l.id ?? i} className="grid grid-cols-4 text-sm">
                          <span className="text-muted-foreground truncate pr-1">{l.comanda || "—"}</span>
                          <span className="text-right">R$ {brl(l.cartao || 0)}</span>
                          <span className="text-right">R$ {brl(l.dinheiro || 0)}</span>
                          <span className="text-right">R$ {brl(l.taxa || 0)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total Cartão</span><span>R$ {brl(tDelCart)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total Dinheiro</span><span>R$ {brl(tDelDin)}</span>
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-1 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa dos Pedidos</span><span>R$ {brl(tDelTaxa)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa Fixa Motoboy</span><span>R$ {brl(tTaxaFix)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-0.5">
                          <span>TOTAL DAS TAXAS</span><span className="text-primary">R$ {brl(tDelTaxa + tTaxaFix)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Geral */}
                  <div className="flex justify-between items-center border-2 border-primary/20 rounded-md px-3 py-2.5 font-bold text-base">
                    <span>TOTAL GERAL</span><span className="text-primary">R$ {brl(tGeral)}</span>
                  </div>
                </div>

                {/* Rodapé — sempre visível na base (flexShrink:0) */}
                <div className="px-6 py-4 border-t bg-background" style={{ flexShrink: 0 }}>
                  {confirmarExcluirFechId === r.id ? (
                    <div className="flex items-center justify-between gap-2 bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2.5">
                      <span className="text-sm text-destructive font-medium">
                        Deseja realmente excluir este fechamento?
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="h-7 px-3 text-xs"
                          onClick={() => excluirFechamento(r.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                          onClick={() => setConfirmarExcluirFechId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-2">
                      <Button variant="ghost" size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmarExcluirFechId(r.id)}>
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                      <div className="flex gap-2">
                        {r.status !== "finalizado" && (
                          <Button variant="outline" size="sm" className="gap-1.5"
                            onClick={() => carregarNoForm(r)}>
                            Continuar Fechamento
                          </Button>
                        )}
                        <Button onClick={() => imprimir(r)} size="sm" className="gap-2">
                          <Printer className="w-4 h-4" />
                          Imprimir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
