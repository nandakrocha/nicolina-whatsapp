import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Mail, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ChevronRight,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

export default function ConfigurarBackupPage() {
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [publicKey, setPublicKey] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const copiarTexto = (texto: string, nome: string) => {
    // Método 1: Tentar Clipboard API moderna
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto)
        .then(() => {
          toast.success(`${nome} copiado!`);
        })
        .catch(() => {
          // Método 2: Fallback para método antigo
          copiarTextoFallback(texto, nome);
        });
    } else {
      // Método 2: Fallback para método antigo
      copiarTextoFallback(texto, nome);
    }
  };

  const copiarTextoFallback = (texto: string, nome: string) => {
    try {
      // Criar elemento temporário
      const textArea = document.createElement("textarea");
      textArea.value = texto;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Tentar copiar
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success(`${nome} copiado!`);
      } else {
        toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
      }
    } catch (err) {
      toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
    }
  };

  const templateEmail = `Olá! 👋

Este é o backup automático do sistema Nicolina - Gestão de Encomendas.

📅 Data do Backup: {{data_backup}} às {{hora_backup}}

📊 Resumo dos Dados Salvos:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 📦 Encomendas: {{total_encomendas}}
• 🍞 Produtos cadastrados: {{total_produtos}}
• 👥 Clientes: {{total_clientes}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📎 Nome do arquivo: {{filename}}

⚠️ IMPORTANTE: O arquivo de backup está anexado a este email em formato JSON.
Guarde este arquivo em local seguro (Google Drive, Dropbox, etc.)

🔄 COMO RESTAURAR ESTE BACKUP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Acesse o sistema Nicolina
2. Clique em "💾 Backup e Restauração" no menu lateral
3. Clique no botão "Restaurar"
4. Selecione o arquivo JSON anexado neste email
5. Confirme a restauração
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Este backup foi gerado automaticamente pelo sistema.
🔒 Mantenha seus backups em local seguro.
🍞 Obrigado por usar o Sistema Nicolina!

--
Este é um email automático. Não responda esta mensagem.
Sistema Nicolina - Gestão de Encomendas de Padaria`;

  const jsonFirebase = `{
  "nicolina": {
    "configuracoes": {
      "emailjs": {
        "publicKey": "${publicKey || 'COLE_SUA_PUBLIC_KEY_AQUI'}",
        "serviceId": "${serviceId || 'COLE_SEU_SERVICE_ID_AQUI'}",
        "templateId": "${templateId || 'COLE_SEU_TEMPLATE_ID_AQUI'}"
      }
    }
  }
}`;

  const etapas = [
    {
      numero: 1,
      titulo: "Criar Conta no EmailJS",
      descricao: "Cadastre-se gratuitamente (200 emails/mês)",
      concluida: false,
    },
    {
      numero: 2,
      titulo: "Conectar Email",
      descricao: "Conecte Gmail, Outlook ou outro provedor",
      concluida: false,
    },
    {
      numero: 3,
      titulo: "Criar Template",
      descricao: "Configure o modelo do email de backup",
      concluida: false,
    },
    {
      numero: 4,
      titulo: "Obter Credenciais",
      descricao: "Copie Public Key, Service ID e Template ID",
      concluida: false,
    },
    {
      numero: 5,
      titulo: "Configurar Firebase",
      descricao: "Cole as credenciais no Firebase Database",
      concluida: false,
    },
    {
      numero: 6,
      titulo: "Testar Backup",
      descricao: "Envie um backup de teste por email",
      concluida: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📧 Configurar Backup Automático
        </h1>
        <p className="text-muted-foreground">
          Siga o passo a passo para ativar o envio automático de backups por email
        </p>
      </div>

      {/* Info */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                O que é EmailJS?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                É um serviço gratuito que permite enviar emails automaticamente do navegador, sem precisar de servidor.
                Perfeito para o sistema de backup da Nicolina!
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>✅ <strong>Gratuito:</strong> 200 emails por mês (suficiente para backup diário)</li>
                <li>✅ <strong>Fácil:</strong> Configuração em 10 minutos</li>
                <li>✅ <strong>Seguro:</strong> Sem cartão de crédito, sem pegadinhas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {etapas.map((etapa) => (
              <div
                key={etapa.numero}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  etapaAtual === etapa.numero
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    etapa.concluida
                      ? "bg-green-500 text-white"
                      : etapaAtual === etapa.numero
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {etapa.concluida ? <CheckCircle className="w-5 h-5" /> : etapa.numero}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{etapa.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                </div>
                {etapaAtual === etapa.numero && (
                  <ChevronRight className="w-5 h-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Etapa 1: Criar Conta */}
      <Card className={etapaAtual === 1 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              1
            </span>
            Criar Conta no EmailJS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Acesse o site do EmailJS</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => window.open("https://www.emailjs.com/", "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir emailjs.com
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique em <strong>"Sign Up"</strong> (botão laranja no canto superior direito)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Preencha com seu email e senha, depois clique em <strong>"Sign Up"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>Confirme seu email (verifique a caixa de entrada)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <div>
                <p className="font-medium">Faça login no painel</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => window.open("https://dashboard.emailjs.com/", "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Dashboard
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={() => setEtapaAtual(2)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 2: Conectar Email */}
      <Card className={etapaAtual === 2 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              2
            </span>
            Conectar Serviço de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    ⚠️ ATENÇÃO - Erro 412 do Gmail
                  </p>
                  <p className="text-red-800 dark:text-red-200 mt-1">
                    Se você receber erro <code className="bg-red-900/20 px-1 rounded">412 Gmail_API: A solicitação não possuía escopos de autenticação suficientes</code>, 
                    significa que o Gmail não deu permissão completa. Siga EXATAMENTE estes passos:
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-red-800 dark:text-red-200">
                    <li>No EmailJS, vá em <strong>Email Services</strong></li>
                    <li>Clique no serviço Gmail que você criou</li>
                    <li>Clique em <strong>"Reconnect Service"</strong> ou <strong>"Disconnect"</strong> e conecte novamente</li>
                    <li>Quando a janela do Google abrir, clique em <strong>"Avançado"</strong></li>
                    <li>Clique em <strong>"Ir para EmailJS (não seguro)"</strong></li>
                    <li>Marque <strong>TODAS as caixas</strong> de permissão, incluindo "Enviar emails em seu nome"</li>
                    <li>Clique em <strong>"Permitir"</strong> ou <strong>"Continuar"</strong></li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>No painel do EmailJS, clique em <strong>"Email Services"</strong> no menu lateral</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique em <strong>"Add New Service"</strong> (botão azul)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="mb-2">Escolha seu provedor:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded p-2 text-sm">📧 Gmail (recomendado)</div>
                  <div className="border rounded p-2 text-sm">📧 Outlook/Hotmail</div>
                  <div className="border rounded p-2 text-sm">📧 Yahoo</div>
                  <div className="border rounded p-2 text-sm">📧 Outro</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Clique em <strong>"Connect Account"</strong></p>
                <p className="text-sm text-muted-foreground mt-1">
                  Uma janela do Google vai abrir. É IMPORTANTE seguir estes passos:
                </p>
                <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
                  <li>Faça login com sua conta Gmail</li>
                  <li>Quando aparecer "Este app não foi verificado", clique em <strong>"Avançado"</strong></li>
                  <li>Clique em <strong>"Ir para EmailJS (não seguro)"</strong></li>
                  <li><strong className="text-primary">MARQUE TODAS AS CAIXAS DE PERMISSÃO</strong></li>
                  <li>Especialmente: <strong>"Enviar emails em seu nome"</strong></li>
                  <li>Clique em <strong>"Permitir"</strong></li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p>Dê um nome (ex: "Nicolina Backup") e clique em <strong>"Create Service"</strong></p>
            </div>
          </div>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ⚡ IMPORTANTE - Copie o Service ID!
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    Após criar o serviço, você verá um código parecido com: <code className="bg-amber-900/20 px-1 rounded">service_abc1234</code>
                    <br />
                    <strong>COPIE ESSE CÓDIGO!</strong> Você vai precisar dele.
                  </p>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Cole seu Service ID aqui:
                    </label>
                    <input
                      type="text"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      placeholder="service_..."
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setEtapaAtual(3)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 3: Criar Template */}
      <Card className={etapaAtual === 3 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              3
            </span>
            Criar Template de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>No painel do EmailJS, clique em <strong>"Email Templates"</strong> no menu lateral</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique em <strong>"Create New Template"</strong> (botão azul)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div className="flex-1">
                <p className="mb-2">Configure os campos:</p>
                <div className="space-y-2 text-sm">
                  <div className="border rounded p-2">
                    <strong>Template Name:</strong> Backup Nicolina
                  </div>
                  <div className="border rounded p-2">
                    <strong>Subject:</strong> <code>{`{{subject}}`}</code>
                  </div>
                  <div className="border rounded p-2">
                    <strong>From Name:</strong> Sistema Nicolina
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div className="flex-1">
                <p className="mb-2">Copie e cole este conteúdo no campo <strong>"Content"</strong>:</p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-48">
                    {templateEmail}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 gap-2"
                    onClick={() => copiarTexto(templateEmail, "Template")}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p>Clique em <strong>"Save"</strong> no canto superior direito</p>
            </div>
          </div>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ⚡ IMPORTANTE - Copie o Template ID!
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    Após salvar, você verá um código parecido com: <code className="bg-amber-900/20 px-1 rounded">template_xyz7890</code>
                    <br />
                    <strong>COPIE ESSE CÓDIGO!</strong> Você vai precisar dele.
                  </p>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Cole seu Template ID aqui:
                    </label>
                    <input
                      type="text"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      placeholder="template_..."
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setEtapaAtual(4)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 4: Public Key */}
      <Card className={etapaAtual === 4 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              4
            </span>
            Obter Public Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>No painel do EmailJS, clique em <strong>"Account"</strong> no menu lateral</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique em <strong>"General"</strong> (se não estiver já selecionado)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Role a página para baixo até encontrar <strong>"API Keys"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>Copie o código da <strong>"Public Key"</strong></p>
            </div>
          </div>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ⚡ IMPORTANTE - Copie a Public Key!
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    Você verá um código parecido com: <code className="bg-amber-900/20 px-1 rounded">user_abc123xyz456</code>
                    <br />
                    <strong>COPIE ESSE CÓDIGO!</strong> Você vai precisar dele.
                  </p>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Cole sua Public Key aqui:
                    </label>
                    <input
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="user_..."
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setEtapaAtual(5)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 5: Firebase */}
      <Card className={etapaAtual === 5 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              5
            </span>
            Configurar no Firebase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Acesse o Firebase Console</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => window.open("https://console.firebase.google.com", "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Firebase Console
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique no projeto <strong>"nicolina---teste-whatsapp"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>No menu lateral, clique em <strong>"Realtime Database"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>Clique nos <strong>três pontinhos (⋮)</strong> no topo e selecione <strong>"Import JSON"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <div className="flex-1">
                <p className="mb-2">Copie e cole este JSON (já preenchido com seus códigos!):</p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {jsonFirebase}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 gap-2"
                    onClick={() => copiarTexto(jsonFirebase, "JSON do Firebase")}
                    disabled={!publicKey || !serviceId || !templateId}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
                {(!publicKey || !serviceId || !templateId) && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Preencha os campos nas etapas anteriores para gerar o JSON automaticamente!
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">6</span>
              </div>
              <p>Clique em <strong>"Import"</strong> para confirmar</p>
            </div>
          </div>

          <Button onClick={() => setEtapaAtual(6)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 6: Testar */}
      <Card className={etapaAtual === 6 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              6
            </span>
            Testar o Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Vá para a página <strong>"💾 Backup e Restauração"</strong> no menu lateral</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Configure o email onde quer receber os backups e o horário diário</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Marque a opção <strong>"Ativar backup automático diário"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>Clique em <strong>"Salvar Configurações"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p>Clique no botão <strong>"Enviar Backup Agora"</strong> para testar</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">6</span>
              </div>
              <p>Verifique seu email (não esqueça de olhar SPAM/Promoções!)</p>
            </div>
          </div>

          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    🎉 Parabéns! Backup Automático Configurado!
                  </p>
                  <p className="text-green-800 dark:text-green-200 mt-1">
                    Agora seu sistema enviará backups automaticamente todo dia no horário configurado.
                    <br />
                    ✅ 100% automático, sem interação necessária!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => navigate("/backup")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Ir para Backup e Restauração
          </Button>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Resumo das Credenciais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-background rounded">
              <span className="font-medium">Public Key:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {publicKey || "Não informado"}
              </code>
            </div>
            <div className="flex justify-between items-center p-2 bg-background rounded">
              <span className="font-medium">Service ID:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {serviceId || "Não informado"}
              </code>
            </div>
            <div className="flex justify-between items-center p-2 bg-background rounded">
              <span className="font-medium">Template ID:</span>
              <code className="bg-muted px-2 py-1 rounded">
                {templateId || "Não informado"}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}