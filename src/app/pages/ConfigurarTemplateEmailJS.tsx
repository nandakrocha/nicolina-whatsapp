import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, AlertCircle, CheckCircle, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export default function ConfigurarTemplateEmailJSPage() {
  const navigate = useNavigate();

  const copiarTexto = (texto: string, nome: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto)
        .then(() => toast.success(`${nome} copiado!`))
        .catch(() => copiarTextoFallback(texto, nome));
    } else {
      copiarTextoFallback(texto, nome);
    }
  };

  const copiarTextoFallback = (texto: string, nome: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = texto;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success(`${nome} copiado!`);
      } else {
        toast.error(`Erro ao copiar ${nome}`);
      }
    } catch (err) {
      toast.error(`Erro ao copiar ${nome}`);
    }
  };

  const templateEmailJS = `{{{html_message}}}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-500" />
          Configurar Template do EmailJS
        </h1>
        <p className="text-muted-foreground">
          Configure o template correto no EmailJS para resolver o erro "recipients address is empty"
        </p>
      </div>

      {/* Erro Explicado */}
      <Card className="border-red-500/50 bg-red-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                ❌ Erro: "The recipients address is empty"
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Este erro acontece quando o template do EmailJS não está configurado para usar a variável <code className="bg-red-900/20 px-1 rounded">{'{{to_email}}'}</code>.
                O EmailJS não sabe para onde enviar o email!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solução */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                ✅ Solução: Configurar o Email "To"
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Você precisa configurar o campo "To email" no template do EmailJS para usar a variável <code className="bg-green-900/20 px-1 rounded">{'{{to_email}}'}</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passo a Passo */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Passo a Passo (5 minutos)</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="passos">
              <AccordionTrigger className="text-base font-semibold">
                Ver Instruções Detalhadas (Clique para Expandir)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Abra o EmailJS Dashboard</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => window.open("https://dashboard.emailjs.com/admin", "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir EmailJS Dashboard
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Vá em "Email Templates"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No menu lateral esquerdo, clique em <strong>"Email Templates"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Encontre seu template</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Procure pelo template com ID: <code className="bg-muted px-2 py-1 rounded">template_kb0jdhh</code>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Se não existe, crie um novo template clicando em <strong>"Create New Template"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">4</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-2">Configure o campo "To email"</p>
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        ⚠️ MUITO IMPORTANTE:
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        No campo <strong>"To email"</strong> (primeiro campo do formulário), digite exatamente:
                      </p>
                      <div className="bg-amber-900/20 p-3 rounded">
                        <code className="text-sm">{'{{to_email}}'}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-amber-900/10 border-amber-900/20 hover:bg-amber-900/20"
                        onClick={() => copiarTexto("{{to_email}}", "Variável to_email")}
                      >
                        <Copy className="w-4 h-4" />
                        Copiar: {'{{to_email}}'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">5</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-2">Configure o conteúdo do email</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Cole este template no campo "Content" (corpo do email):
                </p>
                <div className="bg-muted p-4 rounded font-mono text-xs overflow-x-auto mb-2 max-h-64 overflow-y-auto">
                  <pre>{templateEmailJS}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copiarTexto(templateEmailJS, "Template do Email")}
                >
                  <Copy className="w-4 h-4" />
                  Copiar Template Completo
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">6</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Salve o template</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em <strong>"Save"</strong> no topo da página
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">7</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Teste o envio</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Volte para a página de Backup e tente enviar um email de teste
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => navigate("/backup")}
                >
                  Ir para Backup
                </Button>
              </div>
            </div>
          </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Configuração Visual */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            📸 Como deve ficar no EmailJS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="visual">
              <AccordionTrigger className="text-base font-semibold text-blue-900 dark:text-blue-100">
                Ver Exemplo Visual (Clique para Expandir)
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-white dark:bg-gray-900 border-2 border-blue-500/30 p-4 rounded-lg">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">To email:</p>
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded">
                  <code className="text-sm">{'{{to_email}}'}</code>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">From name:</p>
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded">
                  <span className="text-sm">Nicolina Backup</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Subject:</p>
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded">
                  <code className="text-sm">{'{{subject}}'}</code>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Content:</p>
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded">
                  <pre className="text-xs whitespace-pre-wrap">{`Subject: {{subject}}

{{message}}`}</pre>
                </div>
              </div>
            </div>
          </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Variáveis Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Variáveis Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="variaveis">
              <AccordionTrigger className="text-base font-semibold">
                Ver Lista Completa de Variáveis (Clique para Expandir)
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
            Você pode usar estas variáveis no template:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { var: "{{to_email}}", desc: "Email do destinatário" },
              { var: "{{subject}}", desc: "Assunto do email" },
              { var: "{{message}}", desc: "Mensagem do backup" },
              { var: "{{data_backup}}", desc: "Data do backup" },
              { var: "{{hora_backup}}", desc: "Horário do backup" },
              { var: "{{total_encomendas}}", desc: "Total de encomendas" },
              { var: "{{total_produtos}}", desc: "Total de produtos" },
              { var: "{{total_clientes}}", desc: "Total de clientes" },
              { var: "{{filename}}", desc: "Nome do arquivo" },
              { var: "{{backup_size}}", desc: "Tamanho do backup" },
              { var: "{{backup_content}}", desc: "Conteúdo do backup em JSON" },
              { var: "{{download_url}}", desc: "URL para download do arquivo" },
            ].map((item) => (
              <div key={item.var} className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded text-xs">{item.var}</code>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          className="gap-2"
          onClick={() => window.open("https://dashboard.emailjs.com/admin/templates", "_blank")}
        >
          <ExternalLink className="w-4 h-4" />
          Abrir EmailJS Templates
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/configurar-emailjs")}
        >
          Voltar para Configurações
        </Button>
      </div>
    </div>
  );
}