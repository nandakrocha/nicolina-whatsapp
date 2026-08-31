import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  MessageCircle, Wifi, WifiOff, Bot, Clock, Users, History,
  Settings, AlertCircle, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  BookOpen, X, Send, CalendarCheck, Check, Search,
} from "lucide-react";
import { toast } from "sonner";
import { database, ref, set, remove, onValue, push, update, authReadyPromise } from "../services/firebase";
import { clientesAPI, produtosAPI, type Cliente, type Produto } from "../services/api";

// URL pública do webhook Supabase Edge Function
// Caminhos reservados no Firebase TESTE para esta integração
export const WA_PATHS = {
  root:           "nicolina/integracao_whatsapp",
  mensagens:      "nicolina/integracao_whatsapp/mensagens",
  pedidos:        "nicolina/integracao_whatsapp/pedidos",
  pendencias:     "nicolina/integracao_whatsapp/pendencias",
  conversas:      "nicolina/integracao_whatsapp/conversas",
  grupos:         "nicolina/integracao_whatsapp/grupos",
  configuracoes:  "nicolina/integracao_whatsapp/configuracoes",
  produtos_alias: "nicolina/integracao_whatsapp/produtos_alias",
} as const;

// ─── Grupos ────────────────────────────────────────────────────────────────

interface GrupoWhatsApp {
  id: string;
  nomeGrupo: string;
  identificadorGrupo: string;
  clienteId: string;
  clienteNome: string;
  status: "ativo" | "inativo";
  criadoEm: string;
}

// ─── Produto Alias ──────────────────────────────────────────────────────────

interface ProdutoAlias {
  id: string;
  produtoId: string;
  produtoNome: string;
  sinonimos: string[];
  criadoEm: string;
}

// ─── Configuração da integração (sem segredos — apenas dados públicos) ───────

interface ConfiguracaoWA {
  whatsappConfigurado: boolean;
  metaConfigurado: boolean;
  automacaoAtiva: boolean;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl: string;
  ultimaMensagemEm: string | null;
}

// ─── Pedido recebido via WhatsApp ────────────────────────────────────────────

interface PedidoWA {
  id: string;
  dataHora: any;
  telefone: string;
  cliente: string;
  grupo: string;
  resumo: string;
  status: string;
  clienteCodigo?: string;
  processada?: boolean;
}

// ─── Mensagem pendente de processamento ─────────────────────────────────────

interface MensagemPendente {
  id: string;
  telefone: string;
  texto: string;
  dataHora: string;
  processadaEm?: string;
  clienteId?: string;
  clienteCodigo?: string;
  clienteNome?: string;
}

// ─── Conversa (agrupamento de mensagens do mesmo telefone) ───────────────────

type StatusConversa = "novo" | "em atendimento" | "pedido em andamento" | "concluído";

interface Conversa {
  chave: string;           // identificador único: telefone ou id da primeira msg
  telefone: string;
  cliente: string;
  ultimaMensagemTs: any;
  ultimaResumo: string;
  totalMensagens: number;
  mensagens: PedidoWA[];   // todas as msgs desta conversa, mais recente primeiro
}

// ────────────────────────────────────────────────────────────────────────────

// Converte qualquer formato de data (ISO, Unix em segundos, Unix em ms) para
// string pt-BR. Retorna "—" se o valor for ausente ou inválido.
function formatarDataHora(valor: any): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  let d: Date;
  const n = Number(valor);
  if (!isNaN(n) && n > 0) {
    // Unix em segundos (< 1 trilhão) ou em milissegundos
    d = new Date(n < 1_000_000_000_000 ? n * 1000 : n);
  } else {
    d = new Date(String(valor));
  }
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Converte qualquer campo de timestamp para número (ms) para ordenação.
function toMs(valor: any): number {
  if (!valor) return 0;
  const n = Number(valor);
  if (!isNaN(n) && n > 0) return n < 1_000_000_000_000 ? n * 1000 : n;
  const d = new Date(String(valor));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function IntegracaoWhatsApp() {

  // ── Configuração e pedidos ────────────────────────────────────────────────
  const [configuracao, setConfiguracao] = useState<ConfiguracaoWA | null>(null);
  const [pedidos, setPedidos] = useState<PedidoWA[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [ultimaMensagemTs, setUltimaMensagemTs] = useState<string | null>(null);
  // Conectividade detectada a partir das mensagens reais recebidas
  const [whatsappConectado, setWhatsappConectado] = useState(false);
  const [metaConectado, setMetaConectado] = useState(false);
  // Conversas agrupadas por telefone
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  // Status das conversas (frontend only — não gravado no Firebase nesta etapa)
  const [statusConversas, setStatusConversas] = useState<Record<string, StatusConversa>>({});

  // ── Pendências (processada !== true) e Histórico (processada === true) ───
  const [mensagensPendentes, setMensagensPendentes] = useState<MensagemPendente[]>([]);
  const [mensagensHistorico, setMensagensHistorico] = useState<MensagemPendente[]>([]);

  // ── Resposta manual ───────────────────────────────────────────────────────
  const [textoResposta, setTextoResposta] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);

  // ── Grupos ────────────────────────────────────────────────────────────────
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);

  const [modalGrupoAberto, setModalGrupoAberto] = useState(false);
  const [editandoGrupo, setEditandoGrupo] = useState<GrupoWhatsApp | null>(null);
  const [formGrupo, setFormGrupo] = useState<Omit<GrupoWhatsApp, "id" | "criadoEm">>({
    nomeGrupo: "", identificadorGrupo: "", clienteId: "", clienteNome: "", status: "ativo",
  });
  const [salvandoGrupo, setSalvandoGrupo] = useState(false);

  // ── Produtos Alias ────────────────────────────────────────────────────────
  const [aliases, setAliases] = useState<ProdutoAlias[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoAliases, setCarregandoAliases] = useState(true);

  const [modalAliasAberto, setModalAliasAberto] = useState(false);
  const [editandoAlias, setEditandoAlias] = useState<ProdutoAlias | null>(null);
  const [formAlias, setFormAlias] = useState<{ produtoId: string; produtoNome: string; sinonimos: string[] }>({
    produtoId: "", produtoNome: "", sinonimos: [],
  });
  const [sinonimoDraft, setSinonimoDraft] = useState("");
  const [salvandoAlias, setSalvandoAlias] = useState(false);
  const sinonimoDraftRef = useRef<HTMLInputElement>(null);
  const [buscaAlias, setBuscaAlias] = useState("");
  const [aliasExpandido, setAliasExpandido] = useState<Record<string, boolean>>({});
  const [confirmarExclusaoAlias, setConfirmarExclusaoAlias] = useState<ProdutoAlias | null>(null);
  const [erroSinonimo, setErroSinonimo] = useState<string | null>(null);

  // ── Modal de agendamento por sistema ─────────────────────────────────────

  interface ModalAgendamento {
    telefone: string;
    resumo: string;
    clienteNome: string;
    clienteCodigo: string;
    agendando: boolean;
    erro: string | null;
  }
  const [modalAgendamento, setModalAgendamento] = useState<ModalAgendamento | null>(null);

  // ── Listener: configuracoes ───────────────────────────────────────────────

  useEffect(() => {
    if (!database) return;
    let mounted = true;
    let unsub: (() => void) | undefined;
    authReadyPromise.then(() => {
      if (!mounted) return;
      unsub = onValue(ref(database, WA_PATHS.configuracoes), (snap) => {
        if (!mounted) return;
        if (!snap.exists()) {
          setConfiguracao(null);
          return;
        }
        const v = snap.val();
        setConfiguracao({
          whatsappConfigurado: v.whatsappConfigurado === true,
          metaConfigurado:     v.metaConfigurado === true,
          automacaoAtiva:      v.automacaoAtiva === true,
          phoneNumberId:       v.phoneNumberId ?? "",
          wabaId:              v.wabaId ?? "",
          webhookUrl:          v.webhookUrl ?? "",
          ultimaMensagemEm:    v.ultimaMensagemEm ?? null,
        });
      });
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  // ── Listener: mensagens → tabela "Pedidos Recebidos" + timestamp status ───
  // Lê nicolina/integracao_whatsapp/mensagens em tempo real.
  // Aguarda authReadyPromise para garantir que o auth anônimo esteja pronto
  // antes do primeiro acesso (permission denied encerraria o listener).

  useEffect(() => {
    if (!database) { setCarregandoPedidos(false); return; }
    let mounted = true;
    let unsub: (() => void) | undefined;
    authReadyPromise.then(() => {
      if (!mounted) return;
      unsub = onValue(ref(database, WA_PATHS.mensagens), (snap) => {
        if (!snap.exists()) {
          setPedidos([]);
          setUltimaMensagemTs(null);
          setWhatsappConectado(false);
          setMetaConectado(false);
          setCarregandoPedidos(false);
          return;
        }
        const entradas = Object.entries(snap.val()) as [string, any][];

        const lista: PedidoWA[] = entradas
          .filter(([id, v]) => {
            // Ignora registros técnicos pelo ID da chave Firebase
            if (id === "teste_conexao") return false;
            // Mantém apenas registros com idMensagem OU com conteúdo real
            const temId = Boolean(v.idMensagem ?? v.messageId ?? v.wamid);
            const temConteudo = Boolean(
              v.texto ?? v.body ?? v.text?.body ?? v.message ?? v.resumo,
            );
            return temId || temConteudo;
          })
          .map(([id, v]) => {
            // timestamp — prioridade: timestamp → dataHora → createdAt
            const tsRaw =
              v.timestamp ?? v.dataHora ?? v.createdAt ?? v.created_at ?? null;
            // telefone — identificador da conversa
            const telefone = v.telefone ?? v.from ?? v.remetente ?? "";
            // cliente — prioridade: cliente → nomeCliente → remetente → from → telefone
            const clienteStr =
              v.cliente ?? v.nomeCliente ?? v.remetente ?? v.from ?? v.telefone ?? "";
            // resumo — corpo da mensagem em vários formatos
            const resumoStr =
              v.texto ?? v.body ?? v.text?.body ?? v.message ?? v.resumo ?? "";
            return {
              id,
              dataHora: tsRaw,
              telefone,
              cliente:  clienteStr || telefone || "—",
              grupo:    v.grupo ?? v.group ?? "WhatsApp",
              resumo:   resumoStr || "—",
              status:   v.status ?? "recebido",
              clienteCodigo: v.clienteCodigo ?? undefined,
              processada: v.processada === true || v.status === "processado",
            };
          });

        // mais recente primeiro
        lista.sort((a, b) => toMs(b.dataHora) - toMs(a.dataHora));
        setPedidos(lista);

        // Agrupar mensagens por telefone → Conversa
        const groupMap = new Map<string, { msgs: PedidoWA[]; clienteNome: string }>();
        for (const msg of lista) {
          const chave = msg.telefone || msg.id;
          if (!groupMap.has(chave)) {
            groupMap.set(chave, { msgs: [], clienteNome: msg.cliente });
          }
          const g = groupMap.get(chave)!;
          g.msgs.push(msg);
          // Prefere nome legível ao telefone/id
          if (msg.cliente !== "—" && (g.clienteNome === "—" || !g.clienteNome)) {
            g.clienteNome = msg.cliente;
          }
        }
        const conversasAgrupadas: Conversa[] = Array.from(groupMap.entries()).map(([chave, g]) => {
          const sorted = [...g.msgs].sort((a, b) => toMs(b.dataHora) - toMs(a.dataHora));
          return {
            chave,
            telefone: chave,
            cliente: g.clienteNome || "—",
            ultimaMensagemTs: sorted[0]?.dataHora ?? null,
            ultimaResumo: sorted[0]?.resumo ?? "—",
            totalMensagens: g.msgs.length,
            mensagens: sorted,
          };
        });
        // Mais recente primeiro
        conversasAgrupadas.sort((a, b) => toMs(b.ultimaMensagemTs) - toMs(a.ultimaMensagemTs));
        setConversas(conversasAgrupadas);

        // timestamp da mensagem real mais recente
        const ultimo = lista.find((p) => p.dataHora);
        setUltimaMensagemTs(ultimo?.dataHora ?? null);

        // WhatsApp conectado: há mensagem real com origem whatsapp ou idMensagem válido
        const waReal = entradas.some(
          ([id, v]) =>
            id !== "teste_conexao" &&
            (v.origem === "whatsapp" || Boolean(v.idMensagem ?? v.messageId ?? v.wamid)),
        );
        setWhatsappConectado(lista.length > 0 || waReal);
        // Meta conectado: mensagens reais chegaram pelo webhook
        setMetaConectado(lista.length > 0);
        setCarregandoPedidos(false);
      }, () => setCarregandoPedidos(false));
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  // ── Carregamentos ─────────────────────────────────────────────────────────

  useEffect(() => {
    clientesAPI.listar().then(setClientes).catch(() => setClientes([]));
    produtosAPI.listar().then(setProdutos).catch(() => setProdutos([]));
  }, []);

  useEffect(() => {
    if (!database) { setCarregandoGrupos(false); return; }
    let mounted = true;
    let unsub: (() => void) | undefined;
    authReadyPromise.then(() => {
      if (!mounted) return;
      unsub = onValue(ref(database, WA_PATHS.grupos), (snap) => {
        if (!mounted) return;
        if (!snap.exists()) { setGrupos([]); setCarregandoGrupos(false); return; }
        const lista: GrupoWhatsApp[] = Object.entries(snap.val()).map(([id, v]: any) => ({
          id,
          nomeGrupo: v.nomeGrupo ?? "",
          identificadorGrupo: v.identificadorGrupo ?? "",
          clienteId: v.clienteId ?? "",
          clienteNome: v.clienteNome ?? "",
          status: v.status ?? "ativo",
          criadoEm: v.criadoEm ?? "",
        }));
        lista.sort((a, b) => a.nomeGrupo.localeCompare(b.nomeGrupo));
        setGrupos(lista);
        setCarregandoGrupos(false);
      }, () => { if (mounted) setCarregandoGrupos(false); });
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  useEffect(() => {
    if (!database) { setCarregandoAliases(false); return; }
    let mounted = true;
    let unsub: (() => void) | undefined;
    authReadyPromise.then(() => {
      if (!mounted) return;
      unsub = onValue(ref(database, WA_PATHS.produtos_alias), (snap) => {
        if (!mounted) return;
        if (!snap.exists()) { setAliases([]); setCarregandoAliases(false); return; }
        const lista: ProdutoAlias[] = Object.entries(snap.val()).map(([id, v]: any) => ({
          id,
          produtoId: v.produtoId ?? "",
          produtoNome: v.produtoNome ?? "",
          sinonimos: Array.isArray(v.sinonimos) ? v.sinonimos : [],
          criadoEm: v.criadoEm ?? "",
        }));
        lista.sort((a, b) => a.produtoNome.localeCompare(b.produtoNome));
        setAliases(lista);
        setCarregandoAliases(false);
      }, () => { if (mounted) setCarregandoAliases(false); });
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  // ── Listener: mensagensPendentes (processada === false) ──────────────────

  useEffect(() => {
    if (!database) return;
    let mounted = true;
    let unsub: (() => void) | undefined;
    const COMANDO_INTERNO = /^ok\s+agendado(?:\s+\d+)?$/i;
    authReadyPromise.then(() => {
      if (!mounted) return;
      unsub = onValue(ref(database, WA_PATHS.conversas), (snap) => {
        if (!mounted) return;
        if (!snap.exists()) { setMensagensPendentes([]); return; }
        const pendentes: MensagemPendente[] = [];
        Object.entries(snap.val()).forEach(([telefone, conversa]: any) => {
          const mp = conversa?.mensagensPendentes;
          if (!mp || typeof mp !== "object") return;
          Object.entries(mp).forEach(([id, msg]: any) => {
            if (COMANDO_INTERNO.test((msg.texto ?? "").trim())) return;
            if (msg?.processada !== true) {
              pendentes.push({
                id,
                telefone: msg.telefone ?? telefone,
                texto: msg.texto ?? "",
                dataHora: msg.dataHora ?? "",
                processadaEm: msg.processadaEm,
                clienteId: msg.clienteId,
                clienteCodigo: msg.clienteCodigo,
                clienteNome: msg.clienteNome,
              });
            }
          });
        });
        pendentes.sort((a, b) => (a.dataHora > b.dataHora ? -1 : 1));
        setMensagensPendentes(pendentes);
        // Carrega statuses persistidos no Firebase e sincroniza com o estado local
        setStatusConversas((prev) => {
          const merged = { ...prev };
          Object.entries(snap.val()).forEach(([telefone, conversa]: any) => {
            if (conversa?.status) {
              const st = conversa.status === "concluido" ? "concluído" : conversa.status as StatusConversa;
              merged[telefone] = st;
            }
          });
          return merged;
        });
      }, () => { if (mounted) setMensagensPendentes([]); });
    });
    return () => { mounted = false; unsub?.(); };
  }, []);

  // ── Listener: Histórico (mensagens processadas em WA_PATHS.mensagens) ─────

  useEffect(() => {
    if (!database) return;
    const COMANDO_INTERNO = /^ok\s+agendado(?:\s+\d+)?$/i;
    const unsub = onValue(ref(database, WA_PATHS.mensagens), (snap) => {
      if (!snap.exists()) { setMensagensHistorico([]); return; }
      const historico: MensagemPendente[] = [];
      Object.entries(snap.val()).forEach(([id, v]: any) => {
        const processada = v?.processada === true || v?.status === "processado";
        if (!processada) return;
        const texto = v.texto ?? v.body ?? v.text?.body ?? v.message ?? v.resumo ?? "";
        if (COMANDO_INTERNO.test(texto.trim())) return;
        historico.push({
          id,
          telefone: v.telefone ?? v.from ?? v.remetente ?? "",
          texto,
          dataHora: v.dataHora ?? v.timestamp ?? v.createdAt ?? "",
          processadaEm: v.processadaEm ?? "",
          clienteId: v.clienteId,
          clienteCodigo: v.clienteCodigo,
          clienteNome: v.clienteNome ?? v.cliente ?? v.nomeCliente ?? "",
        });
      });
      historico.sort((a, b) => ((a.processadaEm ?? "") > (b.processadaEm ?? "") ? -1 : 1));
      setMensagensHistorico(historico);
    }, () => setMensagensHistorico([]));
    return () => unsub();
  }, []);

  // ── Grupos — ações ────────────────────────────────────────────────────────

  const abrirNovoGrupo = () => {
    setEditandoGrupo(null);
    setFormGrupo({ nomeGrupo: "", identificadorGrupo: "", clienteId: "", clienteNome: "", status: "ativo" });
    setModalGrupoAberto(true);
  };

  const abrirEditarGrupo = (g: GrupoWhatsApp) => {
    setEditandoGrupo(g);
    setFormGrupo({
      nomeGrupo: g.nomeGrupo, identificadorGrupo: g.identificadorGrupo,
      clienteId: g.clienteId, clienteNome: g.clienteNome, status: g.status,
    });
    setModalGrupoAberto(true);
  };

  const selecionarCliente = (clienteId: string) => {
    const c = clientes.find((x) => x.id === clienteId);
    setFormGrupo((f) => ({ ...f, clienteId, clienteNome: c?.nome ?? "" }));
  };

  const salvarGrupo = async () => {
    if (!formGrupo.nomeGrupo.trim()) { toast.error("Informe o nome do grupo."); return; }
    if (!formGrupo.clienteId) { toast.error("Selecione um cliente."); return; }
    if (!database) { toast.error("Firebase não disponível."); return; }
    setSalvandoGrupo(true);
    try {
      if (editandoGrupo) {
        await set(ref(database, `${WA_PATHS.grupos}/${editandoGrupo.id}`), { ...formGrupo, criadoEm: editandoGrupo.criadoEm });
        toast.success("Vínculo atualizado.");
      } else {
        await set(push(ref(database, WA_PATHS.grupos)), { ...formGrupo, criadoEm: new Date().toISOString() });
        toast.success("Vínculo cadastrado.");
      }
      setModalGrupoAberto(false);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e?.message ?? String(e)));
    } finally {
      setSalvandoGrupo(false);
    }
  };

  const excluirGrupo = async (g: GrupoWhatsApp) => {
    if (!database) return;
    if (!confirm(`Excluir vínculo "${g.nomeGrupo}"?`)) return;
    try {
      await remove(ref(database, `${WA_PATHS.grupos}/${g.id}`));
      toast.success("Vínculo excluído.");
    } catch (e: any) {
      toast.error("Erro ao excluir: " + (e?.message ?? String(e)));
    }
  };

  const alternarStatusGrupo = async (g: GrupoWhatsApp) => {
    if (!database) return;
    const novoStatus = g.status === "ativo" ? "inativo" : "ativo";
    try {
      await set(ref(database, `${WA_PATHS.grupos}/${g.id}`), { ...g, status: novoStatus });
      toast.success(`Grupo ${novoStatus === "ativo" ? "ativado" : "desativado"}.`);
    } catch (e: any) {
      toast.error("Erro ao alterar status: " + (e?.message ?? String(e)));
    }
  };

  // ── Status da conversa — persistência no Firebase ────────────────────────

  const atualizarStatusConversa = async (conversa: Conversa, novoStatus: StatusConversa) => {
    setStatusConversas((prev) => ({ ...prev, [conversa.chave]: novoStatus }));
    if (!database) return;
    const telefone = conversa.telefone || conversa.chave;
    const statusFirebase = novoStatus === "concluído" ? "concluido" : novoStatus;
    try {
      await update(ref(database, `${WA_PATHS.conversas}/${telefone}`), {
        status: statusFirebase,
        ...(novoStatus === "concluído" ? { concluidoEm: new Date().toISOString() } : {}),
      });
      if (novoStatus === "concluído") {
        const msgRecente = conversa.mensagens[0];
        if (msgRecente?.id) {
          await update(ref(database, `${WA_PATHS.mensagens}/${msgRecente.id}`), {
            status: "processado",
            processada: true,
            processadaEm: new Date().toISOString(),
            clienteNome: conversa.cliente,
            telefone: conversa.telefone,
            texto: msgRecente.resumo ?? conversa.ultimaResumo ?? "",
            dataHora: msgRecente.dataHora ?? conversa.ultimaMensagemTs ?? "",
          });
        }
      }
    } catch (e: any) {
      toast.error("Erro ao salvar status: " + (e?.message ?? String(e)));
    }
  };

  // ── Utilitário: normalização para comparação ─────────────────────────────
  // Usada apenas para validação de interface; não altera dados gravados.

  const normalizarTexto = (s: string): string =>
    s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

  // ── Produtos Alias — ações ────────────────────────────────────────────────

  const abrirNovoAlias = () => {
    setEditandoAlias(null);
    setFormAlias({ produtoId: "", produtoNome: "", sinonimos: [] });
    setSinonimoDraft("");
    setErroSinonimo(null);
    setModalAliasAberto(true);
  };

  const abrirEditarAlias = (a: ProdutoAlias) => {
    setEditandoAlias(a);
    setFormAlias({ produtoId: a.produtoId, produtoNome: a.produtoNome, sinonimos: [...a.sinonimos] });
    setSinonimoDraft("");
    setErroSinonimo(null);
    setModalAliasAberto(true);
  };

  const selecionarProduto = (produtoId: string) => {
    const p = produtos.find((x) => x.id === produtoId);
    setFormAlias((f) => ({ ...f, produtoId, produtoNome: p?.nome ?? "" }));
  };

  const adicionarSinonimo = () => {
    const termo = sinonimoDraft.trim().toLowerCase();
    if (!termo) return;
    const termoNorm = normalizarTexto(termo);

    // Duplicidade dentro do mesmo produto (comparação normalizada)
    if (formAlias.sinonimos.some((s) => normalizarTexto(s) === termoNorm)) {
      setErroSinonimo("Este sinônimo já está cadastrado para este produto.");
      return;
    }

    // Conflito com outro produto (exceto o produto sendo editado)
    for (const alias of aliases) {
      if (editandoAlias && alias.id === editandoAlias.id) continue;
      if (alias.sinonimos.some((s) => normalizarTexto(s) === termoNorm)) {
        setErroSinonimo(`Este sinônimo já está associado ao produto "${alias.produtoNome}".`);
        return;
      }
    }

    // Conflito com nome oficial de outro produto
    const produtoConflito = produtos.find(
      (p) => normalizarTexto(p.nome) === termoNorm && p.id !== formAlias.produtoId,
    );
    if (produtoConflito) {
      setErroSinonimo(`"${produtoConflito.nome}" já é um produto oficial e não pode ser usado como sinônimo de outro produto.`);
      return;
    }

    setErroSinonimo(null);
    setFormAlias((f) => ({ ...f, sinonimos: [...f.sinonimos, termo] }));
    setSinonimoDraft("");
    sinonimoDraftRef.current?.focus();
  };

  const removerSinonimo = (termo: string) => {
    setFormAlias((f) => ({ ...f, sinonimos: f.sinonimos.filter((s) => s !== termo) }));
  };

  const salvarAlias = async () => {
    if (!formAlias.produtoId) { toast.error("Selecione um produto."); return; }
    if (formAlias.sinonimos.length === 0) { toast.error("Adicione pelo menos um sinônimo."); return; }
    if (!database) { toast.error("Firebase não disponível."); return; }

    // Confirma sinônimo ainda digitado no campo (sem validação duplicada aqui)
    const draft = sinonimoDraft.trim().toLowerCase();
    const sinonimosFinais = draft && !formAlias.sinonimos.includes(draft)
      ? [...formAlias.sinonimos, draft]
      : formAlias.sinonimos;

    setSalvandoAlias(true);
    try {
      const payload = {
        produtoId: formAlias.produtoId,
        produtoNome: formAlias.produtoNome,
        sinonimos: sinonimosFinais,
        criadoEm: editandoAlias?.criadoEm ?? new Date().toISOString(),
      };
      if (editandoAlias) {
        await set(ref(database, `${WA_PATHS.produtos_alias}/${editandoAlias.id}`), payload);
        toast.success("Sinônimos atualizados.");
      } else {
        await set(push(ref(database, WA_PATHS.produtos_alias)), payload);
        toast.success("Sinônimos cadastrados.");
      }
      setModalAliasAberto(false);
    } catch (e: any) {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvandoAlias(false);
    }
  };

  const excluirAlias = (a: ProdutoAlias) => {
    setConfirmarExclusaoAlias(a);
  };

  const confirmarExclusaoAliasHandler = async () => {
    if (!confirmarExclusaoAlias || !database) return;
    try {
      await remove(ref(database, `${WA_PATHS.produtos_alias}/${confirmarExclusaoAlias.id}`));
      toast.success("Reconhecimento excluído.");
      setConfirmarExclusaoAlias(null);
    } catch (e: any) {
      toast.error("Erro ao excluir: " + (e?.message ?? String(e)));
    }
  };

  // ── Resposta manual: POST para Cloud Run ─────────────────────────────────
  // phoneNumberId vem de configuracoes.phoneNumberId lido do Firebase.
  // Se o nó configuracoes não estiver preenchido, o campo chegará vazio e o
  // Cloud Run retornará erro — sem inventar valor aqui.

  const enviarMensagem = async () => {
    if (!conversaSelecionada || !textoResposta.trim() || enviandoResposta) return;
    const phoneNumberId = configuracao?.phoneNumberId ?? "";
    setEnviandoResposta(true);
    try {
      const response = await fetch(
        "https://whatsapp-webhook-592701719321.southamerica-east1.run.app/send-message",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefone: conversaSelecionada.telefone,
            mensagem: textoResposta.trim(),
            phoneNumberId,
          }),
        },
      );
      if (!response.ok) {
        const corpo = await response.text().catch(() => "");
        throw new Error(corpo || `HTTP ${response.status}`);
      }
      setTextoResposta("");
      toast.success("Mensagem enviada");
    } catch (e: any) {
      toast.error("Erro ao enviar mensagem: " + (e?.message ?? String(e)));
    } finally {
      setEnviandoResposta(false);
    }
  };

  // ── Agendamento por sistema — usa o mesmo /send-message do enviarMensagem ─

  const agendarPorSistema = async () => {
    if (!modalAgendamento) return;
    const codigo = modalAgendamento.clienteCodigo.trim();
    if (!codigo) { toast.error("Informe o código do cliente."); return; }

    setModalAgendamento((prev) => prev ? { ...prev, agendando: true, erro: null } : null);

    const phoneNumberId = configuracao?.phoneNumberId ?? "";
    try {
      const response = await fetch(
        "https://whatsapp-webhook-592701719321.southamerica-east1.run.app/send-message",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefone: modalAgendamento.telefone,
            mensagem: `ok agendado ${codigo}`,
            phoneNumberId,
          }),
        },
      );
      const json = await response.json().catch(() => null);

      // O webhook só responde ok quando interpretou e gravou a mensagem
      // inteira. HTTP 200 sozinho não significa que a encomenda foi criada.
      const criadas = Number(json?.quantidadeEncomendasCriadas) || 0;
      if (!response.ok || json?.ok === false || criadas < 1) {
        const pendencias: Array<{ texto?: string }> = json?.pendencias ?? [];
        const detalhe = pendencias
          .map((p) => `• ${p?.texto ?? ""}`)
          .filter((linha) => linha.trim() !== "•")
          .join("\n");

        const msg =
          json?.erro ?? json?.error ?? json?.mensagem ?? `HTTP ${response.status}`;

        setModalAgendamento((prev) =>
          prev
            ? {
                ...prev,
                agendando: false,
                erro: detalhe
                  ? `${msg}\n\nNão foi possível interpretar:\n${detalhe}`
                  : String(msg),
              }
            : null,
        );
        return;
      }
      // Sucesso confirmado
      setModalAgendamento(null);
      setConversaSelecionada(null);
      toast.success(
        criadas === 1
          ? "Encomenda agendada com sucesso."
          : `${criadas} encomendas agendadas com sucesso.`,
      );
    } catch (e: any) {
      setModalAgendamento((prev) =>
        prev ? { ...prev, agendando: false, erro: e?.message ?? "Erro de conexão" } : null,
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          💬 Integração WhatsApp
        </h1>
        <p className="text-muted-foreground">
          Recebimento e gestão de pedidos via WhatsApp
        </p>
      </div>

      {/* 1. Status da Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Status da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // WhatsApp: conectado se mensagens reais chegaram OU configuracoes indica configurado
            const waOk = whatsappConectado || configuracao?.whatsappConfigurado === true;
            // Meta: conectado se mensagens reais chegaram OU configuracoes indica configurado
            const metaOk = metaConectado || configuracao?.metaConfigurado === true;
            // Última mensagem real — usa formatarDataHora para evitar "Invalid Date"
            const ultimaMsg = ultimaMensagemTs ?? configuracao?.ultimaMensagemEm ?? null;
            const ultimaMsgFormatada = ultimaMsg ? formatarDataHora(ultimaMsg) : "Nenhuma";
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">WhatsApp</span>
                  <div className="flex items-center gap-2">
                    {waOk
                      ? <Wifi className="w-4 h-4 text-green-500" />
                      : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    <Badge variant={waOk ? "default" : "secondary"}>
                      {waOk ? "Conectado" : "Não configurado"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Meta</span>
                  <div className="flex items-center gap-2">
                    {metaOk
                      ? <Wifi className="w-4 h-4 text-green-500" />
                      : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    <Badge variant={metaOk ? "default" : "secondary"}>
                      {metaOk ? "Conectado" : "Não configurado"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Automação</span>
                  <div className="flex items-center gap-2">
                    <Bot className={`w-4 h-4 ${configuracao?.automacaoAtiva ? "text-green-500" : "text-muted-foreground"}`} />
                    <Badge variant={configuracao?.automacaoAtiva ? "default" : "outline"}>
                      {configuracao?.automacaoAtiva ? "Ativada" : "Desativada"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Última mensagem</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{ultimaMsgFormatada}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* 2. Conversas Recebidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversas Recebidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoPedidos ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : conversas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <MessageCircle className="w-8 h-8 opacity-30" />
              <span>Nenhuma conversa recebida</span>
              <span className="text-xs">As mensagens recebidas via WhatsApp aparecerão aqui agrupadas por cliente</span>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Última mensagem</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resumo</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Msgs</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {conversas.map((c) => {
                    const st = statusConversas[c.chave] ?? "novo";
                    return (
                      <tr
                        key={c.chave}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setConversaSelecionada(c)}
                      >
                        <td className="px-4 py-3 font-medium">{c.cliente}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.telefone || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                          {formatarDataHora(c.ultimaMensagemTs)}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{c.ultimaResumo}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="tabular-nums">{c.totalMensagens}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={st === "concluído" ? "default" : st === "novo" ? "secondary" : "outline"}>
                            {st}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm" variant="ghost" className="h-8 px-2 text-xs"
                            onClick={(e) => { e.stopPropagation(); setConversaSelecionada(c); }}
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Pendências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Pendências
            {mensagensPendentes.length > 0 && (
              <Badge variant="destructive" className="ml-1">{mensagensPendentes.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mensagensPendentes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nenhuma pendência</span>
            </div>
          ) : (
            <div className="divide-y">
              {mensagensPendentes.map((p) => (
                <div key={p.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{p.telefone}</span>
                    {p.dataHora && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.dataHora).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {p.clienteNome && (
                    <span className="text-xs text-foreground font-medium">{p.clienteNome}</span>
                  )}
                  <p className="text-sm">{p.texto}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mensagensHistorico.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <History className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nenhum registro no histórico</span>
            </div>
          ) : (
            <div className="divide-y">
              {mensagensHistorico.map((h) => (
                <div key={h.id} className="py-3 space-y-1 text-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {h.clienteNome && (
                          <span className="font-medium text-foreground">{h.clienteNome}</span>
                        )}
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600 py-0">
                          Agendado
                        </Badge>
                      </div>
                      {h.clienteCodigo && (
                        <span className="text-xs text-muted-foreground">Código: {h.clienteCodigo}</span>
                      )}
                      <span className="font-mono text-xs text-muted-foreground">{h.telefone}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                      {h.dataHora && (
                        <span>Recebida: {new Date(h.dataHora).toLocaleString("pt-BR")}</span>
                      )}
                      {h.processadaEm && (
                        <span>Processada: {new Date(h.processadaEm).toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">{h.texto}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Grupos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Grupos
            </CardTitle>
            <Button size="sm" className="gap-2" onClick={abrirNovoGrupo}>
              <Plus className="w-4 h-4" />
              Cadastrar vínculo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {carregandoGrupos ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Users className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nenhum grupo cadastrado</span>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome do grupo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Identificador</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((g) => (
                    <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{g.nomeGrupo}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {g.identificadorGrupo || <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3">{g.clienteNome}</td>
                      <td className="px-4 py-3">
                        <Badge variant={g.status === "ativo" ? "default" : "secondary"}>
                          {g.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                            title={g.status === "ativo" ? "Desativar" : "Ativar"}
                            onClick={() => alternarStatusGrupo(g)}>
                            {g.status === "ativo"
                              ? <ToggleRight className="w-4 h-4 text-green-600" />
                              : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editar"
                            onClick={() => abrirEditarGrupo(g)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Excluir" onClick={() => excluirGrupo(g)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Reconhecimento de Produtos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Reconhecimento de Produtos
            </CardTitle>
            <Button size="sm" className="gap-2" onClick={abrirNovoAlias}>
              <Plus className="w-4 h-4" />
              Cadastrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Campo de busca */}
          {!carregandoAliases && aliases.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar produto ou sinônimo..."
                value={buscaAlias}
                onChange={(e) => setBuscaAlias(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}

          {carregandoAliases ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : aliases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <BookOpen className="w-8 h-8 opacity-30" />
              <span className="text-sm">Nenhum sinônimo cadastrado</span>
              <span className="text-xs">Vincule apelidos e variações a produtos oficiais do sistema</span>
            </div>
          ) : (() => {
            const buscaNorm = normalizarTexto(buscaAlias);
            const aliasesFiltrados = buscaAlias.trim()
              ? aliases.filter((a) =>
                  normalizarTexto(a.produtoNome).includes(buscaNorm) ||
                  a.sinonimos.some((s) => normalizarTexto(s).includes(buscaNorm)),
                )
              : aliases;
            const MAX_VISIVEIS = 5;
            return aliasesFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado para "{buscaAlias}"</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto oficial</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sinônimos</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aliasesFiltrados.map((a) => {
                      const expandido = aliasExpandido[a.id] ?? false;
                      const visiveis = expandido ? a.sinonimos : a.sinonimos.slice(0, MAX_VISIVEIS);
                      const ocultos = a.sinonimos.length - MAX_VISIVEIS;
                      return (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium align-top whitespace-nowrap">{a.produtoNome}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-1">
                              {visiveis.map((s) => (
                                <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                              ))}
                              {!expandido && ocultos > 0 && (
                                <button
                                  onClick={() => setAliasExpandido((prev) => ({ ...prev, [a.id]: true }))}
                                  className="text-xs text-primary hover:underline px-1"
                                >
                                  +{ocultos} sinônimo{ocultos !== 1 ? "s" : ""}
                                </button>
                              )}
                              {expandido && ocultos > 0 && (
                                <button
                                  onClick={() => setAliasExpandido((prev) => ({ ...prev, [a.id]: false }))}
                                  className="text-xs text-muted-foreground hover:underline px-1"
                                >
                                  Recolher
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editar"
                                onClick={() => abrirEditarAlias(a)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Excluir" onClick={() => excluirAlias(a)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* 7. Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configuracao === null ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Settings className="w-8 h-8 opacity-30 animate-pulse" />
              <span className="text-sm">Verificando configuração...</span>
            </div>
          ) : configuracao.phoneNumberId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Integração configurada</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phone Number ID</span>
                <span className="font-mono text-xs">{configuracao.phoneNumberId}</span>
              </div>
              {configuracao.wabaId && (
                <div className="flex flex-col gap-0.5 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">WABA ID</span>
                  <span className="font-mono text-xs">{configuracao.wabaId}</span>
                </div>
              )}
              {configuracao.webhookUrl && (
                <div className="flex flex-col gap-0.5 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Webhook URL</span>
                  <span className="font-mono text-xs break-all">{configuracao.webhookUrl}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Automação</span>
                <span className="text-sm">{configuracao.automacaoAtiva ? "Ativada" : "Desativada"}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Settings className="w-8 h-8 opacity-30" />
              <span className="text-sm">Integração não configurada</span>
              <Button variant="outline" size="sm" disabled>Configurar Integração</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal — Grupos */}
      <Dialog open={modalGrupoAberto} onOpenChange={setModalGrupoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoGrupo ? "Editar vínculo" : "Cadastrar vínculo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nomeGrupo">Nome do grupo <span className="text-destructive">*</span></Label>
              <Input id="nomeGrupo" placeholder="Ex: Padaria Dona Maria"
                value={formGrupo.nomeGrupo}
                onChange={(e) => setFormGrupo((f) => ({ ...f, nomeGrupo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="identificadorGrupo">
                Identificador do grupo
                <span className="text-muted-foreground text-xs ml-2">(opcional — preenchido na integração real)</span>
              </Label>
              <Input id="identificadorGrupo" placeholder="Ex: 5511999999999-1234567890@g.us"
                value={formGrupo.identificadorGrupo}
                onChange={(e) => setFormGrupo((f) => ({ ...f, identificadorGrupo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente <span className="text-destructive">*</span></Label>
              <Select value={formGrupo.clienteId} onValueChange={selecionarCliente}>
                <SelectTrigger id="cliente"><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                <SelectContent>
                  {clientes.length === 0
                    ? <SelectItem value="_vazio" disabled>Nenhum cliente cadastrado</SelectItem>
                    : clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="statusGrupo">Status</Label>
              <Select value={formGrupo.status}
                onValueChange={(v) => setFormGrupo((f) => ({ ...f, status: v as "ativo" | "inativo" }))}>
                <SelectTrigger id="statusGrupo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalGrupoAberto(false)} disabled={salvandoGrupo}>Cancelar</Button>
            <Button onClick={salvarGrupo} disabled={salvandoGrupo}>
              {salvandoGrupo ? "Salvando..." : editandoGrupo ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Agendamento por sistema */}
      <Dialog
        open={modalAgendamento !== null}
        onOpenChange={(open) => { if (!open && !modalAgendamento?.agendando) setModalAgendamento(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" />
              Agendar encomenda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Mensagem original — somente para conferência */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mensagem recebida</Label>
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground leading-relaxed">
                {modalAgendamento?.resumo || "—"}
              </div>
            </div>

            {/* Campo editável — sempre visível; preview reativo pelo código digitado */}
            <div className="space-y-1.5">
              <Label htmlFor="codigoAgendamento">
                Código do cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codigoAgendamento"
                placeholder="Ex: 84"
                inputMode="numeric"
                autoComplete="off"
                value={modalAgendamento?.clienteCodigo ?? ""}
                disabled={modalAgendamento?.agendando}
                onChange={(e) =>
                  setModalAgendamento((prev) =>
                    prev ? { ...prev, clienteCodigo: e.target.value, erro: null } : null,
                  )
                }
                onKeyDown={(e) => { if (e.key === "Enter") agendarPorSistema(); }}
              />
              {(() => {
                const codigo = (modalAgendamento?.clienteCodigo ?? "").trim();
                if (!codigo) return null;
                const encontrado = clientes.find((c) => c.codigo === codigo);
                if (encontrado) {
                  return (
                    <div className="px-3 py-2.5 bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 rounded-md space-y-0.5">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Cliente encontrado
                      </p>
                      <p className="font-semibold text-sm">{encontrado.nome}</p>
                      <p className="text-xs text-muted-foreground">Código: {encontrado.codigo}</p>
                    </div>
                  );
                }
                return (
                  <p className="text-xs text-destructive/70 px-1">Cliente não encontrado.</p>
                );
              })()}
            </div>

            {/* Erro retornado pelo backend */}
            {modalAgendamento?.erro && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm space-y-1">
                <p className="font-medium">Não foi possível criar a encomenda. A mensagem continua pendente.</p>
                <p className="text-xs opacity-80 whitespace-pre-line">{modalAgendamento.erro}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAgendamento(null)}
              disabled={modalAgendamento?.agendando}
            >
              Cancelar
            </Button>
            <Button
              onClick={agendarPorSistema}
              disabled={
                modalAgendamento?.agendando ||
                !clientes.find(
                  (c) => c.codigo === (modalAgendamento?.clienteCodigo ?? "").trim(),
                )
              }
              className="gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              {modalAgendamento?.agendando ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Produtos Alias */}
      <Dialog open={modalAliasAberto} onOpenChange={(open) => { if (!open && !salvandoAlias) setModalAliasAberto(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar reconhecimento de produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Produto oficial — seleção a partir do cadastro */}
            <div className="space-y-1.5">
              <Label htmlFor="produtoOficial">Produto oficial <span className="text-destructive">*</span></Label>
              <Select
                value={formAlias.produtoId}
                onValueChange={selecionarProduto}
                disabled={salvandoAlias || !!editandoAlias}
              >
                <SelectTrigger id="produtoOficial">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos.length === 0
                    ? <SelectItem value="_vazio" disabled>Nenhum produto cadastrado</SelectItem>
                    : produtos.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                </SelectContent>
              </Select>
              {editandoAlias && (
                <p className="text-xs text-muted-foreground">O produto oficial não pode ser alterado na edição.</p>
              )}
            </div>

            {/* Sinônimos */}
            <div className="space-y-1.5">
              <Label>Sinônimos <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  ref={sinonimoDraftRef}
                  placeholder="Ex: pãozinho, mini sal..."
                  value={sinonimoDraft}
                  disabled={salvandoAlias}
                  onChange={(e) => { setSinonimoDraft(e.target.value); setErroSinonimo(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarSinonimo(); } }}
                />
                <Button type="button" variant="outline" onClick={adicionarSinonimo} disabled={salvandoAlias} className="shrink-0">
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Pressione Enter ou clique em Adicionar para incluir cada sinônimo.</p>

              {/* Erro inline de validação */}
              {erroSinonimo && (
                <p className="text-xs text-destructive">{erroSinonimo}</p>
              )}

              {formAlias.sinonimos.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formAlias.sinonimos.map((s) => (
                    <span key={s}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-sm border">
                      {s}
                      <button type="button" onClick={() => removerSinonimo(s)} disabled={salvandoAlias}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAliasAberto(false)} disabled={salvandoAlias}>
              Cancelar
            </Button>
            <Button onClick={salvarAlias} disabled={salvandoAlias}>
              {salvandoAlias ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Confirmar exclusão de reconhecimento */}
      <Dialog
        open={confirmarExclusaoAlias !== null}
        onOpenChange={(open) => { if (!open) setConfirmarExclusaoAlias(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir reconhecimento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Os sinônimos de <strong>{confirmarExclusaoAlias?.produtoNome}</strong> deixarão de ser utilizados para
            reconhecimento de mensagens do WhatsApp. O produto oficial não será excluído.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarExclusaoAlias(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusaoAliasHandler}>
              Excluir reconhecimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal — Detalhe da Conversa */}
      <Dialog
        open={conversaSelecionada !== null}
        onOpenChange={(open) => { if (!open) setConversaSelecionada(null); }}
      >
        <DialogContent className="sm:max-w-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {conversaSelecionada?.cliente}
            </DialogTitle>
          </DialogHeader>

          {/* info + status */}
          <div className="flex flex-wrap items-center gap-3 py-2 border-b">
            <span className="font-mono text-xs text-muted-foreground">{conversaSelecionada?.telefone}</span>
            <span className="text-muted-foreground select-none">·</span>
            <span className="text-xs text-muted-foreground">
              {conversaSelecionada?.totalMensagens}{" "}
              mensagem{(conversaSelecionada?.totalMensagens ?? 0) !== 1 ? "s" : ""}
            </span>
            <div className="flex-1" />
            <Label className="text-xs shrink-0">Status:</Label>
            <Select
              value={conversaSelecionada ? (statusConversas[conversaSelecionada.chave] ?? "novo") : "novo"}
              onValueChange={(v) => {
                if (!conversaSelecionada) return;
                atualizarStatusConversa(conversaSelecionada, v as StatusConversa);
              }}
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em atendimento">Em atendimento</SelectItem>
                <SelectItem value="pedido em andamento">Pedido em andamento</SelectItem>
                <SelectItem value="concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* histórico de mensagens */}
          <div className="overflow-y-auto flex-1 space-y-2 py-2 pr-1 min-h-0">
            {(conversaSelecionada?.mensagens ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem mensagens</p>
            ) : (
              (conversaSelecionada?.mensagens ?? []).map((msg) => {
                const eProcessada = msg.processada === true || msg.status === "processado";
                return (
                  <div key={msg.id} className="p-3 bg-muted/40 rounded-lg space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{formatarDataHora(msg.dataHora)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{msg.status}</Badge>
                        {eProcessada ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            Processado
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => setModalAgendamento({
                              telefone: conversaSelecionada?.telefone ?? msg.telefone,
                              resumo: msg.resumo,
                              clienteNome: "",
                              clienteCodigo: "",
                              agendando: false,
                              erro: null,
                            })}
                          >
                            <CalendarCheck className="w-3 h-3" />
                            Agendar
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.resumo}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* área de resposta manual */}
          <div className="border-t pt-3 space-y-2">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none disabled:opacity-50"
              rows={3}
              placeholder="Digite uma mensagem..."
              value={textoResposta}
              disabled={enviandoResposta}
              onChange={(e) => setTextoResposta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Enter para enviar · Shift+Enter para nova linha
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConversaSelecionada(null);
                    setTextoResposta("");
                  }}
                  disabled={enviandoResposta}
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={enviandoResposta || !textoResposta.trim()}
                  onClick={enviarMensagem}
                >
                  <Send className="w-4 h-4" />
                  {enviandoResposta ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
