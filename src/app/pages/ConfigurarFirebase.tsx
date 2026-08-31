import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle, Copy, ExternalLink, AlertCircle, Flame } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function ConfigurarFirebasePage() {
  const navigate = useNavigate();

  const copiarTexto = (texto: string, nome: string) => {
    // Método 1: Tentar Clipboard API moderna
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto)
        .then(() => {
          toast.success(`${nome} copiado!`);
        })
        .catch(() => {
          copiarTextoFallback(texto, nome);
        });
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
        toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
      }
    } catch (err) {
      toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
    }
  };

  const firebaseConfigAtual = {
    apiKey: "AIzaSyB4vlluwt_b4TAAMRi75Yt2ZER3W8d50tA",
    authDomain: "nicolina---teste-whatsapp.firebaseapp.com",
    databaseURL: "https://nicolina---teste-whatsapp-default-rtdb.firebaseio.com",
    projectId: "nicolina---teste-whatsapp",
    storageBucket: "nicolina---teste-whatsapp.firebasestorage.app",
    messagingSenderId: "592701719321",
    appId: "1:592701719321:web:653c9a5628465793947b88"
  };

  const firebaseConfigTexto = JSON.stringify(firebaseConfigAtual, null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🔥 Configuração do Firebase
        </h1>
        <p className="text-muted-foreground">
          Informações sobre o banco de dados do sistema Nicolina
        </p>
      </div>

      {/* Status */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                ✅ Firebase JÁ ESTÁ CONFIGURADO!
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                O sistema Nicolina já vem com o Firebase pré-configurado e pronto para uso.
                Você <strong>NÃO precisa fazer nada</strong> - tudo já está funcionando!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para criar próprio Firebase */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Flame className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                🚀 Quer usar SEU PRÓPRIO Firebase?
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                Prefere ter controle total? Crie seu próprio projeto Firebase gratuitamente!
              </p>
              <ul className="text-sm text-orange-800 dark:text-orange-200 mt-2 space-y-1">
                <li>✅ 100% grátis (plano Spark do Firebase)</li>
                <li>✅ Controle total dos seus dados</li>
                <li>✅ Privacidade completa</li>
                <li>✅ Configuração guiada passo a passo</li>
              </ul>
              <Button
                className="mt-3 gap-2 bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate("/criar-firebase")}
              >
                <Flame className="w-4 h-4" />
                Criar Meu Próprio Firebase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                📌 Projeto Firebase Atual
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                O sistema está conectado ao projeto: <code className="bg-blue-900/20 px-2 py-1 rounded font-mono">nicolina---teste-whatsapp</code>
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                Este é um projeto Firebase compartilhado para uso do sistema Nicolina. 
                Todos os dados são armazenados de forma organizada no Firebase Realtime Database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credenciais Atuais */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais do Firebase (Hardcoded)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estas credenciais estão embutidas no arquivo <code className="bg-muted px-2 py-0.5 rounded">/src/app/services/firebase.ts</code>
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">API Key:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.apiKey}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">Auth Domain:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.authDomain}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">Database URL:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.databaseURL}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">Project ID:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.projectId}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">Storage Bucket:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.storageBucket}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">Messaging Sender ID:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.messagingSenderId}
              </code>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded">
              <span className="font-medium text-muted-foreground">App ID:</span>
              <code className="bg-background px-2 py-1 rounded break-all">
                {firebaseConfigAtual.appId}
              </code>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copiarTexto(firebaseConfigTexto, "Configuração do Firebase")}
            >
              <Copy className="w-4 h-4" />
              Copiar JSON Completo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("https://console.firebase.google.com/project/nicolina---teste-whatsapp", "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Firebase Console
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estrutura de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Dados no Firebase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O sistema organiza os dados da seguinte forma no Firebase Realtime Database:
          </p>

          <div className="bg-muted p-4 rounded font-mono text-xs">
            <div className="space-y-1">
              <div>📁 <strong>nicolina/</strong></div>
              <div className="ml-4">├─ 📁 <strong>encomendas/</strong> <span className="text-muted-foreground">← Pedidos recebidos</span></div>
              <div className="ml-4">├─ 📁 <strong>produtos/</strong> <span className="text-muted-foreground">← Produtos da padaria</span></div>
              <div className="ml-4">├─ 📁 <strong>clientes/</strong> <span className="text-muted-foreground">← Cadastro de clientes</span></div>
              <div className="ml-4">├─ 📁 <strong>backups/</strong> <span className="text-muted-foreground">← Histórico de backups</span></div>
              <div className="ml-4">└─ 📁 <strong>configuracoes/</strong></div>
              <div className="ml-8">├─ 📁 <strong>backup/</strong> <span className="text-muted-foreground">← Config de backup automático</span></div>
              <div className="ml-8">└─ 📁 <strong>emailjs/</strong> <span className="text-muted-foreground">← Credenciais do EmailJS</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                🔒 Segurança e Privacidade
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                <li>✅ <strong>Dados separados por namespace:</strong> Cada instalação usa o prefixo "nicolina/"</li>
                <li>✅ <strong>Regras de segurança:</strong> Configure no Firebase Console para controlar acesso</li>
                <li>✅ <strong>Backup automático:</strong> Seus dados são salvos diariamente por email</li>
                <li>⚠️ <strong>Projeto compartilhado:</strong> As credenciais são públicas, configure regras no Firebase</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">❓ Preciso configurar algo?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>NÃO!</strong> O Firebase já está configurado e funcionando. Você só precisa configurar o EmailJS se quiser backup automático por email.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">❓ Posso usar meu próprio Firebase?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Sim! Você pode criar seu próprio projeto Firebase e substituir as credenciais no arquivo <code className="bg-muted px-1 rounded">/src/app/services/firebase.ts</code>
            </p>
          </div>

          <div>
            <h4 className="font-semibold">❓ Meus dados estão seguros?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Os dados ficam no Firebase Realtime Database. Recomendamos configurar regras de segurança no Firebase Console e fazer backups regulares.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">❓ Onde configuro as regras de segurança?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o Firebase Console → Realtime Database → Rules. Configure quem pode ler/escrever dados.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">❓ O que é esse projeto "nicolina---teste-whatsapp"?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              É o projeto Firebase criado especificamente para o sistema Nicolina. Contém o banco de dados e todas as configurações necessárias.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader>
          <CardTitle>Links Úteis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open("https://console.firebase.google.com/project/nicolina---teste-whatsapp", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Firebase Console (nicolina---teste-whatsapp)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open("https://console.firebase.google.com/project/nicolina---teste-whatsapp/database/nicolina---teste-whatsapp-default-rtdb/data", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Ver Dados no Realtime Database
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open("https://console.firebase.google.com/project/nicolina---teste-whatsapp/database/nicolina---teste-whatsapp-default-rtdb/rules", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Configurar Regras de Segurança
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => window.open("https://firebase.google.com/docs/database", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Documentação do Firebase Realtime Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}