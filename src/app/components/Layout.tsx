import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router";
import { Package, ShoppingCart, Users, FileText, Database, Moon, Sun, Menu, X, Settings, Factory, PackageCheck, Sparkles, Shield, List, Lock, Bike, ClipboardList, TrendingUp, MessageCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { ModoConexaoIndicador } from "./ModoConexaoIndicador";
import { FirebaseAlert } from "./FirebaseAlert";
import logoNicolina from "../../imports/Logo_mais_ni_tida_e_com_melhor_qualidade-7.png";

export function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  // Páginas que fazem parte do fluxo de Administração — sessão admin permanece ativa
  const ADMIN_PATHS = ["/administracao", "/resumo-orcamentos", "/gerenciar-produtos-orcamento"];

  // Encerra a sessão administrativa ao navegar para fora do contexto admin
  useEffect(() => {
    const emContextoAdmin = ADMIN_PATHS.some((p) => location.pathname.startsWith(p));
    if (!emContextoAdmin) {
      sessionStorage.removeItem("nicolina_admin_sessao_ativa");
      localStorage.removeItem("nicolina_admin_autenticado");
    }
  }, [location.pathname]);

  const menuItemsBase = [
    { path: "/", label: "Dashboard", icon: Package, emoji: "📊", requerProprietario: false },
    { path: "/lista-encomendas", label: "Lista de Encomendas", icon: List, emoji: "📋", requerProprietario: false },
    { path: "/encomendas", label: "Encomendas", icon: ShoppingCart, emoji: "📦", requerProprietario: false },
    // { path: "/delivery", label: "Delivery", icon: Bike, emoji: "🏍️", requerProprietario: false },
    { path: "/fechamento-caixa", label: "Fechamento Caixa", icon: ClipboardList, emoji: "📋", requerProprietario: false },
    // { path: "/producao", label: "Produção", icon: Factory, emoji: "🏭", requerProprietario: false },
    // { path: "/separacao", label: "Separação", icon: PackageCheck, emoji: "📦", requerProprietario: false },
    { path: "/produtos", label: "Produtos", icon: Package, emoji: "🍞", requerProprietario: false },
    { path: "/clientes", label: "Clientes", icon: Users, emoji: "👨‍💼", requerProprietario: false },
    { path: "/relatorios", label: "Relatórios", icon: FileText, emoji: "📋", requerProprietario: false },
    // { path: "/relatorios-cliente", label: "Relatórios por Cliente", icon: FileText, emoji: "📊", requerProprietario: false },
    { path: "/usuarios", label: "Usuários", icon: Shield, emoji: "👥", requerProprietario: false },
    { path: "/backup", label: "Backup", icon: Database, emoji: "💾", requerProprietario: false },
    { path: "/configuracoes", label: "Configurações", icon: Settings, emoji: "⚙️", requerProprietario: false },
    { path: "/administracao", label: "Administração", icon: Lock, emoji: "🔐", requerProprietario: false },
    { path: "/fluxo-caixa", label: "Fluxo de Caixa", icon: TrendingUp, emoji: "💰", requerProprietario: true },
    { path: "/integracao-whatsapp", label: "Integração WhatsApp", icon: MessageCircle, emoji: "💬", requerProprietario: false },
  ];

  const menuItems = menuItemsBase;

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:block">
      {/* Menu Lateral Desktop - Sempre Visível */}
      <aside className="no-print hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col fixed h-full left-0 top-0 z-40">
        {/* Logo Centralizada */}
        <div className="px-4 py-3 flex items-center justify-center border-b border-sidebar-border flex-shrink-0">
          <img
            src={logoNicolina}
            alt="Logo Nicolina"
            className="w-full max-w-[210px] h-auto object-contain rounded-lg"
          />
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer com alternador de tema */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start gap-3 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4" />
                <span className="text-sm">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span className="text-sm">Modo Escuro</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <div className="no-print md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-50">
        {/* Espaçador esquerdo para centralizar a logo */}
        <div className="w-9 flex-shrink-0" />
        <div className="flex items-center justify-center flex-1">
          <img
            src={logoNicolina}
            alt="Logo Nicolina"
            className="h-10 w-auto max-w-[160px] object-contain rounded-md"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          className="text-sidebar-foreground flex-shrink-0"
        >
          {menuMobileAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Menu Mobile Overlay */}
      {menuMobileAberto && (
        <div
          className="no-print md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuMobileAberto(false)}
        />
      )}

      {/* Menu Mobile Drawer */}
      <aside
        className={`
          no-print md:hidden fixed top-16 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-300 z-40
          ${menuMobileAberto ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuMobileAberto(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start gap-3 bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Modo Escuro</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main
        className="flex-1 md:ml-64 pt-16 md:pt-0 overflow-auto print:m-0 print:pt-0 print:overflow-visible print:h-auto"
        style={{
          // iOS momentum scrolling — without this, scroll inside overflow:auto is sticky/laggy on Safari
          WebkitOverflowScrolling: "touch",
          // Allow vertical scroll gestures to pass through; no horizontal scroll capture
          touchAction: "pan-y",
          // Contain overscroll to this element — prevents pull-to-refresh interfering with form scroll
          overscrollBehaviorY: "contain",
        } as React.CSSProperties}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 print:p-4 max-w-full overflow-x-hidden print:overflow-visible">
          <ModoConexaoIndicador />
          <FirebaseAlert />
          <Outlet />
        </div>
      </main>
    </div>
  );
}