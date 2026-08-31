import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle, Mail, AlertCircle, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import { ref, set, get } from "firebase/database";
import { database } from "../services/firebase";

export default function ConfigurarEmailJSPage() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [configurado, setConfigurado] = useState(false);
  
  const [credenciais, setCredenciais] = useState({
    publicKey: "",
    serviceId: "",
    templateId: ""
  });

  useEffect(() => {
    carregarCredenciais();
  }, []);

  const carregarCredenciais = async () => {
    try {
      setCarregando(true);
      console.log("🔄 Carregando credenciais do EmailJS...");
      
      const snapshot = await get(ref(database, "nicolina/configuracoes/emailjs"));
      
      if (snapshot.exists()) {
        const config = snapshot.val();
        console.log("✅ Credenciais encontradas!");
        setCredenciais({
          publicKey: config.publicKey || "",
          serviceId: config.serviceId || "",
          templateId: config.templateId || ""
        });
        setConfigurado(true);
      } else {
        console.log("ℹ️ Nenhuma credencial salva ainda");
        setConfigurado(false);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar credenciais:", error);
      toast.error("Erro ao carregar credenciais");
    } finally {
      setCarregando(false);
    }
  };

  const salvarCredenciais = async () => {
    // Validar campos
    if (!credenciais.publicKey.trim()) {
      toast.error("Digite a Public Key");
      return;
    }
    if (!credenciais.serviceId.trim()) {
      toast.error("Digite o Service ID");
      return;
    }
    if (!credenciais.templateId.trim()) {
      toast.error("Digite o Template ID");
      return;
    }

    try {
      setSalvando(true);
      console.log("💾 Salvando credenciais do EmailJS no Firebase...");
      
      await set(ref(database, "nicolina/configuracoes/emailjs"), {
        publicKey: credenciais.publicKey.trim(),
        serviceId: credenciais.serviceId.trim(),
        templateId: credenciais.templateId.trim()
      });
      
      console.log("✅ Credenciais salvas com sucesso!");
      setConfigurado(true);
      
      toast.success("✅ EmailJS configurado com sucesso! Backup automático ativado.", {
        duration: 5000
      });
      
      // Redirecionar para página de backup após 2 segundos
      setTimeout(() => {
        navigate("/backup");
      }, 2000);
      
    } catch (error) {
      console.error("❌ Erro ao salvar credenciais:", error);
      toast.error("Erro ao salvar credenciais");
    } finally {
      setSalvando(false);
    }
  };

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

  const configuracaoRapida = () => {
    setCredenciais({
      publicKey: "t5skEJYUQRT9aFUsm",
      serviceId: "service_h7g9x2o",
      templateId: "template_kb0jdhh"
    });
    toast.success("✅ Credenciais preenchidas! Clique em 'Salvar' para confirmar.");
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="w-8 h-8 text-blue-500" />
          Configurar EmailJS
        </h1>
        <p className="text-muted-foreground">
          Configure as credenciais do EmailJS para envio automático de backups
        </p>
      </div>

      {/* Status */}
      {configurado ? (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  ✅ EmailJS Configurado!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  O sistema está pronto para enviar backups automáticos por email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  ⚠️ EmailJS Não Configurado
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Configure as credenciais abaixo para ativar o backup automático por email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuração Rápida */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                🚀 Configuração Rápida (Recomendado)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Use as credenciais já configuradas e testadas. Basta clicar no botão abaixo!
              </p>
              <Button
                className="mt-3 gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={configuracaoRapida}
              >
                <CheckCircle className="w-4 h-4" />
                Preencher Automaticamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta - Template */}
      <Card className="border-red-500/50 bg-red-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                ⚠️ IMPORTANTE - Configure o Template no EmailJS
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Depois de salvar as credenciais aqui, você precisa configurar o <strong>template do EmailJS</strong> para funcionar corretamente.
                Se não configurar, você receberá o erro: <code className="bg-red-900/20 px-1 rounded">"recipients address is empty"</code>
              </p>
              <Button
                variant="outline"
                className="mt-3 gap-2 bg-red-900/10 border-red-900/20 hover:bg-red-900/20"
                onClick={() => navigate("/configurar-template-emailjs")}
              >
                📖 Ver Como Configurar Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais do EmailJS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Insira as credenciais do EmailJS para configurar o envio automático de backups.
            Se você ainda não tem uma conta, veja as instruções em{" "}
            <button
              onClick={() => navigate("/configurar-backup")}
              className="text-primary underline"
            >
              Passo a Passo EmailJS
            </button>
            .
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="publicKey">
                Public Key *
                <span className="text-xs text-muted-foreground ml-2">
                  (Encontre em: Account → API Keys)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="publicKey"
                  placeholder="Ex: t5skEJYUQRT9aFUsm"
                  value={credenciais.publicKey}
                  onChange={(e) => setCredenciais({ ...credenciais, publicKey: e.target.value })}
                />
                {credenciais.publicKey && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copiarTexto(credenciais.publicKey, "Public Key")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="serviceId">
                Service ID *
                <span className="text-xs text-muted-foreground ml-2">
                  (Encontre em: Email Services → Service ID)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="serviceId"
                  placeholder="Ex: service_h7g9x2o"
                  value={credenciais.serviceId}
                  onChange={(e) => setCredenciais({ ...credenciais, serviceId: e.target.value })}
                />
                {credenciais.serviceId && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copiarTexto(credenciais.serviceId, "Service ID")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="templateId">
                Template ID *
                <span className="text-xs text-muted-foreground ml-2">
                  (Encontre em: Email Templates → Template ID)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="templateId"
                  placeholder="Ex: template_kb0jdhh"
                  value={credenciais.templateId}
                  onChange={(e) => setCredenciais({ ...credenciais, templateId: e.target.value })}
                />
                {credenciais.templateId && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copiarTexto(credenciais.templateId, "Template ID")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={salvarCredenciais}
              disabled={salvando}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/backup")}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview das Credenciais */}
      {(credenciais.publicKey || credenciais.serviceId || credenciais.templateId) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview da Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify({
  nicolina: {
    configuracoes: {
      emailjs: {
        publicKey: credenciais.publicKey || "[não preenchido]",
        serviceId: credenciais.serviceId || "[não preenchido]",
        templateId: credenciais.templateId || "[não preenchido]"
      }
    }
  }
}, null, 2)}</pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Esta configuração será salva automaticamente no Firebase ao clicar em "Salvar"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>
                <strong>Preencha os campos acima</strong> com suas credenciais do EmailJS (ou use a configuração rápida)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>
                <strong>Clique em "Salvar"</strong> - as credenciais serão salvas no Firebase automaticamente
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>
                <strong>Pronto!</strong> O sistema já pode enviar backups automáticos por email
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded mt-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ <strong>Dica:</strong> Use a "Configuração Rápida" para preencher automaticamente com credenciais já testadas!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Valores Pré-configurados */}
      <Card className="border-purple-500/50 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100">
            📋 Valores Pré-configurados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Se você preferir, pode usar estas credenciais já configuradas:
          </p>
          
          <div className="space-y-2 text-sm bg-purple-900/10 p-4 rounded">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-purple-900 dark:text-purple-100">Public Key:</span>
                <code className="ml-2 bg-purple-900/20 px-2 py-1 rounded">t5skEJYUQRT9aFUsm</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiarTexto("t5skEJYUQRT9aFUsm", "Public Key")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-purple-900 dark:text-purple-100">Service ID:</span>
                <code className="ml-2 bg-purple-900/20 px-2 py-1 rounded">service_h7g9x2o</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiarTexto("service_h7g9x2o", "Service ID")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-purple-900 dark:text-purple-100">Template ID:</span>
                <code className="ml-2 bg-purple-900/20 px-2 py-1 rounded">template_kb0jdhh</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiarTexto("template_kb0jdhh", "Template ID")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 bg-purple-900/10 border-purple-900/20 hover:bg-purple-900/20"
            onClick={configuracaoRapida}
          >
            <CheckCircle className="w-4 h-4" />
            Usar Estas Credenciais (Configuração Rápida)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}