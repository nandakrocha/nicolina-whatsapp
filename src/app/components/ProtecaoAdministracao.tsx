import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ProtecaoAdministracaoProps {
  children: React.ReactNode;
}

const ADMIN_LOGIN_KEY = "nicolina_admin_login";
const ADMIN_SENHA_KEY = "nicolina_senha_administracao";
const DEFAULT_LOGIN = "admin";
const DEFAULT_SENHA = "admin123";

function obterCredenciais() {
  const login = localStorage.getItem(ADMIN_LOGIN_KEY) || DEFAULT_LOGIN;
  const senha = localStorage.getItem(ADMIN_SENHA_KEY) || DEFAULT_SENHA;
  if (!localStorage.getItem(ADMIN_LOGIN_KEY)) localStorage.setItem(ADMIN_LOGIN_KEY, DEFAULT_LOGIN);
  if (!localStorage.getItem(ADMIN_SENHA_KEY)) localStorage.setItem(ADMIN_SENHA_KEY, DEFAULT_SENHA);
  return { login, senha };
}

export function ProtecaoAdministracao({ children }: ProtecaoAdministracaoProps) {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(false);
  const [loginDigitado, setLoginDigitado] = useState("");
  const [senhaDigitada, setSenhaDigitada] = useState("");

  // Restaurar sessão se ainda estiver ativa (ex: voltando do Resumo)
  useEffect(() => {
    if (sessionStorage.getItem("nicolina_admin_sessao_ativa") === "true") {
      setAutenticado(true);
    }
  }, []);

  const validarCredenciais = () => {
    if (!loginDigitado.trim()) {
      toast.error("Digite o usuário de administração");
      return;
    }
    if (!senhaDigitada) {
      toast.error("Digite a senha de administração");
      return;
    }

    const { login, senha } = obterCredenciais();

    if (loginDigitado.trim() === login && senhaDigitada === senha) {
      setAutenticado(true);
      sessionStorage.setItem("nicolina_admin_sessao_ativa", "true");
      localStorage.setItem("nicolina_admin_autenticado", "true");
      toast.success("Acesso autorizado!");
      setLoginDigitado("");
      setSenhaDigitada("");
    } else {
      toast.error("Usuário ou senha incorretos. Acesso negado.");
      setSenhaDigitada("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") validarCredenciais();
  };

  if (autenticado) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center bg-primary/5 border-b">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            🔐 Área Restrita
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Acesso Exclusivo de Administração
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Autenticação Necessária</p>
              <p>Esta área requer login e senha de administrador. A sessão será encerrada ao sair desta página.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminLogin" className="text-base font-semibold">
                Usuário
              </Label>
              <Input
                id="adminLogin"
                type="text"
                placeholder="Digite o usuário de administração"
                value={loginDigitado}
                onChange={(e) => setLoginDigitado(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-base"
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminSenha" className="text-base font-semibold">
                Senha
              </Label>
              <Input
                id="adminSenha"
                type="password"
                placeholder="Digite a senha de administração"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-base"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={validarCredenciais}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              <Lock className="w-4 h-4" />
              Entrar
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
