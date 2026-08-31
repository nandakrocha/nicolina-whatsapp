import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Bell, BellOff, Volume2, VolumeX, TestTube2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { solicitarPermissaoNotificacoes } from "../services/notificacoes";

interface ConfigNotificacoes {
  habilitado: boolean;
  tempoAntecedencia: number; // em minutos
  somHabilitado: boolean;
  pushHabilitado: boolean;
}

export function ConfiguracoesNotificacoes() {
  const [config, setConfig] = useState<ConfigNotificacoes>(() => {
    const salvo = localStorage.getItem('nicolina_config_notificacoes');
    if (salvo) {
      return JSON.parse(salvo);
    }
    return {
      habilitado: true,
      tempoAntecedencia: 30,
      somHabilitado: true,
      pushHabilitado: false,
    };
  });

  const [permissaoPush, setPermissaoPush] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ("Notification" in window) {
      setPermissaoPush(Notification.permission);
    }
  }, []);

  const salvarConfig = () => {
    localStorage.setItem('nicolina_config_notificacoes', JSON.stringify(config));
    
    // Salvar também flag de habilitado separadamente para o App.tsx
    localStorage.setItem('nicolina_notificacoes_habilitadas', config.habilitado.toString());
    
    toast.success("Configurações de notificações salvas!");
    
    // Recarregar página para aplicar mudanças
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const testarNotificacao = () => {
    const mensagem = "João Silva - 06:00\n10x Pão Francês, 5x Café";
    
    // Som - Bipe longo com múltiplas tentativas
    if (config.somHabilitado) {
      try {
        const audio = new Audio();
        audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
        audio.volume = 0.8;
        
        // Tocar múltiplas vezes para simular bipe longo
        audio.play().then(() => {
          console.log("✅ Som tocado via Audio()");
          setTimeout(() => audio.play(), 200);
          setTimeout(() => audio.play(), 400);
        }).catch(err => {
          console.error("❌ Erro ao tocar som:", err);
          toast.error("Som bloqueado pelo navegador. Configure o volume!", {
            duration: 3000,
          });
        });
      } catch (error) {
        console.error("❌ Erro geral ao tocar som:", error);
        toast.error("Não foi possível tocar o som. Verifique as permissões!", {
          duration: 3000,
        });
      }
    }
    
    // Toast
    toast.warning(mensagem, {
      duration: 5000,
      position: "top-center",
      description: "⏰ Pedido próximo do horário! (TESTE)",
    });
    
    // Push
    if (config.pushHabilitado && Notification.permission === "granted") {
      new Notification("🔔 Nicolina - Teste de Notificação", {
        body: mensagem,
        icon: "/favicon.ico",
        tag: "teste",
      });
    }
    
    toast.info("Notificação de teste enviada!");
  };

  const solicitarPermissao = async () => {
    await solicitarPermissaoNotificacoes();
    setPermissaoPush(Notification.permission);
    
    if (Notification.permission === "granted") {
      setConfig({ ...config, pushHabilitado: true });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações de Pedidos
        </CardTitle>
        <CardDescription>
          Configure lembretes automáticos para pedidos próximos do horário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Habilitar/Desabilitar */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ativar Notificações</Label>
            <p className="text-sm text-muted-foreground">
              Receba lembretes automáticos antes do horário dos pedidos
            </p>
          </div>
          <Switch
            checked={config.habilitado}
            onCheckedChange={(checked) => setConfig({ ...config, habilitado: checked })}
          />
        </div>

        {config.habilitado && (
          <>
            {/* Tempo de Antecedência */}
            <div className="space-y-2">
              <Label htmlFor="tempo">
                Avisar com antecedência de (minutos)
              </Label>
              <Input
                id="tempo"
                type="number"
                min="5"
                max="120"
                value={config.tempoAntecedencia}
                onChange={(e) => setConfig({ ...config, tempoAntecedencia: parseInt(e.target.value) || 30 })}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Padrão: 30 minutos antes do horário do pedido
              </p>
            </div>

            {/* Som */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Som de Alerta</Label>
                <p className="text-sm text-muted-foreground">
                  Tocar um bipe ao exibir a notificação
                </p>
              </div>
              <Switch
                checked={config.somHabilitado}
                onCheckedChange={(checked) => setConfig({ ...config, somHabilitado: checked })}
              />
            </div>

            {/* Push Notifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push do Navegador</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações mesmo com a aba minimizada
                  </p>
                </div>
                <Switch
                  checked={config.pushHabilitado}
                  onCheckedChange={(checked) => setConfig({ ...config, pushHabilitado: checked })}
                  disabled={permissaoPush !== "granted"}
                />
              </div>
              
              {permissaoPush === "default" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={solicitarPermissao}
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Solicitar Permissão para Notificações Push
                </Button>
              )}
              
              {permissaoPush === "denied" && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <Info className="h-4 w-4" />
                  <span>Permissão negada. Habilite nas configurações do navegador.</span>
                </div>
              )}
              
              {permissaoPush === "granted" && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-sm">
                  <Info className="h-4 w-4" />
                  <span>Permissão concedida! Notificações push ativas.</span>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button onClick={salvarConfig} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
              <Button onClick={testarNotificacao} variant="outline">
                <TestTube2 className="h-4 w-4 mr-2" />
                Testar
              </Button>
            </div>
          </>
        )}

        {!config.habilitado && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              As notificações estão desativadas. Ative-as para receber lembretes automáticos.
            </p>
          </div>
        )}

        {/* Informação */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Como funciona?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Sistema monitora automaticamente todos os pedidos</li>
            <li>Notificação é enviada no tempo configurado antes do horário</li>
            <li>Cada notificação é enviada apenas uma vez</li>
            <li>Ao editar um horário, a notificação é recalculada automaticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
