import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Database, Upload, Trash2, AlertTriangle, Lock } from "lucide-react";
import { encomendasAPI, clientesAPI, produtosAPI } from "../services/api";

// Página de Inicialização - Sistema Nicolina v2
export default function InicializarDados() {
  const [carregando, setCarregando] = useState(false);
  const [dialogSenhaAberto, setDialogSenhaAberto] = useState(false);
  const [dialogSenhaLimparAberto, setDialogSenhaLimparAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [senhaLimpar, setSenhaLimpar] = useState("");
  const [senhaErro, setSenhaErro] = useState("");
  const [senhaLimparErro, setSenhaLimparErro] = useState("");

  // Log de debug
  console.log("🚀 Página Inicializar carregada");
  console.log("✅ Botão de limpar dados disponível");

  const dadosExemplo = {
    clientes: [
      {
        nome: "Maria Silva",
        telefone: "(11) 98765-4321",
        endereco: "Rua das Flores, 123 - Centro",
        cnpj: "123.456.789-00",
        email: "maria.silva@email.com",
      },
      {
        nome: "João Santos",
        telefone: "(11) 97654-3210",
        endereco: "Av. Principal, 456 - Jardim",
        cnpj: "987.654.321-00",
        email: "joao.santos@email.com",
      },
      {
        nome: "Padaria Central",
        telefone: "(11) 3456-7890",
        endereco: "Rua Comercial, 789 - Centro",
        cnpj: "12.345.678/0001-99",
        email: "contato@padariacentral.com.br",
      },
    ],
    produtos: [
      {
        nome: "Pão Francês",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.05,
        descricao: "Pão francês tradicional",
        preco: 0.5,
      },
      {
        nome: "Pão de Doce",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.06,
        descricao: "Pão de doce tradicional",
        preco: 1.2,
      },
      {
        nome: "Mini Pão de Doce",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.03,
        descricao: "Mini pão de doce",
        preco: 0.8,
      },
      {
        nome: "Pão de Forma",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.5,
        descricao: "Pão de forma integral 500g",
        preco: 8.5,
      },
      {
        nome: "Baguete",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.25,
        descricao: "Baguete francesa artesanal",
        preco: 6.0,
      },
      {
        nome: "Pão Italiano",
        categoria: "Pães",
        pesoPorUnidadeKg: 0.4,
        descricao: "Pão italiano tradicional",
        preco: 10.0,
      },
      {
        nome: "Croissant",
        categoria: "Doces",
        pesoPorUnidadeKg: 0.08,
        descricao: "Croissant francês folhado",
        preco: 5.5,
      },
      {
        nome: "Bolo de Chocolate",
        categoria: "Bolos",
        pesoPorUnidadeKg: 1.0,
        descricao: "Bolo de chocolate 1kg",
        preco: 35.0,
      },
    ],
  };

  const popularDados = async () => {
    try {
      setCarregando(true);
      toast.info("Iniciando população de dados...");

      // 1. Criar clientes
      const clientesCriados = [];
      for (const cliente of dadosExemplo.clientes) {
        const clienteCriado = await clientesAPI.criar(cliente);
        clientesCriados.push(clienteCriado);
      }
      toast.success(`${clientesCriados.length} clientes criados`);

      // 2. Criar produtos
      const produtosCriados = [];
      for (const produto of dadosExemplo.produtos) {
        const produtoCriado = await produtosAPI.criar(produto);
        produtosCriados.push(produtoCriado);
      }
      toast.success(`${produtosCriados.length} produtos criados`);

      // 3. Criar encomendas de exemplo
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const encomendasExemplo = [
        {
          clienteId: clientesCriados[0].id,
          clienteNome: clientesCriados[0].nome,
          clienteTelefone: clientesCriados[0].telefone || "",
          data: hoje.toISOString().split("T")[0],
          hora: "08:00",
          produtos: [
            {
              produtoId: produtosCriados[1].id, // Pão de Doce
              produtoNome: produtosCriados[1].nome,
              quantidade: 50,
              pesoPorUnidadeKg: produtosCriados[1].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[1].pesoPorUnidadeKg * 50,
              observacao: "Bem assado",
            },
            {
              produtoId: produtosCriados[2].id, // Mini Pão de Doce
              produtoNome: produtosCriados[2].nome,
              quantidade: 100,
              pesoPorUnidadeKg: produtosCriados[2].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[2].pesoPorUnidadeKg * 100,
            },
          ],
          quantidadeTotal: 150,
        },
        {
          clienteId: clientesCriados[1].id,
          clienteNome: clientesCriados[1].nome,
          clienteTelefone: clientesCriados[1].telefone || "",
          data: hoje.toISOString().split("T")[0],
          hora: "10:00",
          produtos: [
            {
              produtoId: produtosCriados[1].id, // Pão de Doce
              produtoNome: produtosCriados[1].nome,
              quantidade: 30,
              pesoPorUnidadeKg: produtosCriados[1].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[1].pesoPorUnidadeKg * 30,
            },
            {
              produtoId: produtosCriados[2].id, // Mini Pão de Doce
              produtoNome: produtosCriados[2].nome,
              quantidade: 80,
              pesoPorUnidadeKg: produtosCriados[2].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[2].pesoPorUnidadeKg * 80,
              observacao: "Embrulhar separado",
            },
          ],
          quantidadeTotal: 110,
        },
        {
          clienteId: clientesCriados[2].id,
          clienteNome: clientesCriados[2].nome,
          clienteTelefone: clientesCriados[2].telefone || "",
          data: amanha.toISOString().split("T")[0],
          hora: "07:00",
          produtos: [
            {
              produtoId: produtosCriados[1].id, // Pão de Doce
              produtoNome: produtosCriados[1].nome,
              quantidade: 70,
              pesoPorUnidadeKg: produtosCriados[1].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[1].pesoPorUnidadeKg * 70,
            },
            {
              produtoId: produtosCriados[2].id, // Mini Pão de Doce
              produtoNome: produtosCriados[2].nome,
              quantidade: 120,
              pesoPorUnidadeKg: produtosCriados[2].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[2].pesoPorUnidadeKg * 120,
            },
            {
              produtoId: produtosCriados[6].id, // Bolo de Chocolate
              produtoNome: produtosCriados[6].nome,
              quantidade: 2,
              pesoPorUnidadeKg: produtosCriados[6].pesoPorUnidadeKg,
              pesoTotalKg: produtosCriados[6].pesoPorUnidadeKg * 2,
              observacao: "Cobertura extra de chocolate",
            },
          ],
          quantidadeTotal: 192,
        },
      ];

      for (const encomenda of encomendasExemplo) {
        await encomendasAPI.criar(encomenda);
      }
      toast.success(`${encomendasExemplo.length} encomendas criadas`);

      toast.success("✅ Dados de exemplo populados com sucesso!");
      toast.info("Navegue para Encomendas, Produtos ou Clientes para visualizar");
    } catch (error) {
      console.error("Erro ao popular dados:", error);
      toast.error("Erro ao popular dados. Verifique o console.");
    } finally {
      setCarregando(false);
    }
  };

  const limparTodosDados = () => {
    if (!confirm("⚠️ ATENÇÃO! Esta ação irá apagar TODOS os dados do localStorage. Esta operação é IRREVERSÍVEL! Deseja continuar?")) {
      return;
    }
    
    if (!confirm("🚨 ÚLTIMA CONFIRMAÇÃO! Tem ABSOLUTA CERTEZA de que deseja apagar todos os dados? Digite OK no próximo prompt para confirmar.")) {
      return;
    }

    try {
      // Limpar todos os dados do localStorage relacionados ao sistema
      localStorage.removeItem("nicolina_encomendas");
      localStorage.removeItem("nicolina_produtos");
      localStorage.removeItem("nicolina_clientes");
      localStorage.removeItem("nicolina_backups");
      localStorage.removeItem("nicolina_email_backup");
      localStorage.removeItem("nicolina_backup_automatico");
      localStorage.removeItem("nicolina_hora_backup");
      
      console.log("🗑️ LocalStorage limpo completamente");
      toast.success("✅ Todos os dados do localStorage foram removidos!");
      toast.info("Recarregue a página para começar do zero");
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error);
      toast.error("Erro ao limpar dados. Verifique o console.");
    }
  };

  const abrirDialogSenha = () => {
    setSenha("");
    setSenhaErro("");
    setDialogSenhaAberto(true);
  };

  const confirmarSenhaEPopular = () => {
    if (senha === "admin@") {
      setDialogSenhaAberto(false);
      setSenha("");
      setSenhaErro("");
      popularDados();
    } else {
      setSenhaErro("❌ Senha incorreta! Tente novamente.");
      setSenha("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      confirmarSenhaEPopular();
    }
  };

  const abrirDialogSenhaLimpar = () => {
    setSenhaLimpar("");
    setSenhaLimparErro("");
    setDialogSenhaLimparAberto(true);
  };

  const confirmarSenhaELimpar = () => {
    if (senhaLimpar === "admin@") {
      setDialogSenhaLimparAberto(false);
      setSenhaLimpar("");
      setSenhaLimparErro("");
      limparTodosDados();
    } else {
      setSenhaLimparErro("❌ Senha incorreta! Tente novamente.");
      setSenhaLimpar("");
    }
  };

  const handleKeyDownLimpar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      confirmarSenhaELimpar();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🚀 Inicializar Sistema
        </h1>
        <p className="text-muted-foreground">
          Popule o banco de dados com dados de exemplo ou limpe dados existentes
        </p>
      </div>

      {/* Card de Aviso sobre inicialização automática REMOVIDA */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <AlertTriangle className="w-5 h-5" />
            Inicialização Automática Desativada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Importante:</strong> A inicialização automática de dados foi <strong>REMOVIDA</strong> do sistema.
          </p>
          <div className="bg-white dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>O que mudou:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Sistema agora inicia <strong>completamente vazio</strong></li>
              <li>Não há mais dados de exemplo pré-carregados</li>
              <li>Você tem controle total sobre os dados</li>
            </ul>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            👉 Use o botão abaixo para popular dados manualmente quando desejar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Dados de Exemplo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="font-semibold">Este processo irá criar:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>3 clientes de exemplo</li>
              <li>6 produtos de padaria (pães, doces e bolos)</li>
              <li>3 encomendas de exemplo (hoje e amanhã)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Atenção:</strong> Execute este processo apenas uma vez.
              Se os dados já existirem, você terá dados duplicados.
            </p>
          </div>

          <Button
            onClick={abrirDialogSenha}
            disabled={carregando}
            size="lg"
            className="w-full gap-2"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Populando dados...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Popular Dados de Exemplo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <span className="font-medium text-green-800 dark:text-green-200">
                🌐 Modo Online
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">
                Sincronização em tempo real ativa
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="font-medium text-blue-800 dark:text-blue-200">
                💾 Armazenamento
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Firebase Realtime Database
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Limpar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ <strong>Atenção:</strong> Esta ação irá apagar todos os dados do localStorage. Esta operação é IRREVERSÍVEL!
            </p>
          </div>

          <Button
            onClick={abrirDialogSenhaLimpar}
            size="lg"
            className="w-full gap-2 bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="w-5 h-5" />
            Limpar Todos os Dados
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Senha */}
      <Dialog open={dialogSenhaAberto} onOpenChange={setDialogSenhaAberto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmação de Senha</DialogTitle>
            <DialogDescription>
              Digite a senha para popular os dados de exemplo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite a senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {senhaErro && <p className="text-red-500 text-sm">{senhaErro}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => setDialogSenhaAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-green-500 hover:bg-green-600"
              onClick={confirmarSenhaEPopular}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Senha para Limpar Dados */}
      <Dialog open={dialogSenhaLimparAberto} onOpenChange={setDialogSenhaLimparAberto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmação de Senha</DialogTitle>
            <DialogDescription>
              Digite a senha para limpar todos os dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaLimpar">Senha</Label>
              <Input
                id="senhaLimpar"
                type="password"
                placeholder="Digite a senha"
                value={senhaLimpar}
                onChange={(e) => setSenhaLimpar(e.target.value)}
                onKeyDown={handleKeyDownLimpar}
              />
              {senhaLimparErro && <p className="text-red-500 text-sm">{senhaLimparErro}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => setDialogSenhaLimparAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-green-500 hover:bg-green-600"
              onClick={confirmarSenhaELimpar}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}