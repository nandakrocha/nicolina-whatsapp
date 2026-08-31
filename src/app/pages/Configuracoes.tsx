import { useState, useEffect } from "react";
import { Database, Upload, Download, AlertCircle, CheckCircle2, Cloud, HardDrive, ChevronRight, ExternalLink, Copy, Check, Rocket, Info, Eye, Code, Minimize, AlertTriangle, Clock, Bell } from "lucide-react";
import { migracaoAPI, verificarStatusBancoDados } from "../services/api";
import { isFirebaseConfigured } from "../services/firebase";
import { useNavigate } from "react-router";
import { VERSAO_SISTEMA, DATA_ATUALIZACAO, NOME_SISTEMA } from "../version";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { ConfiguracoesNotificacoes } from "../components/ConfiguracoesNotificacoes";
import { DiagnosticoArmazenamento } from "../components/DiagnosticoArmazenamento";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(verificarStatusBancoDados());
  const [migrandoagora, setMigrando] = useState(false);
  const [resultadoMigracao, setResultadoMigracao] = useState<any>(null);
  const [passoAtual, setPassoAtual] = useState(0);
  const [credenciaisCopiadas, setCredenciaisCopiadas] = useState(false);

  useEffect(() => {
    setStatus(verificarStatusBancoDados());
  }, []);

  const handleMigrar = async () => {
    if (!isFirebaseConfigured()) {
      alert("⚠️ Configure o Firebase primeiro! Veja as instruções abaixo.");
      return;
    }

    if (!confirm("Deseja migrar todos os dados do navegador para o Firebase?")) {
      return;
    }

    setMigrando(true);
    setResultadoMigracao(null);

    try {
      const resultado = await migracaoAPI.migrarParaFirebase();
      setResultadoMigracao(resultado);
      
      if (resultado.sucesso) {
        setTimeout(() => {
          setStatus(verificarStatusBancoDados());
        }, 1000);
      }
    } catch (error) {
      console.error("Erro na migração:", error);
      setResultadoMigracao({
        sucesso: false,
        erro: "Erro ao executar migração",
      });
    } finally {
      setMigrando(false);
    }
  };

  const handleExportar = async () => {
    try {
      const json = await migracaoAPI.exportarParaJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nicolina-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("❌ Erro ao exportar dados");
    }
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCredenciaisCopiadas(true);
    setTimeout(() => setCredenciaisCopiadas(false), 2000);
  };

  const PassoAPasso = () => {
    const passos = [
      {
        titulo: "1️⃣ Criar Conta no Firebase",
        descricao: "Acesse o site do Firebase e crie sua conta gratuita",
        detalhes: [
          "Abra o site: console.firebase.google.com",
          "Clique no botão 'Ir para o console' (canto superior direito)",
          "Faça login com sua conta do Gmail (qualquer email @gmail.com)",
          "Se não tiver conta Gmail, crie uma gratuitamente em gmail.com"
        ],
        link: "https://console.firebase.google.com",
        tempo: "1 minuto"
      },
      {
        titulo: "2️⃣ Criar Novo Projeto",
        descricao: "Dentro do Firebase Console, crie seu projeto",
        detalhes: [
          "Clique no botão grande 'Adicionar projeto' (ou 'Add project')",
          "Digite o nome: 'nicolina---teste-whatsapp' (pode ser outro nome)",
          "Clique em 'Continuar'",
          "DESMARQUE 'Ativar o Google Analytics' (não precisa)",
          "Clique em 'Criar projeto'",
          "Aguarde 10-20 segundos... Pronto!"
        ],
        tempo: "2 minutos"
      },
      {
        titulo: "3️⃣ Ativar Realtime Database",
        descricao: "Ative o banco de dados em tempo real",
        detalhes: [
          "No menu lateral esquerdo, procure 'Realtime Database'",
          "Clique em 'Realtime Database'",
          "Clique no botão 'Criar banco de dados'",
          "Localização: escolha 'United States (us-central1)' ou mais próximo",
          "Regras de segurança: escolha 'Iniciar em modo de teste'",
          "Clique em 'Ativar'",
          "Pronto! Seu banco está criado!"
        ],
        tempo: "1 minuto",
        importante: "⚠ IMPORTANTE: Escolha 'Modo de teste' para começar rápido. Você pode configurar segurança depois."
      },
      {
        titulo: "4️⃣ Obter Credenciais",
        descricao: "Copie as informações de conexão do seu projeto",
        detalhes: [
          "Clique no ícone de ENGRENAGEM ⚙️ (menu lateral, ao lado de 'Visão geral do projeto')",
          "Clique em 'Configurações do projeto'",
          "Role a página para baixo até a seção 'Seus apps'",
          "Clique no botão com ícone '</>' (código, para Web)",
          "Digite um apelido: 'Nicolina Web'",
          "NÃO marque 'Firebase Hosting'",
          "Clique em 'Registrar app'",
          "Vai aparecer um código JavaScript - COPIE TUDO!"
        ],
        tempo: "2 minutos"
      },
      {
        titulo: "5️⃣ Configurar no Sistema",
        descricao: "Cole as credenciais no sistema Nicolina",
        detalhes: [
          "Você verá um código parecido com isto:",
          "const firebaseConfig = { apiKey: 'AIza...', ... }",
          "COPIE apenas os valores dentro das aspas",
          "Vá para a próxima seção abaixo e cole cada valor"
        ],
        tempo: "2 minutos"
      }
    ];

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          📖 Passo a Passo para Leigos
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Siga este guia simples e em <strong>menos de 8 minutos</strong> seus dados estarão na nuvem! ☁️
        </p>

        <div className="space-y-4">
          {passos.map((passo, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setPassoAtual(passoAtual === index ? -1 : index)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    passoAtual === index
                      ? "bg-[#084d6e] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{passo.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{passo.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {passo.tempo}
                  </span>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                    passoAtual === index ? "rotate-90" : ""
                  }`} />
                </div>
              </button>

              {passoAtual === index && (
                <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
                  <ol className="space-y-2 mb-4">
                    {passo.detalhes.map((detalhe, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-[#084d6e] dark:text-blue-400 font-bold mt-0.5">•</span>
                        <span>{detalhe}</span>
                      </li>
                    ))}
                  </ol>

                  {passo.importante && (
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {passo.importante}
                      </p>
                    </div>
                  )}

                  {passo.link && (
                    <a
                      href={passo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#084d6e] hover:bg-[#063a52] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir Firebase Console
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900 dark:text-green-200 mb-1">
                💡 Dica Importante
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">
                Deixe a aba do Firebase Console aberta enquanto configura! Você vai precisar copiar e colar as credenciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações do Banco de Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure o Firebase para salvar seus dados na nuvem de forma gratuita e segura
        </p>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate("/migracao")}
          className="bg-gradient-to-r from-[#084d6e] to-[#063a52] hover:from-[#063a52] hover:to-[#084d6e] text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-4"
        >
          <Cloud className="w-8 h-8 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-bold text-lg">☁️ Migração para Nuvem</h3>
            <p className="text-sm opacity-90">Transfira seus dados para o Firebase</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/inicializar")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-4"
        >
          <Rocket className="w-8 h-8 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-bold text-lg">🚀 Inicializar Dados</h3>
            <p className="text-sm opacity-90">Criar dados de exemplo para testar</p>
          </div>
        </button>
      </div>

      {/* Status Atual */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Status do Banco de Dados
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Cloud className={status.firebaseConfigurado ? "h-5 w-5 text-green-500" : "h-5 w-5 text-gray-400"} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Firebase</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Banco de dados na nuvem</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.firebaseConfigurado 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}>
              {status.firebaseConfigurado ? "✅ Configurado" : "❌ Não Configurado"}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <HardDrive className={status.temDadosLocalStorage ? "h-5 w-5 text-orange-500" : "h-5 w-5 text-gray-400"} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">LocalStorage (Navegador)</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dados salvos apenas neste navegador</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.temDadosLocalStorage 
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
            }`}>
              {status.temDadosLocalStorage ? "📦 Com dados" : "⭕ Vazio"}
            </div>
          </div>
        </div>

        {!status.firebaseConfigurado && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-200 mb-1">
                  ⚠️ Sistema usando LocalStorage
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Seus dados estão salvos apenas no navegador atual. Se limpar o cache ou trocar de computador, os dados serão perdidos. 
                  Configure o Firebase abaixo para ter backup automático na nuvem!
                </p>
              </div>
            </div>
          </div>
        )}

        {status.firebaseConfigurado && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-200 mb-1">
                  ✅ Firebase Configurado e Funcionando!
                </p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Seus dados estão sendo salvos na nuvem automaticamente. Você pode acessá-los de qualquer dispositivo!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Passo a Passo */}
      {!status.firebaseConfigurado && <PassoAPasso />}

      {/* Formulário de Credenciais */}
      {!status.firebaseConfigurado && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🔑 Cole Suas Credenciais Aqui
          </h2>
          
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              <strong>📋 O que fazer:</strong>
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4">
              <li>1. Complete o Passo 4 acima (obter credenciais)</li>
              <li>2. Você verá um código com <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">firebaseConfig</code></li>
              <li>3. Edite o arquivo: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">/src/app/services/firebase.ts</code></li>
              <li>4. Substitua os valores <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">"PREENCHA_..."</code> pelos seus</li>
              <li>5. Salve o arquivo e recarregue esta página</li>
            </ol>
          </div>

          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 font-mono">firebase.ts</span>
              <button
                onClick={() => copiarTexto(`const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};`)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {credenciaisCopiadas ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="text-gray-300 overflow-x-auto">
              <code>{`const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};`}</code>
            </pre>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>💾 Onde editar:</strong> Arquivo localizado em <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">/src/app/services/firebase.ts</code> no seu projeto
            </p>
          </div>
        </div>
      )}

      {/* Migração */}
      {status.temDadosLocalStorage && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border-4 border-green-500 animate-pulse">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-600" />
            🚨 Migração de Dados Disponível
          </h2>

          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="font-bold text-green-900 dark:text-green-200 mb-2">
              ⚠️ ATENÇÃO: Você tem dados salvos apenas no navegador!
            </p>
            <p className="text-sm text-green-800 dark:text-green-300">
              Existem dados salvos no navegador. Migre-os para o Firebase para garantir backup e acesso de múltiplos dispositivos.
            </p>
          </div>

          <button
            onClick={handleMigrar}
            disabled={migrandoagora || !status.firebaseConfigurado}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            {migrandoagora ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                Migrando dados para a nuvem...
              </>
            ) : (
              <>
                <Cloud className="h-6 w-6" />
                🚀 MIGRAR DADOS PARA NUVEM AGORA
              </>
            )}
          </button>

          {!status.firebaseConfigurado && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
              ⚠️ Configure o Firebase primeiro para habilitar a migração
            </p>
          )}

          {resultadoMigracao && (
            <div className={`mt-4 p-4 rounded-lg ${
              resultadoMigracao.sucesso 
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              {resultadoMigracao.sucesso ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200 mb-2">
                      ✅ Migração concluída com sucesso!
                    </p>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                      <li>• {resultadoMigracao.encomendas} encomendas migradas</li>
                      <li>• {resultadoMigracao.produtos} produtos migrados</li>
                      <li>• {resultadoMigracao.clientes} clientes migrados</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200 mb-1">
                      ❌ Erro na migração
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {resultadoMigracao.erro}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exportar Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Backup de Segurança
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Baixe todos os seus dados em formato JSON como backup de segurança. Guarde este arquivo em local seguro!
        </p>

        <button
          onClick={handleExportar}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download className="h-5 w-5" />
          Exportar Dados (JSON)
        </button>
      </div>

      {/* Video Tutorial */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          🎥 Precisa de Ajuda Visual?
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Se preferir assistir um vídeo tutorial sobre como configurar o Firebase, procure no YouTube por:
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
          <p className="font-mono text-sm text-gray-800 dark:text-gray-200">
            "Como criar projeto Firebase" ou "Firebase Realtime Database tutorial"
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          💡 Os passos são praticamente idênticos aos descritos acima!
        </p>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-800/20 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Informações do Sistema
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Detalhes sobre a versão e atualizações do sistema <strong>{NOME_SISTEMA}</strong>:
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="font-mono text-sm text-gray-800 dark:text-gray-200">
            Versão: {VERSAO_SISTEMA}<br />
            Última Atualização: {DATA_ATUALIZACAO}
          </p>
        </div>
      </div>

      {/* Configurações de Notificações */}
      <ConfiguracoesNotificacoes />
      <DiagnosticoArmazenamento />
    </div>
  );
}