import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { usuariosAPI, type Usuario } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface AutenticacaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: (usuario: Usuario) => void;
  titulo?: string;
  descricao?: string;
}

export function AutenticacaoModal({
  aberto,
  onFechar,
  onSucesso,
  titulo = "Autenticação Necessária",
  descricao = "Digite o código e senha de um usuário autorizado para continuar",
}: AutenticacaoModalProps) {
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const handleAutenticar = async () => {
    if (!codigo || !senha) {
      toast.error("Preencha código e senha");
      return;
    }

    setVerificando(true);
    try {
      const usuarios = await usuariosAPI.listar();
      const usuario = usuarios.find(
        (u) => u.codigo === codigo && u.senha === senha
      );

      if (!usuario) {
        toast.error("Código ou senha incorretos");
        setVerificando(false);
        return;
      }

      // Verificar se tem permissão
      if (usuario.permissao === "Leitura") {
        toast.error("Você não tem permissão para editar/excluir");
        setVerificando(false);
        return;
      }

      toast.success(`Autenticado como ${usuario.nome}`);
      setCodigo("");
      setSenha("");
      setMostrarSenha(false);
      onSucesso(usuario);
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      toast.error("Erro ao verificar credenciais");
    } finally {
      setVerificando(false);
    }
  };

  const handleFechar = () => {
    setCodigo("");
    setSenha("");
    setMostrarSenha(false);
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{titulo}</DialogTitle>
          <DialogDescription className="text-center">
            {descricao}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código de Usuário</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: JS001"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && senha && handleAutenticar()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha..."
                onKeyDown={(e) => e.key === "Enter" && codigo && handleAutenticar()}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleFechar} disabled={verificando}>
            Cancelar
          </Button>
          <Button onClick={handleAutenticar} disabled={verificando}>
            <Lock className="w-4 h-4 mr-2" />
            {verificando ? "Verificando..." : "Autenticar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
