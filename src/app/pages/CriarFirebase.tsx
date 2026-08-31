import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AlertCircle, CheckCircle, Copy, ExternalLink, ChevronRight, Flame } from "lucide-react";
import { toast } from "sonner";
import { ref, set } from "firebase/database";
import { database } from "../services/firebase";

export default function CriarFirebasePage() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [credenciais, setCredenciais] = useState({
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  });

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
        toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
      }
    } catch (err) {
      toast.error(`Erro ao copiar ${nome}. Selecione e copie manualmente.`);
    }
  };

  const salvarCredenciais = async () => {
    // Validar se todos os campos estão preenchidos
    const camposVazios = Object.entries(credenciais).filter(([key, value]) => !value.trim());
    
    if (camposVazios.length > 0) {
      toast.error("Preencha todas as credenciais antes de salvar");
      return;
    }

    try {
      // Salvar no Firebase
      await set(ref(database, "nicolina/configuracoes/firebase"), credenciais);
      toast.success("✅ Credenciais salvas! Recarregue a página para aplicar.");
      
      // Mostrar instruções para recarregar
      setTimeout(() => {
        if (confirm("Credenciais salvas! Deseja recarregar a página agora para aplicar as mudanças?")) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar credenciais:", error);
      toast.error("Erro ao salvar credenciais. Verifique o console.");
    }
  };

  const gerarCodigoFirebase = () => {
    return `const firebaseConfig = {
  apiKey: "${credenciais.apiKey || 'SUA_API_KEY'}",
  authDomain: "${credenciais.authDomain || 'seu-projeto.firebaseapp.com'}",
  databaseURL: "${credenciais.databaseURL || 'https://seu-projeto-default-rtdb.firebaseio.com'}",
  projectId: "${credenciais.projectId || 'seu-projeto'}",
  storageBucket: "${credenciais.storageBucket || 'seu-projeto.appspot.com'}",
  messagingSenderId: "${credenciais.messagingSenderId || '123456789'}",
  appId: "${credenciais.appId || '1:123456789:web:abc123'}"
};`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Flame className="w-8 h-8 text-orange-500" />
          Criar Seu Próprio Projeto Firebase
        </h1>
        <p className="text-muted-foreground">
          Configure o sistema Nicolina com seu próprio banco de dados Firebase
        </p>
      </div>

      {/* Alerta Importante */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Por que criar seu próprio Firebase?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                <li>✅ <strong>Controle total</strong> dos seus dados</li>
                <li>✅ <strong>Privacidade</strong> - apenas você tem acesso</li>
                <li>✅ <strong>Gratuito</strong> - Firebase oferece plano grátis generoso</li>
                <li>✅ <strong>Escalável</strong> - cresce conforme sua necessidade</li>
                <li>✅ <strong>Backup próprio</strong> - seus dados ficam na sua conta</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((etapa) => (
          <div key={etapa} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                etapa <= etapaAtual
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {etapa}
            </div>
            {etapa < 5 && (
              <div
                className={`flex-1 h-1 rounded ${
                  etapa < etapaAtual ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Etapa 1: Acessar Firebase */}
      <Card className={etapaAtual === 1 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              1
            </span>
            Acessar o Firebase Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Acesse o console do Firebase e faça login com sua conta Google
          </p>

          <Button
            className="w-full gap-2"
            onClick={() => window.open("https://console.firebase.google.com", "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Firebase Console
          </Button>

          <div className="bg-muted/50 p-4 rounded text-sm space-y-2">
            <p><strong>Passo 1:</strong> Clique no botão acima</p>
            <p><strong>Passo 2:</strong> Faça login com sua conta Google</p>
            <p><strong>Passo 3:</strong> Você será direcionado para o console do Firebase</p>
          </div>

          <Button onClick={() => setEtapaAtual(2)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 2: Criar Projeto */}
      <Card className={etapaAtual === 2 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              2
            </span>
            Criar Novo Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>No console do Firebase, clique em <strong>"Adicionar projeto"</strong> ou <strong>"Add project"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="mb-2">Digite um nome para seu projeto:</p>
                <div className="bg-muted p-3 rounded">
                  <p className="font-mono text-xs">📝 Exemplo: <strong>minha-padaria-nicolina</strong></p>
                  <p className="text-xs text-muted-foreground mt-1">Use apenas letras minúsculas, números e hífens</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Clique em <strong>"Continuar"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p>
                Desative o <strong>"Google Analytics"</strong> (não é necessário) e clique em <strong>"Criar projeto"</strong>
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p>Aguarde alguns segundos enquanto o Firebase cria seu projeto</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">6</span>
              </div>
              <p>Clique em <strong>"Continuar"</strong> quando o projeto estiver pronto</p>
            </div>
          </div>

          <Button onClick={() => setEtapaAtual(3)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 3: Ativar Realtime Database */}
      <Card className={etapaAtual === 3 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              3
            </span>
            Ativar Realtime Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ⚠️ IMPORTANTE - Realtime Database (não Firestore!)
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    O sistema Nicolina usa <strong>Realtime Database</strong>, NÃO Firestore. 
                    São serviços diferentes do Firebase!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>No menu lateral esquerdo, clique em <strong>"Build"</strong> (Criar)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Clique em <strong>"Realtime Database"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Clique no botão <strong>"Criar banco de dados"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p className="mb-2">Escolha a localização:</p>
                <div className="bg-muted p-3 rounded">
                  <p className="font-mono text-xs">📍 Recomendado: <strong>United States (us-central1)</strong></p>
                  <p className="text-xs text-muted-foreground mt-1">Ou escolha a mais próxima de você</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p>Clique em <strong>"Avançar"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">6</span>
              </div>
              <div>
                <p className="mb-2">Escolha o modo de segurança:</p>
                <div className="bg-muted p-3 rounded space-y-2">
                  <p className="font-mono text-xs">🔓 <strong>Modo de teste</strong> (recomendado para começar)</p>
                  <p className="text-xs text-muted-foreground">Permite leitura/escrita por 30 dias</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    ⚠️ Depois você pode configurar regras de segurança mais restritivas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">7</span>
              </div>
              <p>Clique em <strong>"Ativar"</strong></p>
            </div>
          </div>

          <Button onClick={() => setEtapaAtual(4)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 4: Obter Credenciais */}
      <Card className={etapaAtual === 4 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              4
            </span>
            Obter Credenciais do Firebase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Na visão geral do projeto, clique no ícone <strong>Web {"</>"}</strong> (código)</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Digite um apelido para seu app (ex: "Nicolina Web")</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>NÃO marque "Firebase Hosting" - clique em <strong>"Registrar app"</strong></p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div className="flex-1">
                <p className="mb-2">Você verá um código assim:</p>
                <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre>{`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://...",
  projectId: "seu-projeto",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};`}</pre>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">5</span>
              </div>
              <p><strong>COPIE</strong> cada valor e cole nos campos abaixo ⬇️</p>
            </div>
          </div>

          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    💡 DICA - Onde encontrar cada campo?
                  </p>
                  <p className="text-green-800 dark:text-green-200 mt-1">
                    O Firebase mostra todos esses valores na tela "Adicionar app da Web". 
                    Basta copiar e colar um por um nos campos abaixo!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setEtapaAtual(5)} className="w-full">
            Próxima Etapa <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Etapa 5: Inserir Credenciais */}
      <Card className={etapaAtual === 5 ? "border-primary shadow-lg" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              5
            </span>
            Inserir Suas Credenciais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cole aqui as credenciais que você copiou do Firebase Console
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                placeholder="AIzaSy..."
                value={credenciais.apiKey}
                onChange={(e) => setCredenciais({ ...credenciais, apiKey: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="authDomain">Auth Domain *</Label>
              <Input
                id="authDomain"
                placeholder="seu-projeto.firebaseapp.com"
                value={credenciais.authDomain}
                onChange={(e) => setCredenciais({ ...credenciais, authDomain: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="databaseURL">Database URL *</Label>
              <Input
                id="databaseURL"
                placeholder="https://seu-projeto-default-rtdb.firebaseio.com"
                value={credenciais.databaseURL}
                onChange={(e) => setCredenciais({ ...credenciais, databaseURL: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                placeholder="seu-projeto"
                value={credenciais.projectId}
                onChange={(e) => setCredenciais({ ...credenciais, projectId: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="storageBucket">Storage Bucket *</Label>
              <Input
                id="storageBucket"
                placeholder="seu-projeto.appspot.com"
                value={credenciais.storageBucket}
                onChange={(e) => setCredenciais({ ...credenciais, storageBucket: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="messagingSenderId">Messaging Sender ID *</Label>
              <Input
                id="messagingSenderId"
                placeholder="123456789"
                value={credenciais.messagingSenderId}
                onChange={(e) => setCredenciais({ ...credenciais, messagingSenderId: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="appId">App ID *</Label>
              <Input
                id="appId"
                placeholder="1:123456789:web:abc123"
                value={credenciais.appId}
                onChange={(e) => setCredenciais({ ...credenciais, appId: e.target.value })}
              />
            </div>
          </div>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ⚠️ Antes de salvar - Configure as Regras
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    Para o sistema funcionar corretamente, você precisa configurar as regras do Realtime Database:
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-amber-800 dark:text-amber-200">
                    <li>No Firebase Console, vá em <strong>Realtime Database → Rules</strong></li>
                    <li>Cole as regras abaixo e clique em <strong>"Publicar"</strong></li>
                  </ol>
                  <div className="bg-amber-900/20 p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                    <pre>{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}</pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2"
                    onClick={() => copiarTexto(`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`, "Regras do Firebase")}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Regras
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={salvarCredenciais} className="flex-1 gap-2">
              <CheckCircle className="w-4 h-4" />
              Salvar e Aplicar Configurações
            </Button>
            <Button
              variant="outline"
              onClick={() => copiarTexto(gerarCodigoFirebase(), "Código Firebase")}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Código
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Final */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                🎉 Pronto! Após salvar:
              </h3>
              <ul className="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1">
                <li>✅ Suas credenciais serão salvas no Firebase</li>
                <li>✅ A página será recarregada</li>
                <li>✅ O sistema conectará ao SEU projeto Firebase</li>
                <li>✅ Todos os dados ficarão na SUA conta</li>
                <li>✅ Você terá controle total do banco de dados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
