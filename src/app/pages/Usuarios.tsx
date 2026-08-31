import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { UserPlus, Edit, Trash2, Key, Lock, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { usuariosAPI, type Usuario, iniciarSincronizacaoUsuarios } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const SENHA_ADMIN = "admin123";

export default function Usuarios() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // 👑 Verificar se usuário logado é Proprietário
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [isProprietario, setIsProprietario] = useState(false);
  
  // Modal de criação/edição
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<Partial<Usuario>>({
    nome: "",
    codigo: "",
    senha: "",
    permissao: "Leitura",
  });
  const [editando, setEditando] = useState(false);
  
  // Modal de alteração de senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [usuarioAlterarSenha, setUsuarioAlterarSenha] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  
  // Visibilidade de senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  // 🔐 NOVO: Modal de confirmação de senha para ações
  const [modalConfirmacaoSenha, setModalConfirmacaoSenha] = useState(false);
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [acaoPendente, setAcaoPendente] = useState<{
    tipo: "editar" | "senha" | "excluir" | "entrar" | "novo" | "administracao";
    usuario?: Usuario;
  } | null>(null);
  const [mostrarSenhaConfirmacao, setMostrarSenhaConfirmacao] = useState(false);

  // 🚨 DESBLOQUEIO DE EMERGÊNCIA
  const [modalDesbloqueio, setModalDesbloqueio] = useState(false);
  const [usuarioSelecionadoDesbloqueio, setUsuarioSelecionadoDesbloqueio] = useState<Usuario | null>(null);
  const [senhaDesbloqueio, setSenhaDesbloqueio] = useState("");
  const [mostrarSenhaDesbloqueio, setMostrarSenhaDesbloqueio] = useState(false);

  useEffect(() => {
    if (autenticado) {
      // 👑 Verificar se usuário logado é Proprietário
      const usuarioLogadoStr = localStorage.getItem("nicolina_usuario_logado");
      if (usuarioLogadoStr) {
        const usuario = JSON.parse(usuarioLogadoStr);
        setUsuarioLogado(usuario);
        setIsProprietario(usuario.permissao === "Proprietário");
      }
      
      carregarUsuarios();
      
      // Sincronização em tempo real
      const unsubscribe = iniciarSincronizacaoUsuarios();
      
      const handleUsuariosAtualizados = () => {
        console.log("📡 Evento de usuários atualizados recebido");
        carregarUsuarios();
      };
      
      window.addEventListener('usuarios-atualizados', handleUsuariosAtualizados);
      
      return () => {
        unsubscribe();
        window.removeEventListener('usuarios-atualizados', handleUsuariosAtualizados);
      };
    }
  }, [autenticado]);

  const carregarUsuarios = async () => {
    try {
      let dados = await usuariosAPI.listar();

      // Se não há nenhum usuário no sistema, cria automaticamente o administrador padrão
      if (dados.length === 0) {
        const adminPadrao = await usuariosAPI.criar({
          nome: "Administrador",
          codigo: "admin",
          senha: "admin123",
          permissao: "Proprietário",
        });
        dados = [adminPadrao];
        toast.success("Usuário administrador padrão criado: código admin / senha admin123");
      }

      // Se não houver Proprietário, redefine a senha do primeiro usuário para admin123
      const temProprietario = dados.some((u) => u.permissao === "Proprietário");
      if (!temProprietario) {
        const primeiro = dados[0];
        await usuariosAPI.atualizar(primeiro.id, { senha: "admin123", permissao: "Proprietário" });
        dados = await usuariosAPI.listar();
        toast.info(`Permissão e senha redefinidas para "${primeiro.nome}" (senha: admin123)`);
      }

      setUsuarios(dados.sort((a, b) => a.nome.localeCompare(b.nome)));

      // Auto-login como o primeiro Proprietário se não houver sessão ativa
      const logadoStr = localStorage.getItem("nicolina_usuario_logado");
      if (!logadoStr) {
        const proprietario = dados.find((u) => u.permissao === "Proprietário");
        if (proprietario) {
          localStorage.setItem("nicolina_usuario_logado", JSON.stringify(proprietario));
          setUsuarioLogado(proprietario);
          setIsProprietario(true);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  };

  const handleLogin = () => {
    if (senhaAcesso === SENHA_ADMIN) {
      setAutenticado(true);
      toast.success("Acesso autorizado!");
    } else {
      toast.error("Senha incorreta!");
      setSenhaAcesso("");
    }
  };

  const abrirModalNovo = () => {
    setUsuarioAtual({
      nome: "",
      codigo: "",
      senha: "",
      permissao: "Leitura",
    });
    setEditando(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioAtual({ ...usuario });
    setEditando(true);
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!usuarioAtual.nome || !usuarioAtual.codigo) {
      toast.error("Preencha nome e código");
      return;
    }

    if (!editando && !usuarioAtual.senha) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    try {
      if (editando && usuarioAtual.id) {
        const dadosAtualizar: Partial<Usuario> = {
          nome: usuarioAtual.nome,
          codigo: usuarioAtual.codigo,
          permissao: usuarioAtual.permissao as "Proprietário" | "Admin" | "Editor" | "Leitura",
        };
        
        // Só atualiza senha se foi fornecida
        if (usuarioAtual.senha && usuarioAtual.senha.trim() !== "") {
          dadosAtualizar.senha = usuarioAtual.senha;
        }
        
        await usuariosAPI.atualizar(usuarioAtual.id, dadosAtualizar);
        toast.success("Usuário atualizado!");
      } else {
        await usuariosAPI.criar({
          nome: usuarioAtual.nome,
          codigo: usuarioAtual.codigo,
          senha: usuarioAtual.senha || "",
          permissao: usuarioAtual.permissao as "Proprietário" | "Admin" | "Editor" | "Leitura",
        });
        toast.success("Usuário criado!");
      }

      setModalAberto(false);
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário");
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      await usuariosAPI.excluir(id);
      toast.success("Usuário excluído!");
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    }
  };

  const abrirModalAlterarSenha = (usuario: Usuario) => {
    setUsuarioAlterarSenha(usuario);
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setModalSenhaAberto(true);
  };

  const handleAlterarSenha = async () => {
    if (!novaSenha || !confirmarNovaSenha) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!usuarioAlterarSenha?.id) return;

    try {
      await usuariosAPI.atualizar(usuarioAlterarSenha.id, {
        senha: novaSenha,
      });
      toast.success("Senha alterada com sucesso!");
      setModalSenhaAberto(false);
      setUsuarioAlterarSenha(null);
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha");
    }
  };

  const fazerLoginComo = (usuario: Usuario) => {
    // Salvar o usuário no localStorage como usuário logado
    localStorage.setItem("nicolina_usuario_logado", JSON.stringify(usuario));
    
    // Se o usuário é Proprietário, marcar como autenticado na Administração
    if (usuario.permissao === "Proprietário") {
      localStorage.setItem("nicolina_admin_autenticado", "true");
      toast.success(`Agora você está logado como ${usuario.nome} (${usuario.permissao}). Botão Administração liberado!`);
    } else {
      // Se não for proprietário, remover autenticação de administração
      localStorage.removeItem("nicolina_admin_autenticado");
      toast.success(`Agora você está logado como ${usuario.nome} (${usuario.permissao})`);
    }
    
    // Disparar evento para o Layout atualizar
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('usuario-atualizado'));
    
    // Pequeno delay para garantir que o evento foi processado
    setTimeout(() => {
      // Forçar reload da página para garantir que tudo seja atualizado
      window.location.reload();
    }, 500);
  };

  const getPermissaoIcon = (permissao: string) => {
    switch (permissao) {
      case "Proprietário":
        return "👑";
      case "Admin":
        return "🔰";
      case "Editor":
        return "✏️";
      case "Leitura":
        return "👁️";
      default:
        return "❓";
    }
  };

  const getPermissaoColor = (permissao: string) => {
    switch (permissao) {
      case "Proprietário":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950";
      case "Admin":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
      case "Editor":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
      case "Leitura":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800";
      default:
        return "";
    }
  };

  // Tela de login
  if (!autenticado) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Área Restrita - Usuários</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Digite a senha de administrador para acessar
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Senha padrão: <strong>admin123</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAcesso">Senha de Administrador</Label>
              <Input
                id="senhaAcesso"
                type="password"
                value={senhaAcesso}
                onChange={(e) => setSenhaAcesso(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Digite a senha..."
                autoFocus
              />
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              Acessar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela principal
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            👥 Gestão de Usuários
          </h1>
          <p className="text-muted-foreground">
            Controle de permissões e autenticação
          </p>
        </div>
        <div className="flex gap-3">
          {/* Botão "Liberar Administração" só para Proprietários */}
          {isProprietario && (
            <Button 
              onClick={() => {
                // Pedir senha do proprietário logado para liberar Administração
                if (usuarioLogado) {
                  setAcaoPendente({ tipo: "administracao" });
                  setSenhaConfirmacao("");
                  setModalConfirmacaoSenha(true);
                }
              }} 
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <Shield className="w-5 h-5" />
              Liberar Administração
            </Button>
          )}
          
          {/* Botão "Novo Usuário" só para Proprietários */}
          {isProprietario && (
            <Button 
              onClick={() => {
                // Pedir senha do proprietário logado
                if (usuarioLogado) {
                  setAcaoPendente({ tipo: "novo", usuario: usuarioLogado });
                  setSenhaConfirmacao("");
                  setModalConfirmacaoSenha(true);
                }
              }} 
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* ⚠️ Aviso para não-Proprietários */}
      {!isProprietario && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  Acesso Restrito
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                  Apenas usuários com perfil <strong>👑 Proprietário</strong> podem criar, editar, alterar senha ou excluir usuários. Você está visualizando a lista em modo somente leitura.
                </p>
                <Button
                  onClick={() => {
                    setModalDesbloqueio(true);
                    setUsuarioSelecionadoDesbloqueio(null);
                    setSenhaDesbloqueio("");
                  }}
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                  size="sm"
                >
                  <Shield className="w-4 h-4" />
                  🚨 Desbloqueio de Emergência
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre permissões */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Níveis de Permissão
              </h3>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p><strong>👑 Proprietário:</strong> Acesso total + Área de Administração</p>
                <p><strong>🔰 Admin:</strong> Controle total do sistema</p>
                <p><strong>✏️ Editor:</strong> Criar, editar e excluir</p>
                <p><strong>👁️ Leitura:</strong> Apenas visualizar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-lg font-semibold text-muted-foreground">
                Nenhum usuário cadastrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Usuário" para começar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Nome</th>
                    <th className="text-left p-3 font-semibold">Código</th>
                    <th className="text-center p-3 font-semibold">Permissão</th>
                    <th className="text-center p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{usuario.nome}</div>
                      </td>
                      <td className="p-3">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {usuario.codigo}
                        </code>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getPermissaoColor(
                            usuario.permissao
                          )}`}
                        >
                          {getPermissaoIcon(usuario.permissao)} {usuario.permissao}
                        </span>
                      </td>
                      <td className="p-3">
                        {isProprietario ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              onClick={() => {
                                setAcaoPendente({ tipo: "editar", usuario });
                                setSenhaConfirmacao("");
                                setModalConfirmacaoSenha(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              onClick={() => {
                                setAcaoPendente({ tipo: "senha", usuario });
                                setSenhaConfirmacao("");
                                setModalConfirmacaoSenha(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Key className="w-4 h-4" />
                              Senha
                            </Button>
                            {/* Botão "Entrar" só aparece para Proprietários */}
                            {usuario.permissao === "Proprietário" && (
                              <Button
                                onClick={() => {
                                  setAcaoPendente({ tipo: "entrar", usuario });
                                  setSenhaConfirmacao("");
                                  setModalConfirmacaoSenha(true);
                                }}
                                variant="default"
                                size="sm"
                                className="gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <Shield className="w-4 h-4" />
                                Entrar
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setAcaoPendente({ tipo: "excluir", usuario });
                                setSenhaConfirmacao("");
                                setModalConfirmacaoSenha(true);
                              }}
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className="text-sm text-muted-foreground italic">
                              Sem permissão
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar/Editar Usuário */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? "Altere as informações do usuário"
                : "Preencha os dados do novo usuário"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={usuarioAtual.nome || ""}
                onChange={(e) =>
                  setUsuarioAtual({ ...usuarioAtual, nome: e.target.value })
                }
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Acesso</Label>
              <Input
                id="codigo"
                value={usuarioAtual.codigo || ""}
                onChange={(e) =>
                  setUsuarioAtual({ ...usuarioAtual, codigo: e.target.value })
                }
                placeholder="Ex: JS001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">
                {editando ? "Nova Senha (deixe vazio para manter)" : "Senha"}
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={usuarioAtual.senha || ""}
                  onChange={(e) =>
                    setUsuarioAtual({ ...usuarioAtual, senha: e.target.value })
                  }
                  placeholder={editando ? "Digite para alterar..." : "Digite a senha..."}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissao">Nível de Permissão</Label>
              <div className="grid gap-3">
                {/* Radio: Proprietário */}
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    usuarioAtual.permissao === "Proprietário"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                      : "border-border hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="permissao"
                    value="Proprietário"
                    checked={usuarioAtual.permissao === "Proprietário"}
                    onChange={(e) =>
                      setUsuarioAtual({
                        ...usuarioAtual,
                        permissao: e.target.value as "Proprietário" | "Admin" | "Editor" | "Leitura",
                      })
                    }
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      👑 Proprietário
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Acesso total + Área de Administração
                    </div>
                  </div>
                </label>

                {/* Radio: Admin */}
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    usuarioAtual.permissao === "Admin"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                      : "border-border hover:border-red-300 dark:hover:border-red-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="permissao"
                    value="Admin"
                    checked={usuarioAtual.permissao === "Admin"}
                    onChange={(e) =>
                      setUsuarioAtual({
                        ...usuarioAtual,
                        permissao: e.target.value as "Proprietário" | "Admin" | "Editor" | "Leitura",
                      })
                    }
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                      🔰 Admin
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Controle total do sistema
                    </div>
                  </div>
                </label>

                {/* Radio: Editor */}
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    usuarioAtual.permissao === "Editor"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="permissao"
                    value="Editor"
                    checked={usuarioAtual.permissao === "Editor"}
                    onChange={(e) =>
                      setUsuarioAtual({
                        ...usuarioAtual,
                        permissao: e.target.value as "Proprietário" | "Admin" | "Editor" | "Leitura",
                      })
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      ✏️ Editor
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Criar, editar e excluir
                    </div>
                  </div>
                </label>

                {/* Radio: Leitura */}
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    usuarioAtual.permissao === "Leitura"
                      ? "border-gray-500 bg-gray-50 dark:bg-gray-900/30"
                      : "border-border hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="permissao"
                    value="Leitura"
                    checked={usuarioAtual.permissao === "Leitura"}
                    onChange={(e) =>
                      setUsuarioAtual({
                        ...usuarioAtual,
                        permissao: e.target.value as "Proprietário" | "Admin" | "Editor" | "Leitura",
                      })
                    }
                    className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      👁️ Leitura
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Apenas visualizar
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Alterar Senha */}
      <Dialog open={modalSenhaAberto} onOpenChange={setModalSenhaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Alterando senha de: <strong>{usuarioAlterarSenha?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={mostrarNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite a nova senha..."
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarNovaSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarNovaSenha"
                type="password"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                placeholder="Confirme a nova senha..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSenhaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAlterarSenha}>
              <Key className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de senha para ações */}
      <Dialog open={modalConfirmacaoSenha} onOpenChange={setModalConfirmacaoSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de Senha - Proprietário</DialogTitle>
            <DialogDescription>
              Digite sua senha de proprietário para confirmar a ação
            </DialogDescription>
          </DialogHeader>

          {/* Informação sobre a ação pendente */}
          {acaoPendente && (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {acaoPendente.tipo === "editar" && <Edit className="w-4 h-4 text-blue-600" />}
                {acaoPendente.tipo === "senha" && <Key className="w-4 h-4 text-orange-600" />}
                {acaoPendente.tipo === "excluir" && <Trash2 className="w-4 h-4 text-red-600" />}
                {acaoPendente.tipo === "entrar" && <Shield className="w-4 h-4 text-green-600" />}
                {acaoPendente.tipo === "novo" && <UserPlus className="w-4 h-4 text-green-600" />}
                {acaoPendente.tipo === "administracao" && <Shield className="w-4 h-4 text-purple-600" />}
                <span className="font-semibold">
                  {acaoPendente.tipo === "editar" && "Editar usuário"}
                  {acaoPendente.tipo === "senha" && "Alterar senha"}
                  {acaoPendente.tipo === "excluir" && "Excluir usuário"}
                  {acaoPendente.tipo === "entrar" && "Fazer login como usuário"}
                  {acaoPendente.tipo === "novo" && "Criar novo usuário"}
                  {acaoPendente.tipo === "administracao" && "Liberar acesso à Administração"}
                </span>
              </div>
              {acaoPendente.tipo !== "novo" && acaoPendente.tipo !== "administracao" && acaoPendente.usuario && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Usuário alvo: <strong>{acaoPendente.usuario.nome}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Código: <code className="bg-muted px-1.5 py-0.5 rounded">{acaoPendente.usuario.codigo}</code>
                  </p>
                </>
              )}
              {acaoPendente.tipo === "administracao" && (
                <p className="text-sm text-muted-foreground">
                  Após autenticação, o botão <strong>Administração</strong> aparecerá no menu lateral.
                </p>
              )}
            </div>
          )}

          {/* Card de informação do proprietário */}
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                Autenticação de Proprietário
              </span>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Proprietário logado: <strong>{usuarioLogado?.nome}</strong>
            </p>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Código: <code className="bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded">{usuarioLogado?.codigo}</code>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaConfirmacao">Senha do Proprietário</Label>
              <div className="relative">
                <Input
                  id="senhaConfirmacao"
                  type={mostrarSenhaConfirmacao ? "text" : "password"}
                  value={senhaConfirmacao}
                  onChange={(e) => setSenhaConfirmacao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // Validar contra a senha do PROPRIETÁRIO LOGADO
                      if (usuarioLogado && senhaConfirmacao === usuarioLogado.senha) {
                        switch (acaoPendente?.tipo) {
                          case "editar":
                            if (acaoPendente.usuario) abrirModalEditar(acaoPendente.usuario);
                            break;
                          case "senha":
                            if (acaoPendente.usuario) abrirModalAlterarSenha(acaoPendente.usuario);
                            break;
                          case "excluir":
                            if (acaoPendente.usuario) handleExcluir(acaoPendente.usuario.id);
                            break;
                          case "entrar":
                            if (acaoPendente.usuario) fazerLoginComo(acaoPendente.usuario);
                            break;
                          case "novo":
                            abrirModalNovo();
                            break;
                          case "administracao":
                            // Liberar Administração
                            localStorage.setItem("nicolina_admin_autenticado", "true");
                            toast.success(`✅ Administração liberada! Botão aparecerá no menu lateral.`);
                            // Disparar evento para o Layout atualizar IMEDIATAMENTE
                            window.dispatchEvent(new Event('storage'));
                            window.dispatchEvent(new CustomEvent('admin-liberado'));
                            // NÃO recarregar - deixar o Layout reagir ao evento
                            break;
                        }
                        setModalConfirmacaoSenha(false);
                        setSenhaConfirmacao("");
                      } else {
                        toast.error("Senha do proprietário incorreta!");
                        setSenhaConfirmacao("");
                      }
                    }
                  }}
                  placeholder="Digite sua senha de proprietário..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaConfirmacao(!mostrarSenhaConfirmacao)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarSenhaConfirmacao ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModalConfirmacaoSenha(false);
              setSenhaConfirmacao("");
            }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Validar contra a senha do PROPRIETÁRIO LOGADO
                if (usuarioLogado && senhaConfirmacao === usuarioLogado.senha) {
                  switch (acaoPendente?.tipo) {
                    case "editar":
                      if (acaoPendente.usuario) abrirModalEditar(acaoPendente.usuario);
                      break;
                    case "senha":
                      if (acaoPendente.usuario) abrirModalAlterarSenha(acaoPendente.usuario);
                      break;
                    case "excluir":
                      if (acaoPendente.usuario) handleExcluir(acaoPendente.usuario.id);
                      break;
                    case "entrar":
                      if (acaoPendente.usuario) fazerLoginComo(acaoPendente.usuario);
                      break;
                    case "novo":
                      abrirModalNovo();
                      break;
                    case "administracao":
                      // Liberar Administração
                      localStorage.setItem("nicolina_admin_autenticado", "true");
                      toast.success(`✅ Administração liberada! Botão aparecerá no menu lateral.`);
                      // Disparar evento para o Layout atualizar IMEDIATAMENTE
                      window.dispatchEvent(new Event('storage'));
                      window.dispatchEvent(new CustomEvent('admin-liberado'));
                      // NÃO recarregar - deixar o Layout reagir ao evento
                      break;
                  }
                  setModalConfirmacaoSenha(false);
                  setSenhaConfirmacao("");
                } else {
                  toast.error("Senha do proprietário incorreta!");
                  setSenhaConfirmacao("");
                }
              }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de desbloqueio de emergência */}
      <Dialog open={modalDesbloqueio} onOpenChange={setModalDesbloqueio}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>🚨 Desbloqueio de Emergência</DialogTitle>
            <DialogDescription>
              Selecione um usuário Proprietário e digite a senha dele para fazer login e desbloquear acesso total
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lista de proprietários */}
            <div className="space-y-2">
              <Label>Selecione um Proprietário</Label>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {usuarios
                  .filter((u) => u.permissao === "Proprietário")
                  .map((usuario) => (
                    <button
                      key={usuario.id}
                      onClick={() => setUsuarioSelecionadoDesbloqueio(usuario)}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                        usuarioSelecionadoDesbloqueio?.id === usuario.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                          : "border-border hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xl">
                        👑
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{usuario.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          Código: <code className="bg-muted px-1.5 py-0.5 rounded">{usuario.codigo}</code>
                        </div>
                      </div>
                      {usuarioSelecionadoDesbloqueio?.id === usuario.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Campo de senha (só aparece se um usuário foi selecionado) */}
            {usuarioSelecionadoDesbloqueio && (
              <div className="space-y-2">
                <Label htmlFor="senhaDesbloqueio">
                  Senha de <strong>{usuarioSelecionadoDesbloqueio.nome}</strong>
                </Label>
                <div className="relative">
                  <Input
                    id="senhaDesbloqueio"
                    type={mostrarSenhaDesbloqueio ? "text" : "password"}
                    value={senhaDesbloqueio}
                    onChange={(e) => setSenhaDesbloqueio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && usuarioSelecionadoDesbloqueio) {
                        // Validar contra a senha do usuário SELECIONADO
                        if (senhaDesbloqueio === usuarioSelecionadoDesbloqueio.senha) {
                          // Fazer login como esse usuário
                          fazerLoginComo(usuarioSelecionadoDesbloqueio);
                          setModalDesbloqueio(false);
                          setSenhaDesbloqueio("");
                          setUsuarioSelecionadoDesbloqueio(null);
                        } else {
                          toast.error("Senha incorreta!");
                          setSenhaDesbloqueio("");
                        }
                      }
                    }}
                    placeholder="Digite a senha..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaDesbloqueio(!mostrarSenhaDesbloqueio)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenhaDesbloqueio ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Aviso */}
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    Atenção
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Ao confirmar, você fará login como o proprietário selecionado e terá acesso total ao sistema, incluindo a página de Administração.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalDesbloqueio(false);
                setSenhaDesbloqueio("");
                setUsuarioSelecionadoDesbloqueio(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!usuarioSelecionadoDesbloqueio) {
                  toast.error("Selecione um proprietário!");
                  return;
                }

                // Validar contra a senha do usuário SELECIONADO
                if (senhaDesbloqueio === usuarioSelecionadoDesbloqueio.senha) {
                  // Fazer login como esse usuário
                  fazerLoginComo(usuarioSelecionadoDesbloqueio);
                  setModalDesbloqueio(false);
                  setSenhaDesbloqueio("");
                  setUsuarioSelecionadoDesbloqueio(null);
                } else {
                  toast.error("Senha incorreta!");
                  setSenhaDesbloqueio("");
                }
              }}
              disabled={!usuarioSelecionadoDesbloqueio || !senhaDesbloqueio}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Fazer Login como {usuarioSelecionadoDesbloqueio?.nome || "Proprietário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}