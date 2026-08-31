import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Download, Database, AlertCircle, CheckCircle, Mail, Clock, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { backupAPI } from "../services/api";
import { database } from "../services/firebase";
import { ref, set, get } from "firebase/database";

interface BackupData {
  timestamp: number;
  data: string;
  encomendas: any[];
  produtos: any[];
  clientes: any[];
}

interface ConfiguracoesBackup {
  emailBackup: string;
  backupAutomatico: boolean;
  horaBackup: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [emailBackup, setEmailBackup] = useState("backup.nicolina@gmail.com");
  const [backupAutomatico, setBackupAutomatico] = useState(false);
  const [horaBackup, setHoraBackup] = useState("23:00");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [ultimoBackupEnviado, setUltimoBackupEnviado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarOrientacoes, setMostrarOrientacoes] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarConfiguracoes();
    carregarBackups();
  }, []);

  // Sistema de backup automático
  useEffect(() => {
    if (!backupAutomatico || !emailBackup || !horaBackup) return;

    const verificarHorario = () => {
      const agora = new Date();
      const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
      const hoje = agora.toISOString().split('T')[0];
      
      // Verifica se é o horário do backup e se já não foi enviado hoje
      if (horaAtual === horaBackup && ultimoBackupEnviado !== hoje) {
        console.log('⏰ Horário do backup automático! Enviando...');
        enviarBackupAutomatico();
        setUltimoBackupEnviado(hoje);
        salvarUltimoBackupEnviado(hoje);
      }
    };

    // Carrega data do último backup enviado
    carregarUltimoBackupEnviado();

    // Verifica a cada minuto
    const interval = setInterval(verificarHorario, 60000);
    
    // Verifica imediatamente ao carregar
    verificarHorario();

    return () => clearInterval(interval);
  }, [backupAutomatico, emailBackup, horaBackup, ultimoBackupEnviado]);

  const carregarConfiguracoes = async () => {
    try {
      console.log("🔄 Carregando configurações de backup do Firebase...");
      const snapshot = await get(ref(database, "nicolina/configuracoes/backup"));
      
      if (snapshot.exists()) {
        const config: ConfiguracoesBackup = snapshot.val();
        console.log("✅ Configurações carregadas:", config);
        setEmailBackup(config.emailBackup || "backup.nicolina@gmail.com");
        setBackupAutomatico(config.backupAutomatico || false);
        setHoraBackup(config.horaBackup || "23:00");
      } else {
        console.log("ℹ️ Nenhuma configuração salva, usando padrões");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    }
  };

  const carregarBackups = async () => {
    try {
      setCarregando(true);
      console.log("🔄 Carregando histórico de backups do Firebase...");
      const backupsData = await backupAPI.listar();
      console.log("✅ Backups carregados:", backupsData.length);
      setBackups(backupsData);
    } catch (error) {
      console.error("❌ Erro ao carregar backups:", error);
      toast.error("Erro ao carregar histórico de backups");
    } finally {
      setCarregando(false);
    }
  };

  const carregarUltimoBackupEnviado = async () => {
    try {
      const snapshot = await get(ref(database, "nicolina/configuracoes/backup/ultimoBackupEnviado"));
      if (snapshot.exists()) {
        setUltimoBackupEnviado(snapshot.val());
      }
    } catch (error) {
      console.error("❌ Erro ao carregar último backup enviado:", error);
    }
  };

  const salvarUltimoBackupEnviado = async (data: string) => {
    try {
      await set(ref(database, "nicolina/configuracoes/backup/ultimoBackupEnviado"), data);
    } catch (error) {
      console.error("❌ Erro ao salvar último backup enviado:", error);
    }
  };

  const criarBackup = async () => {
    try {
      console.log("🔄 Criando novo backup...");
      const novoBackup = await backupAPI.criar();
      console.log("✅ Backup criado com sucesso!");
      toast.success("Backup criado com sucesso!");
      
      // Recarregar lista de backups
      await carregarBackups();
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      toast.error("Erro ao criar backup");
    }
  };

  const baixarBackup = (backup: BackupData) => {
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `backup_nicolina_${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
    link.click();
    toast.success("Backup baixado com sucesso!");
  };

  const restaurarBackup = async (backup: BackupData) => {
    if (!confirm("Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.")) {
      return;
    }

    try {
      console.log("🔄 Restaurando backup...");
      await backupAPI.restaurar(backup.timestamp.toString());
      toast.success("Backup restaurado com sucesso! Recarregando...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("❌ Erro ao restaurar backup:", error);
      toast.error("Erro ao restaurar backup");
    }
  };

  const uploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log("📂 Lendo arquivo de backup:", file.name);
      console.log("📊 Tamanho:", (file.size / 1024).toFixed(2), "KB");
      console.log("📋 Tipo:", file.type);
      toast.loading("📂 Processando arquivo...", { id: "upload-backup" });

      let conteudo: string;

      // Verificar se é ZIP
      if (file.name.endsWith('.zip')) {
        console.log("📦 Arquivo ZIP detectado, extraindo...");
        toast.loading("📦 Extraindo arquivo ZIP...", { id: "upload-backup" });
        
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        
        console.log("📁 Arquivos no ZIP:", Object.keys(zipData.files));
        
        // Procurar arquivo .txt ou .json dentro do ZIP
        const txtFile = Object.keys(zipData.files).find(
          name => !name.startsWith('__MACOSX') && 
                  !name.startsWith('.') && 
                  (name.endsWith('.txt') || name.endsWith('.json'))
        );
        
        if (!txtFile) {
          throw new Error(
            "Nenhum arquivo .txt ou .json encontrado dentro do ZIP.\n" +
            "Arquivos encontrados: " + Object.keys(zipData.files).join(", ") + "\n\n" +
            "SOLUÇÃO: Extraia o ZIP manualmente com WinRAR/7-Zip e faça upload do arquivo .txt ou .json diretamente."
          );
        }
        
        console.log(`✅ Arquivo encontrado no ZIP: ${txtFile}`);
        toast.loading(`✅ Extraindo ${txtFile}...`, { id: "upload-backup" });
        
        // Tentar múltiplos métodos de extração para evitar problemas de encoding
        try {
          // Método 1: String UTF-8 (padrão)
          conteudo = await zipData.files[txtFile].async('string');
          console.log(`📄 Conteúdo extraído (UTF-8): ${conteudo.length} caracteres`);
        } catch (e1) {
          console.warn("⚠️ Falha ao extrair como UTF-8, tentando Uint8Array...");
          try {
            // Método 2: Uint8Array e decodificar manualmente
            const uint8Array = await zipData.files[txtFile].async('uint8array');
            const decoder = new TextDecoder('utf-8', { fatal: false });
            conteudo = decoder.decode(uint8Array);
            console.log(`📄 Conteúdo extraído (Uint8Array): ${conteudo.length} caracteres`);
          } catch (e2) {
            console.error("❌ Falha em ambos os métodos de extração");
            throw new Error(
              "Erro ao extrair arquivo do ZIP.\n\n" +
              "SOLUÇÃO ALTERNATIVA:\n" +
              "1. Extraia o ZIP manualmente com WinRAR ou 7-Zip\n" +
              "2. Encontre o arquivo .txt ou .json dentro\n" +
              "3. Faça upload direto desse arquivo (não do ZIP)"
            );
          }
        }
      } else {
        // Ler diretamente se for TXT ou JSON
        console.log("📄 Lendo arquivo de texto direto...");
        
        // Tentar múltiplos métodos de leitura
        try {
          conteudo = await file.text();
          console.log(`📄 Conteúdo lido (text()): ${conteudo.length} caracteres`);
        } catch (e1) {
          console.warn("⚠️ Falha ao ler com text(), tentando FileReader...");
          try {
            // Método alternativo com FileReader
            conteudo = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                  resolve(result);
                } else {
                  reject(new Error("Resultado não é string"));
                }
              };
              reader.onerror = reject;
              reader.readAsText(file, 'UTF-8');
            });
            console.log(`📄 Conteúdo lido (FileReader): ${conteudo.length} caracteres`);
          } catch (e2) {
            throw new Error("Erro ao ler o arquivo. Tente extrair o ZIP manualmente primeiro.");
          }
        }
      }

      // Limpar BOM (Byte Order Mark) e espaços em branco
      conteudo = conteudo.replace(/^\uFEFF/, '').trim();
      
      // Limpar caracteres de controle invisíveis
      conteudo = conteudo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      
      // Log do início do conteúdo para debug
      const preview = conteudo.substring(0, 200);
      console.log("📝 Primeiros 200 caracteres:", preview);

      // Tentar fazer parse do JSON
      toast.loading("🔍 Validando arquivo de backup...", { id: "upload-backup" });
      
      let dados: any;
      try {
        dados = JSON.parse(conteudo);
      } catch (parseError) {
        console.error("❌ Erro ao fazer parse do JSON:", parseError);
        console.log("📝 Início do conteúdo (500 chars):", conteudo.substring(0, 500));
        console.log("📝 Fim do conteúdo (500 chars):", conteudo.substring(conteudo.length - 500));
        
        throw new Error(
          "❌ Não foi possível ler o arquivo de backup!\n\n" +
          "O arquivo pode estar corrompido ou incompleto.\n\n" +
          "🔧 O QUE FAZER:\n\n" +
          "Se baixou do EMAIL:\n" +
          "• Baixe o anexo ZIP do email novamente\n" +
          "• Extraia o arquivo usando WinRAR ou 7-Zip\n" +
          "• Faça upload do arquivo .txt que está dentro do ZIP\n\n" +
          "Se baixou do FIREBASE:\n" +
          "• Exporte os dados novamente do Firebase\n" +
          "• Certifique-se que o download foi completo\n" +
          "• Não abra ou edite o arquivo antes de fazer upload"
        );
      }

      console.log("✅ JSON parseado com sucesso");
      console.log("📊 Estrutura do backup:", Object.keys(dados));
      
      // Detectar se é backup do Firebase (estrutura aninhada)
      if (dados.nicolina && typeof dados.nicolina === 'object') {
        console.log("🔍 Detectado backup do Firebase com estrutura aninhada");
        console.log("📊 Estrutura nicolina:", Object.keys(dados.nicolina));
        
        // Extrair dados da estrutura do Firebase
        const nicolinaData = dados.nicolina;
        
        // Converter objetos do Firebase para arrays
        const encomendas = nicolinaData.encomendas 
          ? Object.values(nicolinaData.encomendas) 
          : [];
        const produtos = nicolinaData.produtos 
          ? Object.values(nicolinaData.produtos) 
          : [];
        const clientes = nicolinaData.clientes 
          ? Object.values(nicolinaData.clientes) 
          : [];
        
        console.log("✅ Dados extraídos do Firebase:", {
          encomendas: encomendas.length,
          produtos: produtos.length,
          clientes: clientes.length
        });
        
        // Reconstruir no formato esperado
        dados = {
          timestamp: dados.timestamp || Date.now(),
          data: dados.data || new Date(dados.timestamp || Date.now()).toISOString(),
          encomendas: encomendas,
          produtos: produtos,
          clientes: clientes
        };
      }
      
      // Validar estrutura do backup - aceitar múltiplos formatos
      const temTimestamp = dados.timestamp !== undefined;
      const temEncomendas = Array.isArray(dados.encomendas);
      const temProdutos = Array.isArray(dados.produtos);
      const temClientes = Array.isArray(dados.clientes);

      if (!temTimestamp) {
        console.warn("⚠️ Backup sem timestamp, gerando um novo...");
        dados.timestamp = Date.now();
      }

      if (!temEncomendas || !temProdutos || !temClientes) {
        console.error("❌ Estrutura inválida:", {
          temTimestamp,
          temEncomendas,
          temProdutos,
          temClientes,
          chavesEncontradas: Object.keys(dados)
        });
        
        throw new Error(
          "❌ Arquivo de backup inválido!\n\n" +
          "Este arquivo não contém os dados esperados do Sistema Nicolina.\n\n" +
          "Certifique-se de usar um arquivo de backup gerado por este sistema.\n\n" +
          "Se você tem certeza que o arquivo está correto, entre em contato com o suporte."
        );
      }

      console.log("✅ Backup válido:", {
        timestamp: dados.timestamp,
        data: dados.data || new Date(dados.timestamp).toISOString(),
        encomendas: dados.encomendas.length,
        produtos: dados.produtos.length,
        clientes: dados.clientes.length,
      });

      // Garantir que data está presente
      if (!dados.data) {
        dados.data = new Date(dados.timestamp).toISOString();
      }

      // Confirmar restauração
      const dataBackup = new Date(dados.timestamp).toLocaleString('pt-BR');
      const confirmar = confirm(
        `📂 Restaurar este backup?\n\n` +
        `📅 Data: ${dataBackup}\n` +
        `📦 ${dados.encomendas.length} encomenda(s)\n` +
        `🍞 ${dados.produtos.length} produto(s)\n` +
        `👥 ${dados.clientes.length} cliente(s)\n\n` +
        `⚠️ ATENÇÃO: Todos os dados atuais serão SUBSTITUÍDOS!\n\n` +
        `Deseja continuar?`
      );

      if (!confirmar) {
        toast.dismiss("upload-backup");
        toast.info("❌ Restauração cancelada");
        return;
      }

      // Restaurar backup
      toast.loading("🔄 Restaurando dados...", { id: "upload-backup" });
      
      console.log("🔄 Iniciando restauração...");
      
      // Usar a API de restauração
      await backupAPI.restaurar(dados.timestamp.toString(), dados);
      
      console.log("✅ Restauração concluída!");
      
      toast.success(
        `✅ Backup restaurado com sucesso!\n\n` +
        `📦 ${dados.encomendas.length} encomendas\n` +
        `🍞 ${dados.produtos.length} produtos\n` +
        `👥 ${dados.clientes.length} clientes`,
        { 
          id: "upload-backup",
          duration: 5000
        }
      );

      // Recarregar página após 2 segundos
      setTimeout(() => {
        console.log("🔄 Recarregando página...");
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("❌ Erro ao processar backup:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      toast.error(errorMessage, {
        id: "upload-backup",
        duration: 10000
      });
    }

    // Limpar input para permitir upload do mesmo arquivo novamente
    event.target.value = '';
  };

  const salvarConfiguracoes = async () => {
    if (!emailBackup.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    try {
      console.log("🔄 Salvando configurações no Firebase...");
      const config: ConfiguracoesBackup = {
        emailBackup,
        backupAutomatico,
        horaBackup,
      };
      
      await set(ref(database, "nicolina/configuracoes/backup"), config);
      console.log("✅ Configurações salvas:", config);
      
      toast.success(`✅ Configurações salvas! Backup diário configurado para ${horaBackup}`);
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const enviarBackupPorEmail = async () => {
    if (!emailBackup.trim()) {
      toast.error("Configure o email antes de enviar");
      return;
    }

    try {
      setEnviandoEmail(true);
      
      // Criar backup e salvar no Firebase
      console.log("📦 Criando backup...");
      toast.loading("📦 Criando backup...", { id: "backup-email" });
      const backup = await backupAPI.criar();
      
      toast.loading("📧 Enviando email automaticamente...", { id: "backup-email" });
      
      // Enviar por email (totalmente automático no servidor)
      console.log("📧 Enviando para servidor:", emailBackup);
      await backupAPI.enviarPorEmail(emailBackup, backup);
      
      // Sucesso!
      toast.success(
        `✅ Backup ZIP enviado como ANEXO para ${emailBackup}! Verifique os anexos do email.`, 
        { 
          id: "backup-email",
          duration: 7000
        }
      );
      
      // Recarregar lista de backups
      await carregarBackups();
    } catch (error) {
      console.error("❌ Erro ao enviar backup:", error);
      
      // Verificar se é erro de template não configurado
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("recipients address is empty") || errorMessage.includes("422")) {
        toast.error(
          "❌ Template do EmailJS não configurado! Clique aqui para ver como configurar.",
          {
            id: "backup-email",
            duration: 10000,
            action: {
              label: "Configurar Template",
              onClick: () => navigate("/configurar-template-emailjs")
            }
          }
        );
      } else {
        toast.error(`❌ Erro: ${errorMessage}`, {
          id: "backup-email",
          duration: 5000
        });
      }
    } finally {
      setEnviandoEmail(false);
    }
  };

  const enviarBackupAutomatico = async () => {
    if (!emailBackup.trim()) {
      console.log("ℹ️ [BACKUP AUTOMÁTICO] Email não configurado, ignorando backup automático");
      return;
    }

    try {
      console.log(`📧 [BACKUP AUTOMÁTICO] Tentando enviar backup para: ${emailBackup}`);
      
      // Usar a função da API que cria e salva o backup
      await backupAPI.enviarPorEmail(emailBackup);
      
      toast.success(`✅ Backup automático enviado para ${emailBackup}!`);
      console.log(` [BACKUP AUTOMÁTICO] Backup enviado com sucesso às ${new Date().toLocaleTimeString()}`);
      
      // Recarregar lista de backups
      await carregarBackups();
    } catch (error) {
      console.error("❌ Erro ao enviar backup automático:", error);
      
      // Para backup automático, não mostrar toast de erro, apenas log
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("recipients address is empty") || errorMessage.includes("422")) {
        console.log("⚠️ [BACKUP AUTOMÁTICO] Template do EmailJS não configurado. Configure em /configurar-template-emailjs");
      } else {
        console.log(`⚠️ [BACKUP AUTOMÁTICO] Falha ao enviar: ${errorMessage}`);
      }
    }
  };

  const enviarBackupManual = async () => {
    if (!emailBackup.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    setEnviandoEmail(true);

    try {
      console.log("📦 Criando backup...");
      toast.loading("📦 Criando backup...", { id: "backup-email" });
      const backup = await backupAPI.criar();
      
      console.log("✅ [BACKUP] Backup criado:", {
        timestamp: backup.timestamp,
        encomendas: backup.encomendas.length,
        link: `${window.location.origin}/download-backup/${backup.timestamp}`
      });
      
      toast.loading(" Enviando email...", { id: "backup-email" });
      
      // Enviar por email
      console.log("📧 Enviando para servidor:", emailBackup);
      await backupAPI.enviarPorEmail(emailBackup, backup);
      
      // Sucesso!
      toast.success(
        `✅ Email enviado para ${emailBackup}! Clique no link do email para baixar o backup.`, 
        { 
          id: "backup-email",
          duration: 7000
        }
      );
      
      // Recarregar lista de backups
      await carregarBackups();
    } catch (error) {
      console.error("❌ Erro ao enviar backup:", error);
      
      // Verificar se é erro de template não configurado
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("recipients address is empty") || errorMessage.includes("422")) {
        toast.error(
          "❌ Template do EmailJS não configurado! Clique aqui para ver como configurar.",
          {
            id: "backup-email",
            duration: 10000,
            action: {
              label: "Configurar Template",
              onClick: () => navigate("/configurar-template-emailjs")
            }
          }
        );
      } else {
        toast.error(`❌ Erro: ${errorMessage}`, {
          id: "backup-email",
          duration: 5000
        });
      }
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            💾 Backup e Restauração
          </h1>
          <p className="text-muted-foreground">
            Gerencie backups e configure envio automático por email
          </p>
        </div>
        
        {/* Botão para Ocultar/Mostrar Orientações */}
        <Button
          variant={mostrarOrientacoes ? "outline" : "default"}
          size="sm"
          onClick={() => setMostrarOrientacoes(!mostrarOrientacoes)}
          className="gap-2"
        >
          {mostrarOrientacoes ? (
            <>
              <EyeOff className="w-4 h-4" />
              Ocultar Orientações
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Mostrar Orientações
            </>
          )}
        </Button>
      </div>

      {/* Aviso - Configurar EmailJS */}
      {mostrarOrientacoes && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Importante - Configure o Envio Automático
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Para o backup automático funcionar, você precisa configurar o EmailJS. 
                  É rápido, gratuito e sem necessidade de servidor!
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                    onClick={() => navigate("/configurar-emailjs")}
                  >
                    ⚡ Configurar EmailJS Agora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-amber-900/10 border-amber-900/20 hover:bg-amber-900/20"
                    onClick={() => navigate("/configurar-backup")}
                  >
                    📖 Ver Passo a Passo EmailJS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-amber-900/10 border-amber-900/20 hover:bg-amber-900/20"
                    onClick={() => navigate("/configurar-template-emailjs")}
                  >
                    🔧 Configurar Template EmailJS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Template EmailJS */}
      {mostrarOrientacoes && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  ⚠️ ATENÇÃO - Configure o Template do EmailJS
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  Depois de configurar as credenciais do EmailJS, você PRECISA configurar o template também!
                  Sem o template configurado, você receberá o erro: <code className="bg-red-900/20 px-1 rounded">"recipients address is empty"</code>
                </p>
                <div className="bg-red-900/10 border border-red-900/20 rounded p-3 mt-3 mb-3">
                  <p className="text-sm text-red-900 dark:text-red-100 font-semibold mb-1">
                    📋 O que fazer:
                  </p>
                  <ol className="text-sm text-red-800 dark:text-red-200 space-y-1 list-decimal list-inside">
                    <li>Clique em "🔧 Ver Guia do Template" abaixo</li>
                    <li>Siga o passo a passo de 7 etapas</li>
                    <li>Configure o campo "To email" com {'{{to_email}}'}</li>
                    <li>Salve o template no EmailJS</li>
                    <li>Volte aqui e teste o envio!</li>
                  </ol>
                </div>
                <Button
                  className="gap-2 bg-red-600 hover:bg-red-700"
                  onClick={() => navigate("/configurar-template-emailjs")}
                >
                  🔧 Ver Guia do Template (IMPORTANTE!)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid com duas colunas - Backup Manual e Backup Automático */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA 1: Backup Manual do Sistema */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Backup Manual
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Crie e gerencie backups do sistema manualmente
            </p>
          </div>

          {/* Criar Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Novo Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Crie um backup de todos os dados (encomendas, produtos e clientes).
              </p>
              <Button size="lg" onClick={criarBackup} className="w-full gap-2">
                <Database className="w-5 h-5" />
                Criar Backup Agora
              </Button>
            </CardContent>
          </Card>

          {/* Restaurar de Arquivo */}
          {mostrarOrientacoes && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Upload className="w-5 h-5" />
                  Restaurar de Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Faça upload de um arquivo de backup (.TXT ou .JSON).
                </p>

                <div className="bg-green-900/10 border border-green-900/20 rounded p-3 text-xs text-green-800 dark:text-green-200 space-y-2">
                  <div>
                    <strong>📧 Backup do Email:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1">
                      <li>Baixe o ZIP anexado</li>
                      <li>Extraia com WinRAR/7-Zip</li>
                      <li>Envie o arquivo .txt</li>
                    </ol>
                  </div>
                  <div>
                    <strong>🔥 Backup do Firebase:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1">
                      <li>Exporte do Console</li>
                      <li>Envie o arquivo .json</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-amber-900/10 border border-amber-900/20 rounded p-2 text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚠️ ATENÇÃO:</strong> Todos os dados atuais serão substituídos!
                </div>

                <label htmlFor="upload-backup-input" className="cursor-pointer block">
                  <input
                    id="upload-backup-input"
                    type="file"
                    accept=".json,.txt"
                    onChange={uploadBackup}
                    className="hidden"
                  />
                  <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700" asChild>
                    <span>
                      <Upload className="w-5 h-5" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}

          {!mostrarOrientacoes && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Upload className="w-5 h-5" />
                  Restaurar de Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Restaure um backup do email ou Firebase (.TXT ou .JSON).
                </p>
                <label htmlFor="upload-backup-input-simple" className="cursor-pointer block">
                  <input
                    id="upload-backup-input-simple"
                    type="file"
                    accept=".json,.txt"
                    onChange={uploadBackup}
                    className="hidden"
                  />
                  <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700" asChild>
                    <span>
                      <Upload className="w-5 h-5" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUNA 2: Backup Automático */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Backup Automático
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configure envio automático diário por email
            </p>
          </div>

          {/* Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email para Backup</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailBackup}
                  onChange={(e) => setEmailBackup(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="hora">Horário do Backup Diário</Label>
                <Input
                  id="hora"
                  type="time"
                  value={horaBackup}
                  onChange={(e) => setHoraBackup(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={backupAutomatico}
                  onChange={(e) => setBackupAutomatico(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">
                  Ativar backup automático diário
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <Button onClick={salvarConfiguracoes} className="flex-1 gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={enviarBackupPorEmail}
                  disabled={!emailBackup.trim()}
                  className="flex-1 gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Enviar Agora
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Backup Automático Ativado */}
          {backupAutomatico && emailBackup && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      ✅ Backup Automático Ativado
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Backup diário será enviado para <strong>{emailBackup}</strong> às{" "}
                      <strong>{horaBackup}</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Histórico de Backups - Full Width */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Histórico de Backups
          </h2>
          <p className="text-sm text-muted-foreground">
            Veja, baixe ou restaure backups anteriores
          </p>
        </div>

        <div className="space-y-3">
          {carregando ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : backups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum backup encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crie seu primeiro backup para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            backups.map((backup, index) => (
              <Card key={backup.timestamp}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <h3 className="font-semibold">
                            Backup de{" "}
                            {new Date(backup.timestamp).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </h3>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>📦 {backup.encomendas?.length || 0} encomendas</span>
                            <span>🍞 {backup.produtos?.length || 0} produtos</span>
                            <span>👥 {backup.clientes?.length || 0} clientes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => baixarBackup(backup)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => restaurarBackup(backup)}
                        className="gap-2"
                      >
                        <Database className="w-4 h-4" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}