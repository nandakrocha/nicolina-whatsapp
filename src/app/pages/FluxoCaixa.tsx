import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  BarChart2, Plus, FileText, Calendar, Target, PiggyBank,
  Clock, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Trash2, Info, X, CheckCircle, RefreshCw, Pencil, ChevronDown,
  ChevronUp, Search, Eye,
} from "lucide-react";
import { ProtecaoAdministracao } from "../components/ProtecaoAdministracao";
import { fechamentoDiarioAPI, DadosFechamentoDiario } from "../services/api";
import {
  database,
  ref as dbRef,
  set as dbSet,
  remove as dbRemove,
  onValue as dbOnValue,
  isFirebaseConfigured,
  isDatabaseAvailable,
} from "../services/firebase";

// ── Denominações do caixa ─────────────────────────────────────────
const NOTA_VALORES = [2, 5, 10, 20, 50, 100];
const MOEDA_VALORES = [0.05, 0.1, 0.25, 0.5, 1.0];

// ── Categorias financeiras ────────────────────────────────────────
const CATEGORIAS_ENTRADA = [{ id: "faturamento", nome: "Faturamento" }] as const;

const CATEGORIAS_SAIDA = [
  { id: "mercearia",          nome: "Mercearia" },
  { id: "materia_prima",      nome: "Matéria-prima" },
  { id: "bebidas",            nome: "Bebidas" },
  { id: "embalagens",         nome: "Embalagens" },
  { id: "outros_compras",     nome: "Outros Compras" },
  { id: "folha",              nome: "Folha" },
  { id: "energia",            nome: "Energia" },
  { id: "despesas_fixas",     nome: "Despesas Fixas" },
  { id: "despesas_variaveis", nome: "Despesas Variáveis" },
  { id: "impostos",           nome: "Impostos" },
  { id: "parcelamentos",      nome: "Parcelamentos" },
  { id: "pro_labore",         nome: "Pró-labore" },
  { id: "outras_despesas",    nome: "Outras Despesas" },
] as const;

const TODAS_CATEGORIAS = [
  ...CATEGORIAS_ENTRADA.map(c => ({ ...c, tipo: "entrada" as const })),
  ...CATEGORIAS_SAIDA.map(c => ({ ...c, tipo: "saida" as const })),
];

// ── Helpers gerais ────────────────────────────────────────────────
function hojeStr() { return new Date().toISOString().split("T")[0]; }
function inicioSemanaStr() {
  const d = new Date(); const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  return d.toISOString().split("T")[0];
}
function inicioMesStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function inicioAnoStr() { return `${new Date().getFullYear()}-01-01`; }
function subDias(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatarMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatarData(iso: string) {
  if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`;
}
function formatarDataHora(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function adicionarDias(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function getDatasNoIntervalo(inicio: string, fim: string): string[] {
  if (!inicio || !fim || inicio > fim) return [];
  const datas: string[] = []; const cur = new Date(inicio + "T12:00:00");
  const end = new Date(fim + "T12:00:00"); let g = 0;
  while (cur <= end && g++ < 366) { datas.push(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate() + 1); }
  return datas;
}
function parseMoeda(s: string): number { return parseFloat((s || "").replace(",", ".")) || 0; }
function gerarId() { return `lnc${Date.now()}${Math.random().toString(36).substr(2, 6)}`; }
function gerarIdDup() { return `dup${Date.now()}${Math.random().toString(36).substr(2, 6)}`; }

type PeriodoFiltro = "hoje" | "semana" | "mes" | "ano";
function getIntervalo(p: PeriodoFiltro) {
  const fim = hojeStr();
  const inicio = p === "hoje" ? fim : p === "semana" ? inicioSemanaStr() : p === "mes" ? inicioMesStr() : inicioAnoStr();
  return { inicio, fim };
}

// ── LocalStorage helpers ──────────────────────────────────────────
function lsGet<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? { ...fallback as object, ...JSON.parse(s) } as T : fallback; } catch { return fallback; }
}
function lsGetArray<T>(key: string): T[] {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T[] : []; } catch { return []; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Firebase helpers ──────────────────────────────────────────────
function fbDisponivel() { return isFirebaseConfigured() && isDatabaseAvailable(); }

async function fbSalvar(caminho: string, valor: unknown) {
  try { if (fbDisponivel()) await dbSet(dbRef(database, caminho), valor); } catch (e) { console.error("Erro Firebase save:", e); }
}
async function fbRemover(caminho: string) {
  try { if (fbDisponivel()) await dbRemove(dbRef(database, caminho)); } catch (e) { console.error("Erro Firebase remove:", e); }
}
function fbObservar(caminho: string, cb: (snap: unknown) => void): () => void {
  if (!fbDisponivel()) return () => {};
  return dbOnValue(dbRef(database, caminho), cb as Parameters<typeof dbOnValue>[1]);
}

// ── Types ─────────────────────────────────────────────────────────
type TipoLancamento = "entrada" | "saida";
type OrigemLancamento = "sistema_interno" | "banco" | "caixa" | "fechamento_caixa" | "outro";

interface Lancamento {
  id: string; data: string; grupo: string; grupoNome: string;
  descricao: string; valor: number; tipo: TipoLancamento;
  origem: OrigemLancamento; criadoEm: string;
  auto?: boolean; fechamentoId?: string;
  // "efetiva" = dinheiro físico recebido; "recebivel" = cartão/pix ainda a liquidar no banco
  classificacao?: "efetiva" | "recebivel";
}

interface DuplicataGrupo {
  id: string;
  nome: string;
  tipo: "a_pagar" | "a_receber";
  aVencer: number;
  vencidas: number;
  observacao: string;
  atualizadoEm: string;
}

interface PosicaoFinanceira {
  saldoBancario: number; caixaEspecie: number;
  cartoesPixAReceber: number; contasAReceber: number;
  contasAPagar: number; duplicatasAVencer: number; duplicatasVencidas: number;
}
const POSICAO_DEFAULT: PosicaoFinanceira = {
  saldoBancario: 0, caixaEspecie: 0, cartoesPixAReceber: 0,
  contasAReceber: 0, contasAPagar: 0, duplicatasAVencer: 0, duplicatasVencidas: 0,
};

interface DadosReserva {
  valorMensalDesejado: number; valorJaReservado: number;
  valorReservadoMes: number; metaAnual: number;
}
const RESERVA_DEFAULT: DadosReserva = { valorMensalDesejado: 0, valorJaReservado: 0, valorReservadoMes: 0, metaAnual: 0 };

interface DadosAposentadoria {
  idadeAtual: number; idadeAposentadoria: number;
  reservaAtual: number; valorMensal: number; meta: number;
}
const APOS_DEFAULT: DadosAposentadoria = { idadeAtual: 0, idadeAposentadoria: 65, reservaAtual: 0, valorMensal: 0, meta: 0 };

const LS_POSICAO = "nicolina_fluxo_posicao";
const LS_RESERVA = "nicolina_fluxo_reserva";
const LS_APOS    = "nicolina_fluxo_aposentadoria";
const FB_LANCAMENTOS = "nicolina/fluxo_caixa/lancamentos";
const FB_DUPLICATAS  = "nicolina/fluxo_caixa/duplicatas";

// ── Cálculo de totais de um fechamento ───────────────────────────
function calcularTotaisFechamento(f: DadosFechamentoDiario) {
  const moedas = f.caixa?.moedas || [], notas = f.caixa?.notas || [];
  const totalMoedas = MOEDA_VALORES.reduce((s, v, i) => s + (moedas[i] || 0) * v, 0) + (f.caixa?.moedasVariadas || 0);
  const totalNotas = NOTA_VALORES.reduce((s, v, i) => s + (notas[i] || 0) * v, 0);
  const totalCaixa = totalMoedas + totalNotas;
  const totalPagamentos = (f.pagamentos || []).reduce((s, p) => s + (p.valor || 0), 0);
  const totalSangrias = (f.sangrias || []).reduce((s, x) => s + (x.valor || 0), 0);
  const totalDelDinheiro = (f.delivery?.linhas || []).reduce((s, l) => s + (l.dinheiro || 0), 0);
  const totalDelCartao = (f.delivery?.linhas || []).reduce((s, l) => s + (l.cartao || 0), 0);
  const totalDelTaxa = (f.delivery?.linhas || []).reduce((s, l) => s + (l.taxa || 0), 0);
  return { totalCaixa, totalPagamentos, totalSangrias, totalDelDinheiro, totalDelCartao, totalTaxas: totalDelTaxa + (f.delivery?.taxaFixa || 0) };
}

function derivarLancamentos(fechamentos: DadosFechamentoDiario[]): Lancamento[] {
  const result: Lancamento[] = [];
  fechamentos.forEach(f => {
    const t = calcularTotaisFechamento(f);
    const ts = f.finalizadoEm || f.atualizadoEm || "";
    const fn = f.funcionarioNome ? ` — ${f.funcionarioNome}` : "";
    const push = (sfx: string, descricao: string, valor: number, tipo: TipoLancamento, grupo: string, grupoNome: string, classificacao: "efetiva" | "recebivel" = "efetiva") => {
      if (valor > 0.005) result.push({ id: `${f.id}_${sfx}`, data: f.data, grupo, grupoNome, descricao, valor: parseFloat(valor.toFixed(2)), tipo, origem: "fechamento_caixa", criadoEm: ts, auto: true, fechamentoId: f.id, classificacao });
    };
    // Dinheiro físico → entrada efetiva (já está no caixa)
    push("caixa_din", `Caixa Dinheiro${fn}`,            t.totalCaixa,        "entrada", "faturamento",       "Faturamento",        "efetiva");
    // Cartão/Pix → recebível (venda realizada, mas liquidação ocorre via banco depois)
    push("pagtos",    `Pagamentos (Cartão/Pix)${fn}`,   t.totalPagamentos,   "entrada", "faturamento",       "Faturamento",        "recebivel");
    // Sangrias → saída efetiva de caixa
    push("sangrias",  `Sangrias${fn}`,                  t.totalSangrias,     "saida",   "outras_despesas",   "Outras Despesas",    "efetiva");
    // Delivery dinheiro → entrada efetiva
    push("del_din",   "Delivery — Dinheiro",             t.totalDelDinheiro,  "entrada", "faturamento",       "Faturamento",        "efetiva");
    // Delivery cartão → recebível (liquidação futura via banco/plataforma)
    push("del_car",   "Delivery — Cartão",               t.totalDelCartao,    "entrada", "faturamento",       "Faturamento",        "recebivel");
    // Taxas de delivery → saída efetiva
    push("taxas",     "Delivery — Taxas",                t.totalTaxas,        "saida",   "despesas_variaveis","Despesas Variáveis", "efetiva");
  });
  return result;
}

// ── Constantes de UI ──────────────────────────────────────────────
const ORIGENS: { value: OrigemLancamento; label: string }[] = [
  { value: "sistema_interno", label: "Sistema Interno" },
  { value: "banco",           label: "Banco" },
  { value: "caixa",           label: "Caixa" },
  { value: "fechamento_caixa",label: "Fechamento de Caixa" },
  { value: "outro",           label: "Outro" },
];
const ORIGEM_BADGE: Record<OrigemLancamento, string> = {
  sistema_interno: "bg-blue-100 text-blue-700",
  banco:           "bg-purple-100 text-purple-700",
  caixa:           "bg-emerald-100 text-emerald-700",
  fechamento_caixa:"bg-orange-100 text-orange-700",
  outro:           "bg-muted text-muted-foreground",
};
const ORIGEM_LABEL: Record<OrigemLancamento, string> = {
  sistema_interno: "Sist. Interno", banco: "Banco", caixa: "Caixa",
  fechamento_caixa: "Fech. Caixa", outro: "Outro",
};

// ── Componentes base ──────────────────────────────────────────────
function SecaoPlaceholder({ titulo, descricao, emoji, icon }: { titulo: string; descricao: string; emoji: string; icon: React.ReactNode }) {
  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span>{emoji}</span>{icon}{titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div className="p-4 rounded-full bg-muted/50">
            {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8 text-muted-foreground" })}
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">{descricao}</p>
          <span className="text-xs text-muted-foreground/60 bg-muted px-3 py-1 rounded-full">Em desenvolvimento</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricaCard({ label, value, variant }: { label: string; value: number; variant: "green" | "red" | "blue" | "gray" | "orange" }) {
  const s = ({ green: { c: "bg-emerald-50 border-emerald-200", v: "text-emerald-700" }, red: { c: "bg-red-50 border-red-200", v: "text-red-600" }, blue: { c: "bg-blue-50 border-blue-200", v: "text-blue-700" }, gray: { c: "bg-muted/50 border-border", v: "text-foreground" }, orange: { c: "bg-orange-50 border-orange-200", v: "text-orange-600" } })[variant];
  return (
    <div className={`rounded-lg border p-4 ${s.c}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${s.v}`}>{formatarMoeda(value)}</p>
    </div>
  );
}

function Barra({ pct, cor = "bg-primary" }: { pct: number; cor?: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
      <div className={`h-3 rounded-full transition-all duration-500 ${cor}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// ── PainelGerencial ───────────────────────────────────────────────
function PainelGerencial() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("mes");
  const [fechamentos, setFechamentos] = useState<DadosFechamentoDiario[]>([]);
  const [sincronizando, setSincronizando] = useState(true);
  const [editandoPosicao, setEditandoPosicao] = useState(false);
  const [posicao, setPosicao] = useState<PosicaoFinanceira>(() => lsGet(LS_POSICAO, POSICAO_DEFAULT));
  const [posicaoBuf, setPosicaoBuf] = useState<Record<string, string>>(() => {
    const p = lsGet(LS_POSICAO, POSICAO_DEFAULT);
    return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ? String(v) : ""]));
  });

  useEffect(() => {
    setSincronizando(true);
    return fechamentoDiarioAPI.observarTodos(lista => {
      setFechamentos(lista.filter(f => f.status === "finalizado"));
      setSincronizando(false);
    });
  }, []);

  const { inicio, fim } = getIntervalo(periodo);

  const painel = useMemo(() => {
    const filtrados = fechamentos.filter(f => f.data >= inicio && f.data <= fim);
    // efetivo = dinheiro físico recebido no caixa
    // recebivel = cartão/pix — venda realizada, mas liquidação ainda ocorrerá no banco
    let efetivo = 0, recebivel = 0, saidas = 0;
    filtrados.forEach(f => {
      const t = calcularTotaisFechamento(f);
      efetivo   += t.totalCaixa + t.totalDelDinheiro;
      recebivel += t.totalPagamentos + t.totalDelCartao;
      saidas    += t.totalSangrias + t.totalTaxas;
    });
    const faturamento = efetivo + recebivel; // total de vendas (caixa + cartão/pix)
    const lucro = faturamento - saidas;
    return { faturamento, efetivo, recebivel, saidas, lucro, count: filtrados.length };
  }, [fechamentos, inicio, fim]);

  const handlePosicao = (field: keyof PosicaoFinanceira, raw: string) => {
    setPosicaoBuf(prev => ({ ...prev, [field]: raw }));
    setPosicao(prev => { const next = { ...prev, [field]: parseMoeda(raw) }; lsSet(LS_POSICAO, next); return next; });
  };

  const saldoDisponivel = posicao.saldoBancario + posicao.caixaEspecie;
  const totalAReceber = posicao.cartoesPixAReceber + posicao.contasAReceber + posicao.duplicatasAVencer;
  const totalDisponivel = saldoDisponivel + posicao.cartoesPixAReceber;

  const PERIODOS: { key: PeriodoFiltro; label: string }[] = [
    { key: "hoje", label: "Hoje" }, { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" }, { key: "ano", label: "Ano" },
  ];
  const CAMPOS_POSICAO: { key: keyof PosicaoFinanceira; label: string }[] = [
    { key: "saldoBancario",       label: "Saldo Bancário" },
    { key: "caixaEspecie",        label: "Caixa em Espécie" },
    { key: "cartoesPixAReceber",  label: "Cartões/Pix a Receber" },
    { key: "contasAReceber",      label: "Contas a Receber" },
    { key: "contasAPagar",        label: "Contas a Pagar" },
    { key: "duplicatasAVencer",   label: "Duplicatas a Vencer" },
    { key: "duplicatasVencidas",  label: "Duplicatas Vencidas" },
  ];

  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <span>📊</span><BarChart2 className="w-5 h-5 text-primary" />Painel Gerencial
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            {sincronizando
              ? <><RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Sincronizando...</span></>
              : <><CheckCircle className="w-3 h-3 text-emerald-600" /><span className="text-emerald-700 font-medium">{painel.count} fechamento{painel.count !== 1 ? "s" : ""}</span></>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <div className="flex rounded-md border overflow-hidden">
            {PERIODOS.map(({ key, label }, i) => (
              <button key={key} onClick={() => setPeriodo(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${i > 0 ? "border-l" : ""} ${periodo === key ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {inicio === fim ? formatarData(inicio) : `${formatarData(inicio)} a ${formatarData(fim)}`}
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado do Período</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard label="Faturamento Total"       value={painel.faturamento} variant="blue" />
            <MetricaCard label="Entradas em Espécie"     value={painel.efetivo}     variant="green" />
            <MetricaCard label="Saídas"                  value={painel.saidas}      variant="red" />
            <MetricaCard label="Lucro Operacional"       value={painel.lucro}       variant={painel.lucro >= 0 ? "green" : "red"} />
          </div>
          {painel.recebivel > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 flex items-start gap-2 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-blue-800">
                <span className="font-semibold">Recebíveis (Cartão/Pix): {formatarMoeda(painel.recebivel)}</span>
                {" "}— vendas realizadas ainda não liquidadas no banco.
                Ao registrar a entrada bancária desse valor, não some novamente para evitar dupla contagem.
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posição Financeira Atual</h3>
            <button onClick={() => setEditandoPosicao(v => !v)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              {editandoPosicao ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
              {editandoPosicao ? "Fechar" : "Editar"}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard label="Saldo Disponível" value={saldoDisponivel}  variant="blue" />
            <MetricaCard label="Total a Receber"  value={totalAReceber}    variant={totalAReceber > 0 ? "blue" : "gray"} />
            <MetricaCard label="Contas a Pagar"   value={posicao.contasAPagar} variant={posicao.contasAPagar > 0 ? "orange" : "gray"} />
            <MetricaCard label="Total Disponível" value={totalDisponivel}  variant={totalDisponivel >= 0 ? "blue" : "red"} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Banco",              value: posicao.saldoBancario,       variant: "gray" as const },
              { label: "Caixa em Espécie",   value: posicao.caixaEspecie,        variant: "gray" as const },
              { label: "Cartões/Pix",        value: posicao.cartoesPixAReceber,  variant: "gray" as const },
              { label: "Contas a Receber",   value: posicao.contasAReceber,      variant: "gray" as const },
              { label: "Contas a Pagar",     value: posicao.contasAPagar,        variant: (posicao.contasAPagar > 0 ? "orange" : "gray") as "orange" | "gray" },
              { label: "Dupl. a Vencer",     value: posicao.duplicatasAVencer,   variant: (posicao.duplicatasAVencer > 0 ? "orange" : "gray") as "orange" | "gray" },
              { label: "Dupl. Vencidas",     value: posicao.duplicatasVencidas,  variant: (posicao.duplicatasVencidas > 0 ? "red" : "gray") as "red" | "gray" },
            ].map(({ label, value, variant }) => (
              <div key={label} className={`rounded-lg border p-3 ${{ gray: "bg-muted/50 border-border", orange: "bg-orange-50 border-orange-200", red: "bg-red-50 border-red-200", blue: "", green: "" }[variant]}`}>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className={`text-sm font-bold mt-1 ${{ gray: "text-foreground", orange: "text-orange-600", red: "text-red-600", blue: "", green: "" }[variant]}`}>{formatarMoeda(value)}</p>
              </div>
            ))}
          </div>
          {editandoPosicao && (
            <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Informe a posição financeira atual. Os valores são salvos automaticamente.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CAMPOS_POSICAO.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" step="0.01" min="0" value={posicaoBuf[key] ?? ""}
                        onChange={e => handlePosicao(key, e.target.value)} className="h-8 text-sm" placeholder="0,00" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── LancamentosSection ────────────────────────────────────────────
function LancamentosSection() {
  const hoje = hojeStr();
  const [fechamentosFinalizados, setFechamentosFinalizados] = useState<DadosFechamentoDiario[]>([]);
  const [sincronizando, setSincronizando] = useState(true);

  // Firebase-backed manual lançamentos
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregandoLanc, setCarregandoLanc] = useState(true);

  useEffect(() => {
    setSincronizando(true);
    return fechamentoDiarioAPI.observarTodos(lista => {
      setFechamentosFinalizados(lista.filter(f => f.status === "finalizado"));
      setSincronizando(false);
    });
  }, []);

  useEffect(() => {
    setCarregandoLanc(true);
    if (!fbDisponivel()) {
      setLancamentos(lsGetArray<Lancamento>("nicolina_fluxo_lancamentos_v2"));
      setCarregandoLanc(false);
      return;
    }
    return dbOnValue(dbRef(database, FB_LANCAMENTOS), (snap) => {
      const s = snap as { exists: () => boolean; val: () => Record<string, Lancamento> };
      if (!s.exists()) { setLancamentos([]); setCarregandoLanc(false); return; }
      setLancamentos(Object.values(s.val()));
      setCarregandoLanc(false);
    });
  }, []);

  const lancamentosAuto = useMemo(() => derivarLancamentos(fechamentosFinalizados), [fechamentosFinalizados]);
  const todosLancamentos = useMemo(() => [...lancamentosAuto, ...lancamentos], [lancamentosAuto, lancamentos]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [modoForm, setModoForm] = useState<"individual" | "consolidado">("individual");
  const [filtroInicio, setFiltroInicio] = useState(inicioMesStr());
  const [filtroFim, setFiltroFim] = useState(hoje);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | TipoLancamento>("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | OrigemLancamento>("todos");

  const [formTipo, setFormTipo] = useState<TipoLancamento>("entrada");
  const [formGrupo, setFormGrupo] = useState<string>(CATEGORIAS_ENTRADA[0].id);
  const [formData, setFormData] = useState(hoje);
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formOrigem, setFormOrigem] = useState<OrigemLancamento>("outro");
  const [consData, setConsData] = useState(hoje);
  const [consOrigem, setConsOrigem] = useState<OrigemLancamento>("sistema_interno");
  const [consValores, setConsValores] = useState<Record<string, string>>({});

  const abrirIndividual  = () => { if (mostrarForm && modoForm === "individual")  { setMostrarForm(false); return; } setModoForm("individual");  setMostrarForm(true); };
  const abrirConsolidado = () => { if (mostrarForm && modoForm === "consolidado") { setMostrarForm(false); return; } setModoForm("consolidado"); setMostrarForm(true); };
  const mudarTipo = (t: TipoLancamento) => { setFormTipo(t); setFormGrupo(t === "entrada" ? CATEGORIAS_ENTRADA[0].id : CATEGORIAS_SAIDA[0].id); };

  const adicionarIndividual = async () => {
    const valor = parseMoeda(formValor); if (!formData || valor <= 0) return;
    const cat = TODAS_CATEGORIAS.find(c => c.id === formGrupo);
    const l: Lancamento = { id: gerarId(), data: formData, grupo: formGrupo, grupoNome: cat?.nome ?? formGrupo, descricao: formDescricao.trim(), valor, tipo: formTipo, origem: formOrigem, criadoEm: new Date().toISOString() };
    if (fbDisponivel()) {
      await fbSalvar(`${FB_LANCAMENTOS}/${l.id}`, l);
    } else {
      const next = [...lancamentos, l];
      setLancamentos(next); lsSet("nicolina_fluxo_lancamentos_v2", next);
    }
    setFormValor(""); setFormDescricao("");
  };

  const adicionarConsolidado = async () => {
    const novos: Lancamento[] = [];
    TODAS_CATEGORIAS.forEach(cat => {
      const v = parseMoeda(consValores[cat.id] || "");
      if (v > 0) novos.push({ id: gerarId(), data: consData, grupo: cat.id, grupoNome: cat.nome, descricao: "", valor: v, tipo: cat.tipo, origem: consOrigem, criadoEm: new Date().toISOString() });
    });
    if (!novos.length) return;
    for (const l of novos) {
      if (fbDisponivel()) await fbSalvar(`${FB_LANCAMENTOS}/${l.id}`, l);
      else { setLancamentos(prev => { const next = [...prev, l]; lsSet("nicolina_fluxo_lancamentos_v2", next); return next; }); }
    }
    setConsValores({}); setMostrarForm(false);
  };

  const remover = async (id: string) => {
    if (fbDisponivel()) { await fbRemover(`${FB_LANCAMENTOS}/${id}`); }
    else { setLancamentos(prev => { const next = prev.filter(l => l.id !== id); lsSet("nicolina_fluxo_lancamentos_v2", next); return next; }); }
  };

  const filtrados = useMemo(() => todosLancamentos.filter(l => {
    if (l.data < filtroInicio || l.data > filtroFim) return false;
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
    if (filtroGrupo !== "todos" && l.grupo !== filtroGrupo) return false;
    if (filtroOrigem !== "todos" && l.origem !== filtroOrigem) return false;
    return true;
  }).sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm)), [todosLancamentos, filtroInicio, filtroFim, filtroTipo, filtroGrupo, filtroOrigem]);

  const totais = useMemo(() => {
    const entradas = filtrados.filter(l => l.tipo === "entrada");
    // Entradas efetivas = dinheiro físico (caixa) + lançamentos manuais de banco/outros
    const efetivas   = entradas.filter(l => l.classificacao !== "recebivel").reduce((s, l) => s + l.valor, 0);
    // Recebíveis = cartão/pix do fechamento — ainda a liquidar no banco
    const recebiveis = entradas.filter(l => l.classificacao === "recebivel").reduce((s, l) => s + l.valor, 0);
    const faturamento = efetivas + recebiveis;
    const saidas = filtrados.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
    return { faturamento, efetivas, recebiveis, saidas, resultado: faturamento - saidas };
  }, [filtrados]);

  const totaisPorGrupo = useMemo(() => {
    const map: Record<string, { nome: string; tipo: TipoLancamento; total: number }> = {};
    filtrados.forEach(l => { if (!map[l.grupo]) map[l.grupo] = { nome: l.grupoNome, tipo: l.tipo, total: 0 }; map[l.grupo].total += l.valor; });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
  }, [filtrados]);

  const porDia = useMemo(() => {
    const map: Record<string, Lancamento[]> = {};
    filtrados.forEach(l => { if (!map[l.data]) map[l.data] = []; map[l.data].push(l); });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtrados]);

  const gruposUsados = useMemo(() => { const ids = new Set(todosLancamentos.map(l => l.grupo)); return TODAS_CATEGORIAS.filter(c => ids.has(c.id)); }, [todosLancamentos]);
  const gruposParaForm = formTipo === "entrada" ? [...CATEGORIAS_ENTRADA] : [...CATEGORIAS_SAIDA];
  const fechCount = fechamentosFinalizados.length;
  const autoCount = lancamentosAuto.length;

  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold"><span>📝</span><Plus className="w-5 h-5 text-primary" />Lançamentos</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={abrirConsolidado}>Por Grupos</Button>
            <Button size="sm" onClick={abrirIndividual}><Plus className="w-4 h-4 mr-1" />Novo</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Status integração */}
        {sincronizando ? (
          <div className="flex gap-2 rounded-lg border bg-muted/20 p-3 text-sm items-center">
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Sincronizando fechamentos...</p>
          </div>
        ) : fechCount > 0 ? (
          <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-800">
              <span className="font-semibold">Integração ativa: </span>
              {fechCount} fechamento{fechCount > 1 ? "s" : ""} ({autoCount} movimentações) importados automaticamente.{" "}
              {fbDisponivel() ? <span className="text-emerald-700">Lançamentos manuais salvos no Firebase.</span> : <span className="text-amber-700">Firebase não configurado — manuais salvos localmente.</span>}
            </p>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">Fechamentos finalizados aparecerão automaticamente. Use <strong>Por Grupos</strong> para demais lançamentos.</p>
          </div>
        )}

        {/* Form individual */}
        {mostrarForm && modoForm === "individual" && (
          <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Novo Lançamento</h3>
              <button onClick={() => setMostrarForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Data</Label><Input type="date" value={formData} onChange={e => setFormData(e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <div className="flex rounded-md border overflow-hidden h-8">
                  <button onClick={() => mudarTipo("entrada")} className={`flex-1 text-xs font-medium transition-colors ${formTipo === "entrada" ? "bg-emerald-600 text-white" : "bg-background hover:bg-muted"}`}>Entrada</button>
                  <button onClick={() => mudarTipo("saida")} className={`flex-1 text-xs font-medium transition-colors border-l ${formTipo === "saida" ? "bg-red-600 text-white" : "bg-background hover:bg-muted"}`}>Saída</button>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Grupo</Label>
                <select value={formGrupo} onChange={e => setFormGrupo(e.target.value)} className="w-full h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
                  {gruposParaForm.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1 col-span-2"><Label className="text-xs">Descrição</Label><Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Opcional" className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Origem</Label>
                <select value={formOrigem} onChange={e => setFormOrigem(e.target.value as OrigemLancamento)} className="w-full h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
                  {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" value={formValor} onChange={e => setFormValor(e.target.value)} placeholder="0,00" className="h-8 text-sm"
                  onKeyDown={e => { if (e.key === "Enter") adicionarIndividual(); }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={adicionarIndividual} disabled={!formData || parseMoeda(formValor) <= 0}
                className={formTipo === "entrada" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
                Adicionar {formTipo === "entrada" ? "Entrada" : "Saída"}
              </Button>
            </div>
          </div>
        )}

        {/* Form consolidado */}
        {mostrarForm && modoForm === "consolidado" && (
          <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div><h3 className="text-sm font-semibold">Lançamento por Grupos</h3><p className="text-xs text-muted-foreground mt-0.5">Total de cada grupo do relatório do sistema interno</p></div>
              <button onClick={() => setMostrarForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Data</Label><Input type="date" value={consData} onChange={e => setConsData(e.target.value)} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Origem</Label>
                <select value={consOrigem} onChange={e => setConsOrigem(e.target.value as OrigemLancamento)} className="w-full h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
                  {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1 pb-1 border-b border-emerald-200"><TrendingUp className="w-3 h-3" />Entradas</p>
                {CATEGORIAS_ENTRADA.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1">{cat.nome}</span>
                    <div className="flex items-center gap-1 w-36"><span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" step="0.01" min="0" value={consValores[cat.id] ?? ""} onChange={e => setConsValores(p => ({ ...p, [cat.id]: e.target.value }))} className="h-8 text-sm" placeholder="0,00" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1 pb-1 border-b border-red-200"><TrendingDown className="w-3 h-3" />Saídas</p>
                {CATEGORIAS_SAIDA.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1">{cat.nome}</span>
                    <div className="flex items-center gap-1 w-36"><span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" step="0.01" min="0" value={consValores[cat.id] ?? ""} onChange={e => setConsValores(p => ({ ...p, [cat.id]: e.target.value }))} className="h-8 text-sm" placeholder="0,00" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={adicionarConsolidado} disabled={Object.values(consValores).every(v => parseMoeda(v) <= 0)}>Confirmar Lançamentos</Button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">De</Label>
            <Input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} className="w-36 h-8 text-sm" />
            <Label className="text-xs text-muted-foreground whitespace-nowrap">até</Label>
            <Input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} className="w-36 h-8 text-sm" />
          </div>
          <div className="flex rounded-md border overflow-hidden h-8">
            {(["todos", "entrada", "saida"] as const).map((t, i) => (
              <button key={t} onClick={() => setFiltroTipo(t)} className={`px-3 text-xs font-medium transition-colors ${i > 0 ? "border-l" : ""} ${filtroTipo === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>
          <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
            <option value="todos">Todos os grupos</option>
            {gruposUsados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value as "todos" | OrigemLancamento)} className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
            <option value="todos">Todas as origens</option>
            {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(hoje); setFiltroFim(hoje); }}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(inicioSemanaStr()); setFiltroFim(hoje); }}>Semana</Button>
            <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(inicioMesStr()); setFiltroFim(hoje); }}>Mês</Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard label="Faturamento"          value={totais.faturamento} variant="blue" />
            <MetricaCard label="Entradas Efetivas"    value={totais.efetivas}    variant="green" />
            <MetricaCard label="Saídas"               value={totais.saidas}      variant="red" />
            <MetricaCard label="Resultado"            value={totais.resultado}   variant={totais.resultado >= 0 ? "green" : "red"} />
          </div>
          {totais.recebiveis > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 flex items-start gap-2 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-blue-800">
                <span className="font-semibold">Recebíveis Cartão/Pix: {formatarMoeda(totais.recebiveis)}</span>
                {" "}— vendas do período ainda não liquidadas no banco. Não registre novamente ao receber esses valores bancariamente.
              </span>
            </div>
          )}
        </div>

        {/* Lista por dia */}
        {carregandoLanc ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />Carregando lançamentos...
          </div>
        ) : porDia.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Nenhum lançamento no período selecionado.</div>
        ) : (
          <div className="space-y-3">
            {porDia.map(([data, items]) => {
              const dE = items.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
              const dS = items.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
              const dAuto = items.filter(l => l.auto).length;
              return (
                <div key={data} className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatarData(data)}{data === hoje && <span className="ml-2 text-xs text-primary">(hoje)</span>}</span>
                      {dAuto > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">⚡ {dAuto} auto</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {dE > 0 && <span className="text-emerald-700 font-medium">+{formatarMoeda(dE)}</span>}
                      {dS > 0 && <span className="text-red-600 font-medium">-{formatarMoeda(dS)}</span>}
                      <span className={`font-semibold ${(dE - dS) >= 0 ? "text-blue-700" : "text-red-700"}`}>= {formatarMoeda(dE - dS)}</span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {items.map(l => (
                      <div key={l.id} className={`flex items-center gap-3 px-4 py-2.5 group ${l.auto ? "bg-orange-50/40" : "hover:bg-muted/20"}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.tipo === "saida" ? "bg-red-500" : l.classificacao === "recebivel" ? "bg-blue-400" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium w-28 flex-shrink-0 truncate">{l.grupoNome}</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{l.descricao || "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ORIGEM_BADGE[l.origem]}`}>{ORIGEM_LABEL[l.origem]}</span>
                        <span className={`text-sm font-semibold w-28 text-right flex-shrink-0 ${l.tipo === "entrada" ? "text-emerald-700" : "text-red-600"}`}>
                          {l.tipo === "entrada" ? "+" : "-"}{formatarMoeda(l.valor)}
                        </span>
                        {!l.auto
                          ? <button onClick={() => remover(l.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                          : <div className="w-3.5 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Totais por grupo */}
        {totaisPorGrupo.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b text-sm font-semibold">Totais por Grupo <span className="font-normal text-muted-foreground text-xs">— período selecionado</span></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/20">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Grupo</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Total</th>
              </tr></thead>
              <tbody className="divide-y">
                {totaisPorGrupo.map(([g, { nome, tipo, total }]) => (
                  <tr key={g} className="hover:bg-muted/20">
                    <td className="px-4 py-2">{nome}</td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipo === "entrada" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{tipo === "entrada" ? "Entrada" : "Saída"}</span></td>
                    <td className={`px-4 py-2 text-right font-semibold ${tipo === "entrada" ? "text-emerald-700" : "text-red-600"}`}>{formatarMoeda(total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 bg-muted/30 font-semibold">
                <td className="px-4 py-2.5" colSpan={2}>Resultado</td>
                <td className={`px-4 py-2.5 text-right ${totais.resultado >= 0 ? "text-emerald-700" : "text-red-600"}`}>{totais.resultado >= 0 ? "+" : ""}{formatarMoeda(totais.resultado)}</td>

              </tr></tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── DuplicatasSection ─────────────────────────────────────────────
function DuplicatasSection() {
  const [items, setItems] = useState<DuplicataGrupo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const novoBuf = (): DuplicataGrupo => ({
    id: "", nome: "", tipo: "a_pagar", aVencer: 0, vencidas: 0, observacao: "", atualizadoEm: "",
  });
  const [form, setForm] = useState(novoBuf);
  const [formBuf, setFormBuf] = useState<Record<string, string>>({ aVencer: "", vencidas: "" });

  useEffect(() => {
    setCarregando(true);
    if (!fbDisponivel()) {
      setItems(lsGetArray<DuplicataGrupo>("nicolina_fluxo_duplicatas"));
      setCarregando(false);
      return;
    }
    return dbOnValue(dbRef(database, FB_DUPLICATAS), (snap) => {
      const s = snap as { exists: () => boolean; val: () => Record<string, DuplicataGrupo> };
      if (!s.exists()) { setItems([]); setCarregando(false); return; }
      setItems(Object.values(s.val()).sort((a, b) => a.nome.localeCompare(b.nome)));
      setCarregando(false);
    });
  }, []);

  const salvar = async (item: DuplicataGrupo) => {
    const atualizado = { ...item, atualizadoEm: new Date().toISOString() };
    if (fbDisponivel()) {
      await fbSalvar(`${FB_DUPLICATAS}/${atualizado.id}`, atualizado);
    } else {
      setItems(prev => { const next = [...prev.filter(i => i.id !== atualizado.id), atualizado]; lsSet("nicolina_fluxo_duplicatas", next); return next; });
    }
  };

  const excluir = async (id: string) => {
    if (fbDisponivel()) await fbRemover(`${FB_DUPLICATAS}/${id}`);
    else setItems(prev => { const next = prev.filter(i => i.id !== id); lsSet("nicolina_fluxo_duplicatas", next); return next; });
  };

  const abrirNovo = () => { setForm(novoBuf()); setFormBuf({ aVencer: "", vencidas: "" }); setEditId(null); setMostrarForm(true); };
  const abrirEditar = (item: DuplicataGrupo) => {
    setForm(item); setFormBuf({ aVencer: item.aVencer ? String(item.aVencer) : "", vencidas: item.vencidas ? String(item.vencidas) : "" });
    setEditId(item.id); setMostrarForm(true);
  };
  const confirmar = async () => {
    if (!form.nome.trim()) return;
    const id = editId || gerarIdDup();
    await salvar({ ...form, id, aVencer: parseMoeda(formBuf.aVencer), vencidas: parseMoeda(formBuf.vencidas) });
    setMostrarForm(false); setEditId(null);
  };
  const cancelar = () => { setMostrarForm(false); setEditId(null); };

  const aPagar   = items.filter(i => i.tipo === "a_pagar");
  const aReceber = items.filter(i => i.tipo === "a_receber");
  const totAPagarVencer  = aPagar.reduce((s, i) => s + i.aVencer, 0);
  const totAPagarVencido = aPagar.reduce((s, i) => s + i.vencidas, 0);
  const totAReceberVencer  = aReceber.reduce((s, i) => s + i.aVencer, 0);
  const totAReceberVencido = aReceber.reduce((s, i) => s + i.vencidas, 0);

  const TabelaDuplicatas = ({ lista, vazio }: { lista: DuplicataGrupo[]; vazio: string }) => (
    lista.length === 0
      ? <p className="text-xs text-muted-foreground italic py-3">{vazio}</p>
      : <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/20 text-xs font-medium text-muted-foreground">
            <th className="text-left px-3 py-2">Grupo / Fornecedor</th>
            <th className="text-right px-3 py-2">A Vencer</th>
            <th className="text-right px-3 py-2">Vencido</th>
            <th className="text-left px-3 py-2">Observação</th>
            <th className="px-3 py-2 w-16"></th>
          </tr></thead>
          <tbody className="divide-y">
            {lista.map(item => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-3 py-2.5 font-medium">{item.nome}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${item.aVencer > 0 ? "text-orange-600" : "text-muted-foreground"}`}>{item.aVencer > 0 ? formatarMoeda(item.aVencer) : "—"}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${item.vencidas > 0 ? "text-red-600" : "text-muted-foreground"}`}>{item.vencidas > 0 ? formatarMoeda(item.vencidas) : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">{item.observacao || "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => abrirEditar(item)} className="text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => excluir(item.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  );

  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold"><span>📄</span><FileText className="w-5 h-5 text-primary" />Contas / Duplicatas</span>
          <Button size="sm" onClick={abrirNovo}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

        <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800">Valores consolidados por grupo financeiro — não é necessário lançar cada duplicata individualmente. Informe os totais por fornecedor ou categoria.</p>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{editId ? "Editar" : "Adicionar"} Grupo</h3>
              <button onClick={cancelar} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2 sm:col-span-1"><Label className="text-xs">Nome / Grupo</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Fornecedor Silva" className="h-8 text-sm" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as DuplicataGrupo["tipo"] }))} className="w-full h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
                  <option value="a_pagar">A Pagar</option>
                  <option value="a_receber">A Receber</option>
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs">A Vencer (R$)</Label>
                <Input type="number" step="0.01" min="0" value={formBuf.aVencer} onChange={e => setFormBuf(p => ({ ...p, aVencer: e.target.value }))} placeholder="0,00" className="h-8 text-sm" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Vencido (R$)</Label>
                <Input type="number" step="0.01" min="0" value={formBuf.vencidas} onChange={e => setFormBuf(p => ({ ...p, vencidas: e.target.value }))} placeholder="0,00" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-2"><Label className="text-xs">Observação</Label>
                <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelar}>Cancelar</Button>
              <Button size="sm" onClick={confirmar} disabled={!form.nome.trim()}>Salvar</Button>
            </div>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><RefreshCw className="w-4 h-4 animate-spin" />Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A Pagar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-red-200">
                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" />A Pagar</h3>
                {aPagar.length > 0 && (
                  <div className="text-xs text-right">
                    <span className="text-orange-600 font-medium">Vencer: {formatarMoeda(totAPagarVencer)}</span>
                    {totAPagarVencido > 0 && <span className="text-red-600 font-semibold ml-3">Vencido: {formatarMoeda(totAPagarVencido)}</span>}
                  </div>
                )}
              </div>
              <TabelaDuplicatas lista={aPagar} vazio="Nenhuma conta a pagar registrada." />
              {aPagar.length > 0 && (
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total A Pagar</span>
                  <span className={totAPagarVencer + totAPagarVencido > 0 ? "text-red-600" : "text-muted-foreground"}>{formatarMoeda(totAPagarVencer + totAPagarVencido)}</span>
                </div>
              )}
            </div>

            {/* A Receber */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />A Receber</h3>
                {aReceber.length > 0 && (
                  <div className="text-xs text-right">
                    <span className="text-blue-600 font-medium">Vencer: {formatarMoeda(totAReceberVencer)}</span>
                    {totAReceberVencido > 0 && <span className="text-orange-600 font-semibold ml-3">Atrasado: {formatarMoeda(totAReceberVencido)}</span>}
                  </div>
                )}
              </div>
              <TabelaDuplicatas lista={aReceber} vazio="Nenhuma conta a receber registrada." />
              {aReceber.length > 0 && (
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total A Receber</span>
                  <span className={totAReceberVencer + totAReceberVencido > 0 ? "text-emerald-700" : "text-muted-foreground"}>{formatarMoeda(totAReceberVencer + totAReceberVencido)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── FluxoDiario ───────────────────────────────────────────────────
function FluxoDiario() {
  const hoje = hojeStr();
  const [viewMode, setViewMode] = useState<"diaria" | "mensal">("diaria");
  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [dataDiaria, setDataDiaria] = useState(hoje);
  const [saldoInicialStr, setSaldoInicialStr] = useState("");
  const [lancamentos, setLancamentos] = useState<Record<string, Record<string, number>>>({});
  const [inputBuf, setInputBuf] = useState<Record<string, Record<string, string>>>({});

  const handleValor = (data: string, catId: string, raw: string) => {
    setInputBuf(prev => ({ ...prev, [data]: { ...(prev[data] || {}), [catId]: raw } }));
    setLancamentos(prev => ({ ...prev, [data]: { ...(prev[data] || {}), [catId]: parseMoeda(raw) } }));
  };
  const somarE = (data: string) => CATEGORIAS_ENTRADA.reduce((s, c) => s + (lancamentos[data]?.[c.id] || 0), 0);
  const somarS = (data: string) => CATEGORIAS_SAIDA.reduce((s, c) => s + (lancamentos[data]?.[c.id] || 0), 0);
  const totDia = (data: string) => { const e = somarE(data), s = somarS(data); return { entradas: e, saidas: s, resultado: e - s }; };
  const setPeriodo = (inicio: string, fim: string) => { setDataInicial(inicio); setDataFinal(fim); if (viewMode === "diaria") setDataDiaria(inicio); };

  const resumo = useMemo(() => {
    let e = 0, s = 0;
    if (viewMode === "diaria") { e = somarE(dataDiaria); s = somarS(dataDiaria); }
    else getDatasNoIntervalo(dataInicial, dataFinal).forEach(d => { e += somarE(d); s += somarS(d); });
    const resultado = e - s; const si = parseMoeda(saldoInicialStr);
    return { entradas: e, saidas: s, resultado, saldoInicial: si, saldoFinal: si + resultado };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, dataDiaria, dataInicial, dataFinal, lancamentos, saldoInicialStr]);

  const diasPeriodo = useMemo(() => getDatasNoIntervalo(dataInicial, dataFinal), [dataInicial, dataFinal]);

  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span>📅</span><Calendar className="w-5 h-5 text-primary" />Fluxo Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex rounded-md border overflow-hidden">
            <button onClick={() => { setViewMode("diaria"); setDataDiaria(dataInicial); }} className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "diaria" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Diário</button>
            <button onClick={() => setViewMode("mensal")} className={`px-4 py-2 text-sm font-medium transition-colors border-l ${viewMode === "mensal" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>Mensal</button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">De</Label>
            <Input type="date" value={dataInicial} onChange={e => { setDataInicial(e.target.value); if (viewMode === "diaria") setDataDiaria(e.target.value); }} className="w-40 h-9 text-sm" />
            <Label className="text-sm text-muted-foreground">até</Label>
            <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} className="w-40 h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPeriodo(hoje, hoje)}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => setPeriodo(inicioSemanaStr(), hoje)}>Semana</Button>
            <Button variant="outline" size="sm" onClick={() => setPeriodo(inicioMesStr(), hoje)}>Mês</Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Saldo inicial:</Label>
          <div className="flex items-center gap-1 w-44">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input type="number" step="0.01" value={saldoInicialStr} onChange={e => setSaldoInicialStr(e.target.value)} className="h-9 text-sm" placeholder="0,00" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Resumo <span className="font-normal text-muted-foreground">{viewMode === "diaria" ? `— ${formatarData(dataDiaria)}` : `— ${formatarData(dataInicial)} a ${formatarData(dataFinal)}`}</span></h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricaCard label="Entradas"  value={resumo.entradas}    variant="green" />
            <MetricaCard label="Saídas"    value={resumo.saidas}      variant="red" />
            <MetricaCard label="Resultado" value={resumo.resultado}   variant={resumo.resultado >= 0 ? "green" : "red"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricaCard label="Saldo Inicial" value={resumo.saldoInicial} variant="gray" />
            <MetricaCard label="Saldo Final"   value={resumo.saldoFinal}   variant={resumo.saldoFinal >= 0 ? "blue" : "red"} />
          </div>
        </div>

        {viewMode === "diaria" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
              <Button variant="ghost" size="icon" onClick={() => setDataDiaria(d => adicionarDias(d, -1))}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="text-center">
                <p className="text-base font-semibold">{formatarData(dataDiaria)}</p>
                {dataDiaria === hoje && <span className="text-xs text-primary font-medium">Hoje</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDataDiaria(d => adicionarDias(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="rounded-lg border border-emerald-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-emerald-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />Entradas</span>
                <span className="text-sm font-bold text-emerald-700">{formatarMoeda(somarE(dataDiaria))}</span>
              </div>
              <div className="divide-y">
                {CATEGORIAS_ENTRADA.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm flex-1">{cat.nome}</span>
                    <div className="flex items-center gap-1 w-36"><span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" step="0.01" min="0" value={inputBuf[dataDiaria]?.[cat.id] ?? ""} onChange={e => handleValor(dataDiaria, cat.id, e.target.value)} className="h-8 text-sm" placeholder="0,00" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-red-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-red-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-red-700 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" />Saídas</span>
                <span className="text-sm font-bold text-red-700">{formatarMoeda(somarS(dataDiaria))}</span>
              </div>
              <div className="divide-y">
                {CATEGORIAS_SAIDA.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm flex-1">{cat.nome}</span>
                    <div className="flex items-center gap-1 w-36"><span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" step="0.01" min="0" value={inputBuf[dataDiaria]?.[cat.id] ?? ""} onChange={e => handleValor(dataDiaria, cat.id, e.target.value)} className="h-8 text-sm" placeholder="0,00" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(() => { const { resultado } = totDia(dataDiaria); const pos = resultado >= 0; return (
              <div className={`rounded-lg border p-4 flex items-center justify-between ${pos ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <span className={`text-sm font-semibold ${pos ? "text-emerald-700" : "text-red-700"}`}>Resultado do Dia</span>
                <span className={`text-xl font-bold ${pos ? "text-emerald-700" : "text-red-600"}`}>{resultado >= 0 ? "+" : ""}{formatarMoeda(resultado)}</span>
              </div>
            ); })()}
          </div>
        )}

        {viewMode === "mensal" && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-semibold whitespace-nowrap">Data</th>
                <th className="text-right px-4 py-2.5 font-semibold text-emerald-700 whitespace-nowrap">Entradas</th>
                <th className="text-right px-4 py-2.5 font-semibold text-red-600 whitespace-nowrap">Saídas</th>
                <th className="text-right px-4 py-2.5 font-semibold whitespace-nowrap">Resultado</th>
                <th className="text-right px-4 py-2.5 font-semibold text-blue-700 whitespace-nowrap">Saldo Acum.</th>
              </tr></thead>
              <tbody className="divide-y">
                {(() => { let sAcum = parseMoeda(saldoInicialStr);
                  return diasPeriodo.map(data => { const t = totDia(data); sAcum += t.resultado;
                    return (
                      <tr key={data} className={`hover:bg-muted/30 cursor-pointer ${data === hoje ? "bg-primary/5" : ""}`}
                        onClick={() => { setViewMode("diaria"); setDataDiaria(data); }}>
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">{formatarData(data)}{data === hoje && <span className="ml-2 text-xs text-primary">(hoje)</span>}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-700 whitespace-nowrap">{t.entradas > 0 ? formatarMoeda(t.entradas) : <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-2.5 text-right text-red-600 whitespace-nowrap">{t.saidas > 0 ? formatarMoeda(t.saidas) : <span className="text-muted-foreground">—</span>}</td>
                        <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${t.resultado >= 0 ? "text-emerald-700" : "text-red-600"}`}>{t.resultado !== 0 ? `${t.resultado > 0 ? "+" : ""}${formatarMoeda(t.resultado)}` : <span className="text-muted-foreground">—</span>}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap ${sAcum >= 0 ? "text-blue-700" : "text-red-600"}`}>{formatarMoeda(sAcum)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot><tr className="border-t-2 bg-muted/50 font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right text-emerald-700">{formatarMoeda(resumo.entradas)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{formatarMoeda(resumo.saidas)}</td>
                <td className={`px-4 py-2.5 text-right ${resumo.resultado >= 0 ? "text-emerald-700" : "text-red-600"}`}>{resumo.resultado >= 0 ? "+" : ""}{formatarMoeda(resumo.resultado)}</td>
                <td className={`px-4 py-2.5 text-right ${resumo.saldoFinal >= 0 ? "text-blue-700" : "text-red-600"}`}>{formatarMoeda(resumo.saldoFinal)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ReservaPessoal ────────────────────────────────────────────────
function ReservaPessoal() {
  const [dados, setDados] = useState<DadosReserva>(() => lsGet(LS_RESERVA, RESERVA_DEFAULT));
  const [buf, setBuf] = useState<Record<string, string>>(() => {
    const d = lsGet(LS_RESERVA, RESERVA_DEFAULT);
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ? String(v) : ""]));
  });
  const update = (field: keyof DadosReserva, raw: string) => {
    setBuf(prev => ({ ...prev, [field]: raw }));
    setDados(prev => { const next = { ...prev, [field]: parseMoeda(raw) }; lsSet(LS_RESERVA, next); return next; });
  };
  const pctMes   = dados.valorMensalDesejado > 0 ? Math.min(100, (dados.valorReservadoMes / dados.valorMensalDesejado) * 100) : 0;
  const pctAnual = dados.metaAnual > 0 ? Math.min(100, (dados.valorJaReservado / dados.metaAnual) * 100) : 0;
  const faltaMes   = Math.max(0, dados.valorMensalDesejado - dados.valorReservadoMes);
  const faltaAnual = Math.max(0, dados.metaAnual - dados.valorJaReservado);
  const CAMPOS: { key: keyof DadosReserva; label: string }[] = [
    { key: "valorMensalDesejado", label: "Valor desejado de reserva mensal" },
    { key: "valorReservadoMes",   label: "Valor reservado neste mês" },
    { key: "valorJaReservado",    label: "Total já reservado (acumulado)" },
    { key: "metaAnual",           label: "Meta anual de reserva" },
  ];
  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold"><span>💰</span><PiggyBank className="w-5 h-5 text-primary" />Reserva Pessoal</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">R$</span>
                <Input type="number" step="0.01" min="0" value={buf[key] ?? ""} onChange={e => update(key, e.target.value)} className="h-9 text-sm" placeholder="0,00" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricaCard label="Meta Mensal"        value={dados.valorMensalDesejado} variant="blue" />
          <MetricaCard label="Reservado Este Mês" value={dados.valorReservadoMes}   variant={pctMes >= 100 ? "green" : "gray"} />
          <MetricaCard label="Falta Este Mês"     value={faltaMes}                  variant={faltaMes > 0 ? "orange" : "green"} />
          <MetricaCard label="Total Acumulado"    value={dados.valorJaReservado}     variant="blue" />
        </div>
        {dados.valorMensalDesejado > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">Progresso do Mês</span><span className={`font-bold ${pctMes >= 100 ? "text-emerald-600" : "text-foreground"}`}>{pctMes.toFixed(1)}%</span></div>
            <Barra pct={pctMes} cor={pctMes >= 100 ? "bg-emerald-500" : "bg-primary"} />
            <p className="text-xs text-muted-foreground">{pctMes >= 100 ? "✓ Meta mensal atingida!" : `Faltam ${formatarMoeda(faltaMes)} para a meta de ${formatarMoeda(dados.valorMensalDesejado)}`}</p>
          </div>
        )}
        {dados.metaAnual > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">Progresso da Meta Anual</span><span className={`font-bold ${pctAnual >= 100 ? "text-emerald-600" : "text-foreground"}`}>{pctAnual.toFixed(1)}%</span></div>
            <Barra pct={pctAnual} cor={pctAnual >= 100 ? "bg-emerald-500" : pctAnual >= 50 ? "bg-blue-500" : "bg-primary"} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Acumulado: {formatarMoeda(dados.valorJaReservado)}</span><span>Meta: {formatarMoeda(dados.metaAnual)}</span></div>
            {faltaAnual > 0 && <p className="text-xs text-muted-foreground">Faltam {formatarMoeda(faltaAnual)} para a meta anual.{dados.valorMensalDesejado > 0 && ` Com ${formatarMoeda(dados.valorMensalDesejado)}/mês, mais ${Math.ceil(faltaAnual / dados.valorMensalDesejado)} meses.`}</p>}
            {pctAnual >= 100 && <p className="text-xs text-emerald-600 font-medium">✓ Meta anual atingida!</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Aposentadoria ─────────────────────────────────────────────────
function Aposentadoria() {
  const [dados, setDados] = useState<DadosAposentadoria>(() => lsGet(LS_APOS, APOS_DEFAULT));
  const [buf, setBuf] = useState<Record<string, string>>(() => {
    const d = lsGet(LS_APOS, APOS_DEFAULT);
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ? String(v) : ""]));
  });
  const updateNum = (field: keyof DadosAposentadoria, raw: string) => {
    setBuf(prev => ({ ...prev, [field]: raw }));
    const n = parseFloat(raw) || 0;
    setDados(prev => { const next = { ...prev, [field]: n }; lsSet(LS_APOS, next); return next; });
  };
  const anosRestantes    = Math.max(0, dados.idadeAposentadoria - dados.idadeAtual);
  const mesesRestantes   = anosRestantes * 12;
  const acumuladoLinear  = dados.reservaAtual + dados.valorMensal * mesesRestantes;
  const quantoFalta      = Math.max(0, dados.meta - dados.reservaAtual);
  const pctAtual         = dados.meta > 0 ? Math.min(100, (dados.reservaAtual / dados.meta) * 100) : 0;
  const pctProjetado     = dados.meta > 0 ? Math.min(100, (acumuladoLinear / dados.meta) * 100) : 0;
  const metaAtingivel    = dados.meta > 0 && acumuladoLinear >= dados.meta;
  const CAMPOS: { key: keyof DadosAposentadoria; label: string; tipo: "idade" | "moeda" }[] = [
    { key: "idadeAtual",          label: "Idade atual (anos)",                      tipo: "idade" },
    { key: "idadeAposentadoria",  label: "Idade desejada para aposentadoria",       tipo: "idade" },
    { key: "reservaAtual",        label: "Reserva atual",                           tipo: "moeda" },
    { key: "valorMensal",         label: "Valor mensal a investir/reservar",        tipo: "moeda" },
    { key: "meta",                label: "Meta financeira para aposentadoria",      tipo: "moeda" },
  ];
  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold"><span>🏦</span><Target className="w-5 h-5 text-primary" />Planejamento para Aposentadoria</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMPOS.map(({ key, label, tipo }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                {tipo === "moeda" && <span className="text-sm text-muted-foreground">R$</span>}
                <Input type="number" step={tipo === "idade" ? "1" : "0.01"} min="0" value={buf[key] ?? ""} onChange={e => updateNum(key, e.target.value)} className="h-9 text-sm" placeholder={tipo === "idade" ? "0" : "0,00"} />
                {tipo === "idade" && <span className="text-sm text-muted-foreground">anos</span>}
              </div>
            </div>
          ))}
        </div>
        {(dados.idadeAtual > 0 || dados.meta > 0 || dados.reservaAtual > 0) && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold border-b pb-2">Projeção</h3>
            {dados.idadeAtual > 0 && dados.idadeAposentadoria > dados.idadeAtual && (
              <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Prazo:</span><span className="font-semibold">{anosRestantes} ano{anosRestantes !== 1 ? "s" : ""} ({mesesRestantes} meses)</span></div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricaCard label="Meta"             value={dados.meta}           variant="blue" />
              <MetricaCard label="Acumulado Hoje"   value={dados.reservaAtual}   variant={pctAtual >= 100 ? "green" : "gray"} />
              <MetricaCard label="Quanto Falta"     value={quantoFalta}          variant={quantoFalta > 0 ? "orange" : "green"} />
              <MetricaCard label="Projeção Linear"  value={acumuladoLinear}      variant={acumuladoLinear >= dados.meta ? "green" : "gray"} />
            </div>
            {dados.meta > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">Progresso atual</span><span className={`font-bold ${pctAtual >= 100 ? "text-emerald-600" : "text-foreground"}`}>{pctAtual.toFixed(1)}%</span></div>
                <Barra pct={pctAtual} cor="bg-primary" />
              </div>
            )}
            {dados.meta > 0 && mesesRestantes > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">Projeção ao final do prazo</span><span className={`font-bold ${pctProjetado >= 100 ? "text-emerald-600" : "text-orange-600"}`}>{pctProjetado.toFixed(1)}%</span></div>
                <Barra pct={pctProjetado} cor={pctProjetado >= 100 ? "bg-emerald-500" : pctProjetado >= 50 ? "bg-blue-500" : "bg-orange-500"} />
                <p className="text-xs text-muted-foreground">{formatarMoeda(dados.reservaAtual)} + {formatarMoeda(dados.valorMensal)}/mês × {mesesRestantes} meses = <span className="font-medium text-foreground">{formatarMoeda(acumuladoLinear)}</span> projetado.</p>
              </div>
            )}
            {dados.meta > 0 && (
              <div className={`rounded-lg border p-4 ${metaAtingivel ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200"}`}>
                <p className={`text-sm font-semibold ${metaAtingivel ? "text-emerald-700" : "text-orange-700"}`}>
                  {metaAtingivel
                    ? `✓ A meta de ${formatarMoeda(dados.meta)} é atingível no prazo definido.`
                    : `Com o investimento atual, a projeção linear indica ${formatarMoeda(acumuladoLinear)} ao final do prazo — faltariam ${formatarMoeda(dados.meta - acumuladoLinear)}.`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">* Projeção linear simples, sem considerar rendimentos ou juros.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── HistoricoSection ──────────────────────────────────────────────
function HistoricoSection() {
  const hoje = hojeStr();
  const [fechamentos, setFechamentos] = useState<DadosFechamentoDiario[]>([]);
  const [lancamentosManuais, setLancamentosManuais] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtros — default: últimos 90 dias
  const [filtroInicio, setFiltroInicio] = useState(subDias(90));
  const [filtroFim, setFiltroFim] = useState(hoje);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | TipoLancamento>("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | OrigemLancamento>("todos");
  const [busca, setBusca] = useState("");
  const [mostrarSoAuto, setMostrarSoAuto] = useState(false);

  useEffect(() => {
    return fechamentoDiarioAPI.observarTodos(lista => {
      setFechamentos(lista.filter(f => f.status === "finalizado"));
    });
  }, []);

  useEffect(() => {
    setCarregando(true);
    if (!fbDisponivel()) {
      setLancamentosManuais(lsGetArray<Lancamento>("nicolina_fluxo_lancamentos_v2"));
      setCarregando(false);
      return;
    }
    return dbOnValue(dbRef(database, FB_LANCAMENTOS), (snap) => {
      const s = snap as { exists: () => boolean; val: () => Record<string, Lancamento> };
      if (!s.exists()) { setLancamentosManuais([]); setCarregando(false); return; }
      setLancamentosManuais(Object.values(s.val()));
      setCarregando(false);
    });
  }, []);

  const lancamentosAuto = useMemo(() => derivarLancamentos(fechamentos), [fechamentos]);
  const todosLancamentos = useMemo(() => [...lancamentosAuto, ...lancamentosManuais], [lancamentosAuto, lancamentosManuais]);

  const gruposUsados = useMemo(() => {
    const ids = new Set(todosLancamentos.map(l => l.grupo));
    return TODAS_CATEGORIAS.filter(c => ids.has(c.id));
  }, [todosLancamentos]);

  const filtrados = useMemo(() => {
    const buscaLower = busca.toLowerCase();
    return todosLancamentos.filter(l => {
      if (l.data < filtroInicio || l.data > filtroFim) return false;
      if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
      if (filtroGrupo !== "todos" && l.grupo !== filtroGrupo) return false;
      if (filtroOrigem !== "todos" && l.origem !== filtroOrigem) return false;
      if (mostrarSoAuto && !l.auto) return false;
      if (busca && !l.grupoNome.toLowerCase().includes(buscaLower) && !l.descricao.toLowerCase().includes(buscaLower) && !ORIGEM_LABEL[l.origem].toLowerCase().includes(buscaLower)) return false;
      return true;
    }).sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));
  }, [todosLancamentos, filtroInicio, filtroFim, filtroTipo, filtroGrupo, filtroOrigem, busca, mostrarSoAuto]);

  const totais = useMemo(() => {
    const entradas = filtrados.filter(l => l.tipo === "entrada");
    const efetivas   = entradas.filter(l => l.classificacao !== "recebivel").reduce((s, l) => s + l.valor, 0);
    const recebiveis = entradas.filter(l => l.classificacao === "recebivel").reduce((s, l) => s + l.valor, 0);
    const faturamento = efetivas + recebiveis;
    const saidas = filtrados.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
    return { faturamento, efetivas, recebiveis, saidas, resultado: faturamento - saidas, count: filtrados.length };
  }, [filtrados]);

  const limparFiltros = () => {
    setFiltroInicio(subDias(90)); setFiltroFim(hoje);
    setFiltroTipo("todos"); setFiltroGrupo("todos"); setFiltroOrigem("todos");
    setBusca(""); setMostrarSoAuto(false);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span>🕒</span><Clock className="w-5 h-5 text-primary" />Histórico Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">De</Label>
              <Input type="date" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} className="w-36 h-8 text-sm" />
              <Label className="text-xs text-muted-foreground whitespace-nowrap">até</Label>
              <Input type="date" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} className="w-36 h-8 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(hoje); setFiltroFim(hoje); }}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(inicioSemanaStr()); setFiltroFim(hoje); }}>Semana</Button>
              <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(inicioMesStr()); setFiltroFim(hoje); }}>Mês</Button>
              <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(inicioAnoStr()); setFiltroFim(hoje); }}>Ano</Button>
              <Button variant="outline" size="sm" onClick={() => { setFiltroInicio(subDias(90)); setFiltroFim(hoje); }}>90 dias</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." className="pl-8 h-8 text-sm" />
            </div>

            {/* Tipo */}
            <div className="flex rounded-md border overflow-hidden h-8">
              {(["todos", "entrada", "saida"] as const).map((t, i) => (
                <button key={t} onClick={() => setFiltroTipo(t)} className={`px-3 text-xs font-medium transition-colors ${i > 0 ? "border-l" : ""} ${filtroTipo === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                  {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
                </button>
              ))}
            </div>

            {/* Grupo */}
            <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
              <option value="todos">Todos os grupos</option>
              {gruposUsados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            {/* Origem */}
            <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value as "todos" | OrigemLancamento)} className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none">
              <option value="todos">Todas as origens</option>
              {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Somente auto */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={mostrarSoAuto} onChange={e => setMostrarSoAuto(e.target.checked)} className="rounded" />
              Somente automáticos
            </label>

            <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-xs text-muted-foreground">Limpar filtros</Button>
          </div>
        </div>

        {/* Resumo do resultado filtrado */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard label="Faturamento"       value={totais.faturamento} variant="blue" />
            <MetricaCard label="Entradas Efetivas" value={totais.efetivas}    variant="green" />
            <MetricaCard label="Saídas"            value={totais.saidas}      variant="red" />
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registros</p>
              <p className="text-xl font-bold mt-1">{totais.count}</p>
            </div>
          </div>
          {totais.recebiveis > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 flex items-start gap-2 text-xs">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-blue-800">
                <span className="font-semibold">Recebíveis Cartão/Pix no período: {formatarMoeda(totais.recebiveis)}</span>
                {" "}— esses valores são vendas realizadas, mas ainda não liquidadas bancariamente.
                Ao registrar a entrada no banco, identifique a origem para não gerar dupla contagem.
              </span>
            </div>
          )}
        </div>

        {/* Tabela de histórico */}
        {carregando ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />Carregando histórico...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Nenhum registro encontrado com os filtros selecionados.</div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-4 py-3 whitespace-nowrap">Data</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Grupo</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Descrição</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Tipo</th>
                    <th className="text-left px-4 py-3 whitespace-nowrap">Origem</th>
                    <th className="text-right px-4 py-3 whitespace-nowrap">Valor</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map(l => (
                    <React.Fragment key={l.id}>
                      <tr
                        onClick={() => setSelectedId(s => s === l.id ? null : l.id)}
                        className={`cursor-pointer transition-colors ${selectedId === l.id ? "bg-blue-50" : l.auto ? "bg-orange-50/30 hover:bg-orange-50/60" : "hover:bg-muted/30"}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium">{formatarData(l.data)}</span>
                          {l.data === hoje && <span className="ml-1.5 text-xs text-primary">(hoje)</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium">{l.grupoNome}</span>
                          {l.auto && <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">⚡</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{l.descricao || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {l.tipo === "saida"
                            ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Saída</span>
                            : l.classificacao === "recebivel"
                              ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Recebível</span>
                              : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Entrada</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORIGEM_BADGE[l.origem]}`}>{ORIGEM_LABEL[l.origem]}</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${l.tipo === "entrada" ? "text-emerald-700" : "text-red-600"}`}>
                          {l.tipo === "entrada" ? "+" : "-"}{formatarMoeda(l.valor)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {selectedId === l.id
                            ? <ChevronUp className="w-4 h-4 text-primary" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </td>
                      </tr>

                      {/* Detalhe expandido */}
                      {selectedId === l.id && (
                        <tr className="bg-blue-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data</p><p className="mt-0.5 font-medium">{formatarData(l.data)}</p></div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Grupo Financeiro</p><p className="mt-0.5 font-medium">{l.grupoNome}</p></div>
                              <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Classificação</p>
                                {l.tipo === "saida"
                                  ? <span className="mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">Saída</span>
                                  : l.classificacao === "recebivel"
                                    ? <span className="mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">Recebível (Cartão/Pix)</span>
                                    : <span className="mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">Entrada Efetiva</span>}
                                {l.classificacao === "recebivel" && <p className="text-xs text-blue-600 mt-1">Liquidação futura via banco — não some novamente ao registrar.</p>}
                              </div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Valor</p><p className={`mt-0.5 text-base font-bold ${l.tipo === "saida" ? "text-red-600" : l.classificacao === "recebivel" ? "text-blue-700" : "text-emerald-700"}`}>{l.tipo === "entrada" ? "+" : "-"}{formatarMoeda(l.valor)}</p></div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Origem</p><span className={`mt-0.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ORIGEM_BADGE[l.origem]}`}>{ORIGEM_LABEL[l.origem]}</span></div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Descrição</p><p className="mt-0.5 text-muted-foreground">{l.descricao || "Sem descrição"}</p></div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tipo de registro</p><p className="mt-0.5">{l.auto ? <span className="text-orange-600 font-medium">⚡ Automático (Fechamento de Caixa)</span> : <span className="text-blue-600 font-medium">✎ Manual</span>}</p></div>
                              <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Criado em</p><p className="mt-0.5 text-xs text-muted-foreground">{l.criadoEm ? formatarDataHora(l.criadoEm) : "—"}</p></div>
                              {l.fechamentoId && <div className="col-span-2"><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">ID do Fechamento</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{l.fechamentoId}</p></div>}
                              <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-right"><button onClick={() => setSelectedId(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"><X className="w-3 h-3" />Fechar</button></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 bg-muted/30 border-t text-xs text-muted-foreground">
              Mostrando {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""} — clique em um registro para ver o detalhe completo.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── FluxoCaixa (página) ───────────────────────────────────────────
export default function FluxoCaixa() {
  return (
    <ProtecaoAdministracao>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">💰 Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Central financeira exclusiva do proprietário</p>
        </div>

        <PainelGerencial />
        <LancamentosSection />
        <DuplicatasSection />
        <FluxoDiario />

        <SecaoPlaceholder
          titulo="Planejamento"
          descricao="Metas financeiras, orçamento previsto versus realizado e projeções futuras."
          emoji="🎯"
          icon={<Target className="w-5 h-5 text-primary" />}
        />

        <ReservaPessoal />
        <Aposentadoria />
        <HistoricoSection />
      </div>
    </ProtecaoAdministracao>
  );
}
