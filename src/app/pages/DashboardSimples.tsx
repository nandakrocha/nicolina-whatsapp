import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Package, Users, ShoppingCart } from "lucide-react";

export default function DashboardSimples() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema Nicolina - Gestão de Encomendas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Encomendas</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Todas as encomendas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem de Boas-Vindas */}
      <Card>
        <CardHeader>
          <CardTitle>🍞 Bem-vindo ao Sistema Nicolina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Sistema completo de gestão de encomendas para padaria. Use o menu lateral para navegar entre as páginas:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span><strong>Encomendas:</strong> Registre e acompanhe todas as encomendas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🍞</span>
                <span><strong>Produtos:</strong> Gerencie o catálogo de produtos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span><strong>Clientes:</strong> Cadastre e organize seus clientes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span><strong>Relatórios:</strong> Visualize análises e estatísticas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">💾</span>
                <span><strong>Backup:</strong> Faça backup e restaure seus dados</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <span><strong>Configurações:</strong> Personalize o sistema</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recursos */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>✨ Recursos Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h4 className="font-semibold">Sincronização em Tempo Real</h4>
                <p className="text-sm text-muted-foreground">Dados atualizados automaticamente a cada 3 segundos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌓</span>
              <div>
                <h4 className="font-semibold">Modo Claro/Escuro</h4>
                <p className="text-sm text-muted-foreground">Alterne entre temas no rodapé do menu</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="font-semibold">100% Responsivo</h4>
                <p className="text-sm text-muted-foreground">Funciona perfeitamente em qualquer dispositivo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold">Central de Ajuda</h4>
                <p className="text-sm text-muted-foreground">Pressione Ctrl+H para acessar a ajuda</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
