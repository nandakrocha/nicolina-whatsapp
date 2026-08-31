import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { HelpCircle, Keyboard, Lightbulb, Zap } from "lucide-react";
import { Card } from "./ui/card";

export function AjudaRapida() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + H para abrir ajuda
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setAberto(true);
      }
      // ESC para fechar
      if (e.key === "Escape") {
        setAberto(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const atalhos = [
    { tecla: "Ctrl/Cmd + H", acao: "Abrir esta ajuda" },
    { tecla: "ESC", acao: "Fechar modais/formulários" },
    { tecla: "Enter", acao: "Adicionar produto no formulário" },
  ];

  const dicas = [
    {
      titulo: "Sincronização Automática",
      descricao: "Todos os dados são sincronizados automaticamente entre dispositivos. Você pode trabalhar em múltiplos computadores ou celulares ao mesmo tempo!",
      emoji: "🔄",
    },
    {
      titulo: "Campos Opcionais",
      descricao: "Nenhum campo é obrigatório! Você pode salvar encomendas incompletas e completar depois.",
      emoji: "✨",
    },
    {
      titulo: "Filtros Rápidos",
      descricao: "Use os botões de período rápido (Hoje, Amanhã, Semana) para filtrar encomendas rapidamente.",
      emoji: "⚡",
    },
    {
      titulo: "Duplicar Encomendas",
      descricao: "Clique no botão de copiar em qualquer encomenda para duplicá-la instantaneamente.",
      emoji: "📋",
    },
    {
      titulo: "Status Dinâmico",
      descricao: "Altere o status das encomendas diretamente na lista clicando no badge de status.",
      emoji: "🎯",
    },
    {
      titulo: "Impressão Individual",
      descricao: "Cada encomenda pode ser impressa individualmente com formatação profissional.",
      emoji: "🖨️",
    },
  ];

  const recursos = [
    { nome: "Dashboard Inteligente", descricao: "Visualize totais por categoria para hoje e amanhã", emoji: "📊" },
    { nome: "Gráficos Avançados", descricao: "Análise visual com gráficos de barras, pizza e linha", emoji: "📈" },
    { nome: "Backup Manual/Automático", descricao: "Crie backups quando quiser e restaure facilmente", emoji: "💾" },
    { nome: "Exportação Excel", descricao: "Exporte relatórios em formato CSV para Excel", emoji: "📥" },
    { nome: "Modo Claro/Escuro", descricao: "Alterne entre temas para conforto visual", emoji: "🌓" },
    { nome: "Responsivo", descricao: "Funciona perfeitamente em celular, tablet e desktop", emoji: "📱" },
  ];

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50"
          title="Ajuda (Ctrl+H)"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="w-6 h-6" />
            Central de Ajuda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Atalhos de Teclado */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Keyboard className="w-5 h-5" />
              Atalhos de Teclado
            </h3>
            <div className="space-y-2">
              {atalhos.map((atalho, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">{atalho.acao}</span>
                  <kbd className="px-3 py-1 bg-background border rounded text-sm font-mono">
                    {atalho.tecla}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas de Uso */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5" />
              Dicas de Uso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dicas.map((dica, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{dica.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{dica.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{dica.descricao}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recursos Principais */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              Recursos Principais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-2xl">{recurso.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{recurso.nome}</h4>
                    <p className="text-sm text-muted-foreground">{recurso.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informações Adicionais */}
          <Card className="p-4 border-blue-500/50 bg-blue-500/5">
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Precisa de Ajuda?
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Este sistema foi desenvolvido para ser intuitivo e fácil de usar. Todas as funcionalidades
                  estão acessíveis através do menu lateral. Para suporte adicional, consulte a documentação
                  ou entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
