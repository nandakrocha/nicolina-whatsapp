import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle2, Database, Users, RefreshCw, Download } from "lucide-react";
import { clientesAPI } from "../services/api";
import { toast } from "sonner";

export default function RestaurarClientesCompleto() {
  const [verificando, setVerificando] = useState(false);
  const [criando, setCriando] = useState(false);
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

  const restaurarClientesCompleto = async () => {
    setCriando(true);
    
    const clientesPadaria = [
      // PADARIAS E CONFEITARIAS
      {
        nome: "Padaria São João",
        nomeContato: "João Silva",
        telefone: "(11) 98765-4321",
        endereco: "Rua das Flores, 123 - Centro",
        cnpj: "12.345.678/0001-90",
        email: "contato@padariasaojoao.com.br",
      },
      {
        nome: "Confeitaria Doce Sabor",
        nomeContato: "Ana Paula",
        telefone: "(11) 97654-3210",
        endereco: "Av. Principal, 456 - Vila Nova",
        cnpj: "23.456.789/0001-12",
        email: "ana@docesabor.com.br",
      },
      {
        nome: "Padaria e Café da Praça",
        nomeContato: "Pedro Costa",
        telefone: "(11) 96543-2109",
        endereco: "Praça Central, 789 - Centro",
        email: "pedidos@cafedapraca.com.br",
      },
      
      // SUPERMERCADOS
      {
        nome: "Supermercado Bom Preço",
        nomeContato: "Maria Santos",
        telefone: "(11) 95432-1098",
        endereco: "Av. Comercial, 321 - Jardim",
        cnpj: "34.567.890/0001-34",
        email: "compras@bompreco.com.br",
      },
      {
        nome: "Mercado Central",
        nomeContato: "Roberto Lima",
        telefone: "(11) 94321-0987",
        endereco: "Rua do Comércio, 654 - Centro",
        cnpj: "45.678.901/0001-56",
        email: "suprimentos@mercadocentral.com.br",
      },
      
      // RESTAURANTES
      {
        nome: "Restaurante Sabor Caseiro",
        nomeContato: "Juliana Alves",
        telefone: "(11) 93210-9876",
        endereco: "Rua da Comida, 147 - Jardim América",
        email: "juliana@saborcaseiro.com.br",
      },
      {
        nome: "Restaurante Bom Gosto",
        nomeContato: "Carlos Mendes",
        telefone: "(11) 92109-8765",
        endereco: "Av. dos Restaurantes, 258 - Centro",
        cnpj: "56.789.012/0001-78",
        email: "carlos@bomgosto.com.br",
      },
      {
        nome: "Churrascaria Gaúcha",
        nomeContato: "Fernando Souza",
        telefone: "(11) 91098-7654",
        endereco: "Rua do Churrasco, 369 - Vila Gaúcha",
        cnpj: "67.890.123/0001-90",
        email: "fernando@gaucha.com.br",
      },
      
      // HOTÉIS E POUSADAS
      {
        nome: "Hotel Bela Vista",
        nomeContato: "Mariana Costa",
        telefone: "(11) 90987-6543",
        endereco: "Rua da Vista, 741 - Centro",
        cnpj: "78.901.234/0001-01",
        email: "suprimentos@hotelbelavista.com.br",
      },
      {
        nome: "Pousada Recanto",
        nomeContato: "Paulo Santos",
        telefone: "(11) 89876-5432",
        endereco: "Estrada do Recanto, 852 - Rural",
        email: "paulo@pousadarecanto.com.br",
      },
      
      // ESCOLAS E INSTITUIÇÕES
      {
        nome: "Escola Municipal Centro",
        nomeContato: "Diretor Roberto",
        telefone: "(11) 88765-4321",
        endereco: "Av. Educação, 963 - Vila Escola",
        email: "merenda@escolacentro.edu.br",
      },
      {
        nome: "Colégio São Paulo",
        nomeContato: "Coordenadora Sandra",
        telefone: "(11) 87654-3210",
        endereco: "Rua da Escola, 159 - Jardim",
        cnpj: "89.012.345/0001-23",
        email: "cantina@colegiosaopaulo.edu.br",
      },
      
      // BUFFETS E EVENTOS
      {
        nome: "Buffet Festas & Cia",
        nomeContato: "Juliana Eventos",
        telefone: "(11) 86543-2109",
        endereco: "Rua das Festas, 753 - Centro",
        cnpj: "90.123.456/0001-45",
        email: "juliana@festasecia.com.br",
      },
      {
        nome: "Buffet Elite",
        nomeContato: "Ricardo Oliveira",
        telefone: "(11) 85432-1098",
        endereco: "Av. dos Eventos, 357 - Vila Elite",
        email: "ricardo@buffetelite.com.br",
      },
      
      // CLÍNICAS E CONSULTÓRIOS
      {
        nome: "Clínica Saúde Total",
        nomeContato: "Dr. Fernando",
        telefone: "(11) 84321-0987",
        endereco: "Av. Saúde, 951 - Centro Médico",
        cnpj: "01.234.567/0001-67",
        email: "admin@saudetotal.med.br",
      },
      
      // ESCRITÓRIOS E EMPRESAS
      {
        nome: "Escritório de Advocacia Silva & Costa",
        nomeContato: "Dra. Patricia Silva",
        telefone: "(11) 83210-9876",
        endereco: "Rua dos Advogados, 159 - Centro",
        cnpj: "12.345.098/0001-89",
        email: "patricia@silvaecosta.adv.br",
      },
      {
        nome: "Empresa Tech Solutions",
        nomeContato: "Gerente Marcos",
        telefone: "(11) 82109-8765",
        endereco: "Av. Tecnologia, 753 - Empresarial",
        cnpj: "23.456.109/0001-01",
        email: "marcos@techsolutions.com.br",
      },
      
      // CAFETERIAS
      {
        nome: "Café Gourmet",
        nomeContato: "Camila Rocha",
        telefone: "(11) 81098-7654",
        endereco: "Rua do Café, 357 - Centro",
        email: "camila@cafegourmet.com.br",
      },
      
      // LANCHONETES
      {
        nome: "Lanchonete Avenida",
        nomeContato: "José Carlos",
        telefone: "(11) 80987-6543",
        endereco: "Av. Central, 951 - Centro",
        email: "jose@lanchoneteavenida.com.br",
      },
      
      // CLIENTES PARTICULARES/RESIDENCIAIS
      {
        nome: "Sra. Maria das Graças",
        nomeContato: "Maria das Graças",
        telefone: "(11) 79876-5432",
        endereco: "Rua das Rosas, 258 - Jardim Bela Vista",
        email: "maria.gracas@email.com",
      },
    ];

    try {
      let criados = 0;
      for (const cliente of clientesPadaria) {
        await clientesAPI.criar(cliente);
        criados++;
        toast.info(`Criando clientes... ${criados}/${clientesPadaria.length}`, {
          duration: 1000,
        });
      }
      
      toast.success(`✅ ${clientesPadaria.length} clientes criados com sucesso!`, {
        duration: 3000,
      });
      
      setTimeout(() => {
        window.location.href = "/clientes";
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao criar clientes:", error);
      toast.error("Erro ao criar clientes. Tente novamente.");
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔧 Restaurar Clientes - Completo</h1>
        <p className="text-muted-foreground">
          Restauração completa com 20 clientes típicos de padaria
        </p>
      </div>

      {/* Card Principal */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="h-6 w-6" />
            Restaurar 20 Clientes de Padaria
          </CardTitle>
          <CardDescription>
            Lista completa de clientes típicos: Padarias, Supermercados, Restaurantes, Hotéis, Escolas, Buffets, Clínicas, Empresas, Cafeterias e Clientes Particulares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-900 dark:text-blue-100 mb-3 font-medium">
              📋 Os seguintes clientes serão criados:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <p className="font-semibold mb-1">🥖 Padarias & Confeitarias:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Padaria São João</li>
                  <li>• Confeitaria Doce Sabor</li>
                  <li>• Padaria e Café da Praça</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🛒 Supermercados:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Supermercado Bom Preço</li>
                  <li>• Mercado Central</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🍽️ Restaurantes:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Restaurante Sabor Caseiro</li>
                  <li>• Restaurante Bom Gosto</li>
                  <li>• Churrascaria Gaúcha</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🏨 Hotéis & Pousadas:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Hotel Bela Vista</li>
                  <li>• Pousada Recanto</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🎓 Escolas:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Escola Municipal Centro</li>
                  <li>• Colégio São Paulo</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🎉 Buffets:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Buffet Festas & Cia</li>
                  <li>• Buffet Elite</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🏥 Clínicas:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Clínica Saúde Total</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">🏢 Empresas:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Escritório Silva & Costa</li>
                  <li>• Empresa Tech Solutions</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">☕ Cafeterias & Lanchonetes:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Café Gourmet</li>
                  <li>• Lanchonete Avenida</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold mb-1">👤 Clientes Particulares:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Sra. Maria das Graças</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">✅ Todos os clientes incluem:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Nome completo do estabelecimento</li>
                  <li>• Nome do contato/responsável</li>
                  <li>• Telefone no formato (11) 9XXXX-XXXX</li>
                  <li>• Endereço completo com bairro</li>
                  <li>• E-mail (quando aplicável)</li>
                  <li>• CNPJ (para empresas)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Importante:</strong> Os clientes criados serão ADICIONADOS à sua lista atual. 
                Não há risco de perder dados existentes.
              </p>
            </div>
          </div>

          <Button
            onClick={restaurarClientesCompleto}
            disabled={criando}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {criando ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Criando clientes...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Restaurar 20 Clientes Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Verificar Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Verificar Dados Existentes
          </CardTitle>
          <CardDescription>
            Verifique quantos clientes você já tem cadastrados
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
                      Você já tem clientes cadastrados. Pode adicionar mais usando o botão acima.
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
                      Use o botão "Restaurar 20 Clientes Agora" para criar a base completa.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>✅ Seguro:</strong> Clientes serão adicionados, nunca substituídos
          </p>
          <p>
            <strong>📱 Sincronização:</strong> Configure Firebase para não perder dados
          </p>
          <p>
            <strong>✏️ Edição:</strong> Todos os dados podem ser editados depois
          </p>
          <p>
            <strong>🗑️ Exclusão:</strong> Você pode excluir clientes individualmente
          </p>
          <p className="pt-2 text-xs border-t">
            💡 Dica: Vá em Configurações → Configure Firebase para backup automático na nuvem!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
