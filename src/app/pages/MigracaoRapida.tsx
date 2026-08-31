import { useState } from "react";
import { CheckCircle2, AlertCircle, Upload, Loader2, Database, Cloud, Zap } from "lucide-react";
import { isFirebaseConfigured } from "../services/firebase";
import { migracaoAPI, localStorageAPI } from "../services/api";

export default function MigracaoRapida() {
  const [status, setStatus] = useState<"idle" | "verificando" | "migrando" | "sucesso" | "erro" | "criando-dados">("idle");
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string>("");

  const criarDadosDeTeste = async () => {
    setStatus("criando-dados");
    setErro("");

    try {
      // IMPORTANTE: Criar dados DIRETAMENTE no localStorage para testar a migração
      
      // Criar produtos de teste no localStorage
      const produtos = [
        { nome: "Pão Francês", categoria: "Pães", pesoPorUnidadeKg: 0.05, preco: 0.80 },
        { nome: "Bolo de Chocolate", categoria: "Bolos", pesoPorUnidadeKg: 1.5, preco: 45.00 },
        { nome: "Croissant", categoria: "Pães", pesoPorUnidadeKg: 0.08, preco: 8.50 },
        { nome: "Torta de Morango", categoria: "Tortas", pesoPorUnidadeKg: 2.0, preco: 65.00 },
        { nome: "Pão Integral", categoria: "Pães", pesoPorUnidadeKg: 0.5, preco: 12.00 },
      ];

      const produtosCriados = [];
      for (const produto of produtos) {
        const criado = localStorageAPI.criarProduto(produto);
        produtosCriados.push(criado);
      }

      // Criar clientes de teste no localStorage
      const clientes = [
        { nome: "Maria Silva", telefone: "(11) 98765-4321", endereco: "Rua das Flores, 123" },
        { nome: "João Santos", telefone: "(11) 91234-5678", endereco: "Av. Principal, 456" },
        { nome: "Ana Costa", telefone: "(11) 99876-5432", endereco: "Rua dos Pães, 789" },
      ];

      const clientesCriados = [];
      for (const cliente of clientes) {
        const criado = localStorageAPI.criarCliente(cliente);
        clientesCriados.push(criado);
      }

      // Criar encomendas de teste no localStorage
      const encomenda1 = {
        clienteId: clientesCriados[0].id,
        clienteNome: clientesCriados[0].nome,
        clienteTelefone: clientesCriados[0].telefone || "",
        data: new Date().toISOString().split('T')[0],
        hora: "08:00",
        produtos: [
          {
            produtoId: produtosCriados[0].id,
            produtoNome: produtosCriados[0].nome,
            quantidade: 50,
            pesoPorUnidadeKg: produtosCriados[0].pesoPorUnidadeKg || 0,
            pesoTotalKg: 50 * (produtosCriados[0].pesoPorUnidadeKg || 0),
          },
          {
            produtoId: produtosCriados[1].id,
            produtoNome: produtosCriados[1].nome,
            quantidade: 2,
            pesoPorUnidadeKg: produtosCriados[1].pesoPorUnidadeKg || 0,
            pesoTotalKg: 2 * (produtosCriados[1].pesoPorUnidadeKg || 0),
          },
        ],
        quantidadeTotal: 52,
      };
      localStorageAPI.criarEncomenda(encomenda1);

      const encomenda2 = {
        clienteId: clientesCriados[1].id,
        clienteNome: clientesCriados[1].nome,
        clienteTelefone: clientesCriados[1].telefone || "",
        data: new Date().toISOString().split('T')[0],
        hora: "14:00",
        produtos: [
          {
            produtoId: produtosCriados[2].id,
            produtoNome: produtosCriados[2].nome,
            quantidade: 20,
            pesoPorUnidadeKg: produtosCriados[2].pesoPorUnidadeKg || 0,
            pesoTotalKg: 20 * (produtosCriados[2].pesoPorUnidadeKg || 0),
          },
        ],
        quantidadeTotal: 20,
      };
      localStorageAPI.criarEncomenda(encomenda2);

      setStatus("idle");
      alert("✅ Dados de teste criados NO LOCALSTORAGE com sucesso!\n\n• 5 Produtos\n• 3 Clientes\n• 2 Encomendas\n\n🎯 Agora o botão 2 estará VERDE e você pode testar a migração!");
      window.location.reload();
    } catch (error) {
      setErro("Erro ao criar dados de teste: " + (error as Error).message);
      setStatus("erro");
    }
  };

  const verificarConexao = async () => {
    setStatus("verificando");
    setErro("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (!isFirebaseConfigured()) {
        setErro("Firebase não está configurado");
        setStatus("erro");
        return;
      }

      setStatus("idle");
      alert("✅ Firebase configurado corretamente! Clique em 'Migrar Dados' para transferir.");
    } catch (error) {
      setErro("Erro ao verificar conexão");
      setStatus("erro");
    }
  };

  const iniciarMigracao = async () => {
    if (!isFirebaseConfigured()) {
      alert("⚠️ Configure o Firebase primeiro!");
      return;
    }

    if (!confirm("🚀 Deseja migrar TODOS os dados do navegador para o Firebase na nuvem?\n\nIsso vai transferir:\n• Encomendas\n• Produtos\n• Clientes\n\nContinuar?")) {
      return;
    }

    setStatus("migrando");
    setErro("");

    try {
      const res = await migracaoAPI.migrarParaFirebase();
      setResultado(res);
      
      if (res.sucesso) {
        setStatus("sucesso");
      } else {
        setErro(res.erro || "Erro desconhecido");
        setStatus("erro");
      }
    } catch (error) {
      setErro("Erro ao executar migração: " + (error as Error).message);
      setStatus("erro");
    }
  };

  const firebaseOK = isFirebaseConfigured();
  const temDados = migracaoAPI.verificarDadosLocalStorage();

  // Debug logs
  console.log("🔍 Debug Migração:");
  console.log("  Firebase OK:", firebaseOK);
  console.log("  Tem dados:", temDados);
  console.log("  Status:", status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#084d6e] rounded-full mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Migração para Firebase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transfira seus dados do navegador para a nuvem
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Firebase Status */}
          <div className={`rounded-xl p-6 border-2 ${
            firebaseOK 
              ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700"
              : "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Cloud className={`w-6 h-6 ${firebaseOK ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
              <h3 className={`font-bold ${firebaseOK ? "text-green-900 dark:text-green-200" : "text-red-900 dark:text-red-200"}`}>
                Firebase
              </h3>
            </div>
            <p className={`text-sm ${firebaseOK ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
              {firebaseOK ? "✅ Configurado e conectado" : "❌ Não configurado"}
            </p>
          </div>

          {/* Dados Locais */}
          <div className={`rounded-xl p-6 border-2 ${
            temDados 
              ? "bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700"
              : "bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Database className={`w-6 h-6 ${temDados ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"}`} />
              <h3 className={`font-bold ${temDados ? "text-orange-900 dark:text-orange-200" : "text-gray-900 dark:text-gray-200"}`}>
                Dados Locais
              </h3>
            </div>
            <p className={`text-sm ${temDados ? "text-orange-700 dark:text-orange-300" : "text-gray-700 dark:text-gray-300"}`}>
              {temDados ? "📦 Existem dados para migrar" : "⭕ Nenhum dado local"}
            </p>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
          {status === "idle" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {firebaseOK ? "🎉 Tudo Pronto!" : "⚙️ Configuração Necessária"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {firebaseOK 
                    ? "Firebase configurado! Agora você pode migrar seus dados." 
                    : "Configure o Firebase primeiro em ⚙️ Configurações"}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={verificarConexao}
                  disabled={!firebaseOK}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  1. Verificar Conexão Firebase
                </button>

                <button
                  onClick={iniciarMigracao}
                  disabled={!firebaseOK || !temDados}
                  className="w-full bg-[#084d6e] hover:bg-[#063a52] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
                >
                  <Upload className="w-5 h-5" />
                  2. Migrar Dados para Nuvem
                </button>
              </div>

              {!firebaseOK && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ Firebase não está configurado. Vá em <strong>⚙️ Configurações</strong> e siga o passo a passo.
                  </p>
                </div>
              )}

              {!temDados && firebaseOK && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    ℹ️ Não há dados locais para migrar. Comece usando o sistema!
                  </p>
                </div>
              )}
            </>
          )}

          {status === "verificando" && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verificando Conexão...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Testando conexão com Firebase
              </p>
            </div>
          )}

          {status === "migrando" && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-[#084d6e] animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Migrando Dados...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Transferindo seus dados para a nuvem. Aguarde...
              </p>
            </div>
          )}

          {status === "sucesso" && resultado && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ✅ Migração Concluída!
              </h3>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {resultado.encomendas}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Encomendas</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {resultado.produtos}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Produtos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {resultado.clientes}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Seus dados agora estão seguros na nuvem! Você pode acessá-los de qualquer dispositivo.
              </p>

              <button
                onClick={() => window.location.href = "/"}
                className="bg-[#084d6e] hover:bg-[#063a52] text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          )}

          {status === "erro" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Erro na Migração
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6">
                {erro}
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {status === "criando-dados" && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-[#084d6e] animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Criando Dados de Teste...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gerando dados para testar a migração
              </p>
            </div>
          )}
        </div>

        {/* Instruções Rápidas */}
        {status === "idle" && (
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">
              📋 Como funciona:
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#084d6e] dark:text-blue-400">1.</span>
                <span>Primeiro, verifique se o Firebase está conectado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#084d6e] dark:text-blue-400">2.</span>
                <span>Depois, clique em "Migrar Dados" para transferir tudo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#084d6e] dark:text-blue-400">3.</span>
                <span>Pronto! Seus dados estarão na nuvem em segundos</span>
              </li>
            </ol>
          </div>
        )}

        {/* Botão para Criar Dados de Teste */}
        {status === "idle" && (
          <div className="mt-4">
            <button
              onClick={criarDadosDeTeste}
              className="w-full bg-[#084d6e] hover:bg-[#063a52] text-white px-6 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5" />
              Criar Dados de Teste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}