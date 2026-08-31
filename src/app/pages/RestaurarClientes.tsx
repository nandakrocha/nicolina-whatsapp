import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle2, Database, Users, RefreshCw } from "lucide-react";
import { clientesAPI } from "../services/api";
import { toast } from "sonner";

export default function RestaurarClientes() {
  const [verificando, setVerificando] = useState(false);
  const [dadosLocais, setDadosLocais] = useState<any>(null);

  const verificarDados = () => {
    setVerificando(true);
    
    // Verificar localStorage
    const clientesLocal = localStorage.getItem("nicolina_clientes");
    
    if (clientesLocal) {
      const dados = JSON.parse(clientesLocal);
      setDadosLocais({
        encontrado: true,
        quantidade: dados.length,
        dados: dados,
      });
      toast.success(`Encontrados ${dados.length} cliente(s) no localStorage!`);
    } else {
      setDadosLocais({
        encontrado: false,
        quantidade: 0,
        dados: [],
      });
      toast.warning("Nenhum cliente encontrado no localStorage");
    }
    
    setVerificando(false);
  };

  const restaurarDadosExemplo = async () => {
    const clientesExemplo = [
      {
        nome: "Padaria São João",
        nomeContato: "João Silva",
        telefone: "(11) 98765-4321",
        endereco: "Rua das Flores, 123 - Centro",
        cnpj: "12.345.678/0001-90",
        email: "contato@padariasaojoao.com.br",
      },
      {
        nome: "Supermercado Bom Preço",
        nomeContato: "Maria Santos",
        telefone: "(11) 97654-3210",
        endereco: "Av. Principal, 456 - Vila Nova",
        cnpj: "98.765.432/0001-10",
        email: "compras@bompreco.com.br",
      },
      {
        nome: "Café da Praça",
        nomeContato: "Pedro Costa",
        telefone: "(11) 96543-2109",
        endereco: "Praça Central, 789 - Centro",
        email: "pedidos@cafedapraca.com.br",
      },
      {
        nome: "Restaurante Sabor Caseiro",
        nomeContato: "Ana Paula",
        telefone: "(11) 95432-1098",
        endereco: "Rua do Comércio, 321 - Jardim",
        email: "ana@saborcaseiro.com.br",
      },
      {
        nome: "Hotel Bela Vista",
        nomeContato: "Carlos Mendes",
        telefone: "(11) 94321-0987",
        endereco: "Rua da Vista, 654 - Centro",
        cnpj: "45.678.901/0001-23",
        email: "suprimentos@hotelbelavista.com.br",
      },
      {
        nome: "Escola Municipal Centro",
        nomeContato: "Diretor Roberto",
        telefone: "(11) 93210-9876",
        endereco: "Av. Educação, 987 - Vila Escola",
        email: "merenda@escolacentro.edu.br",
      },
      {
        nome: "Buffet Festas & Cia",
        nomeContato: "Juliana Alves",
        telefone: "(11) 92109-8765",
        endereco: "Rua das Festas, 147 - Jardim América",
        email: "juliana@festasecia.com.br",
      },
      {
        nome: "Clínica Saúde Total",
        nomeContato: "Dr. Fernando",
        telefone: "(11) 91098-7654",
        endereco: "Av. Saúde, 258 - Centro Médico",
        cnpj: "78.901.234/0001-45",
        email: "admin@saudetotal.med.br",
      },
    ];

    try {
      for (const cliente of clientesExemplo) {
        await clientesAPI.criar(cliente);
      }
      
      toast.success(`${clientesExemplo.length} clientes de exemplo criados com sucesso!`);
      
      setTimeout(() => {
        window.location.href = "/clientes";
      }, 1500);
      
    } catch (error) {
      console.error("Erro ao criar clientes:", error);
      toast.error("Erro ao criar clientes de exemplo");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔧 Restaurar Clientes</h1>
        <p className="text-muted-foreground">
          Ferramenta para verificar e restaurar dados de clientes
        </p>
      </div>

      {/* Verificar Dados Existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Verificar Dados Existentes
          </CardTitle>
          <CardDescription>
            Verifique se há clientes salvos no navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={verificarDados}
            disabled={verificando}
            variant="outline"
            className="w-full"
          >
            {verificando ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Verificar LocalStorage
          </Button>

          {dadosLocais && (
            <div className={`p-4 rounded-lg ${dadosLocais.encontrado ? 'bg-green-50 dark:bg-green-950/20' : 'bg-orange-50 dark:bg-orange-950/20'}`}>
              {dadosLocais.encontrado ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      ✅ {dadosLocais.quantidade} cliente(s) encontrado(s)!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Os dados estão salvos e devem aparecer na página de Clientes.
                    </p>
                    <div className="mt-3">
                      <Button
                        onClick={() => window.location.href = "/clientes"}
                        size="sm"
                      >
                        Ir para Clientes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      ⚠️ Nenhum cliente encontrado
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Você pode criar clientes de exemplo usando o botão abaixo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Criar Dados de Exemplo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Clientes de Exemplo
          </CardTitle>
          <CardDescription>
            Crie 8 clientes de exemplo típicos de uma padaria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2 font-medium">
              📋 Clientes que serão criados:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Padaria São João</li>
              <li>• Supermercado Bom Preço</li>
              <li>• Café da Praça</li>
              <li>• Restaurante Sabor Caseiro</li>
              <li>• Hotel Bela Vista</li>
              <li>• Escola Municipal Centro</li>
              <li>• Buffet Festas & Cia</li>
              <li>• Clínica Saúde Total</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Atenção:</strong> Os clientes de exemplo NÃO vão apagar seus dados existentes. 
                Eles serão adicionados à lista atual.
              </p>
            </div>
          </div>

          <Button
            onClick={restaurarDadosExemplo}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Criar Clientes de Exemplo
          </Button>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>LocalStorage:</strong> Dados salvos apenas no seu navegador (apagam se limpar cache)
          </p>
          <p>
            <strong>Firebase:</strong> Dados salvos na nuvem (sincronizam entre dispositivos)
          </p>
          <p className="pt-2 text-xs border-t">
            💡 Dica: Configure o Firebase em Configurações para não perder seus dados!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
