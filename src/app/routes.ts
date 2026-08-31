import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EncomendasMelhorado from "./pages/EncomendasMelhorado";
import EncomendasTabela from "./pages/EncomendasTabela";
import ListaEncomendas from "./pages/ListaEncomendas";
import Producao from "./pages/Producao";
import Separacao from "./pages/Separacao";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Administracao from "./pages/Administracao";
import GerenciarProdutosOrcamento from "./pages/GerenciarProdutosOrcamento";
import ResumoOrcamentos from "./pages/ResumoOrcamentos";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";
import RelatoriosCliente from "./pages/RelatoriosCliente";
import BackupPage from "./pages/Backup";
import ConfigurarBackupPage from "./pages/ConfigurarBackup";
import ConfigurarEmailJSPage from "./pages/ConfigurarEmailJS";
import ConfigurarTemplateEmailJSPage from "./pages/ConfigurarTemplateEmailJS";
import ConfigurarFirebasePage from "./pages/ConfigurarFirebase";
import CriarFirebasePage from "./pages/CriarFirebase";
import Configuracoes from "./pages/Configuracoes";
import InicializarDados from "./pages/InicializarDados";
import MigracaoRapida from "./pages/MigracaoRapida";
import DownloadBackup from "./pages/DownloadBackup";
import DownloadBackupTest from "./pages/DownloadBackupTest";
import DadosExemplo from "./pages/DadosExemplo";
import RestaurarClientes from "./pages/RestaurarClientes";
import RestaurarClientesCompleto from "./pages/RestaurarClientesCompleto";
import DiagnosticoClientes from "./pages/DiagnosticoClientes";
import TesteSincronizacao from "./pages/TesteSincronizacao";
import Delivery from "./pages/Delivery";
import FechamentoCaixa from "./pages/FechamentoCaixa";
import FluxoCaixa from "./pages/FluxoCaixa";
import IntegracaoWhatsApp from "./pages/IntegracaoWhatsApp";

console.log("🔧 [ROUTES] Carregando rotas...");
console.log("🔧 [ROUTES] DownloadBackup component:", DownloadBackup);
console.log("🔧 [ROUTES] DownloadBackupTest component:", DownloadBackupTest);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "encomendas", Component: EncomendasTabela },
      { path: "encomendas-melhorado", Component: EncomendasMelhorado },
      { path: "lista-encomendas", Component: ListaEncomendas },
      { path: "producao", Component: Producao },
      { path: "separacao", Component: Separacao },
      { path: "produtos", Component: Produtos },
      { path: "clientes", Component: Clientes },
      { path: "administracao", Component: Administracao },
      { path: "gerenciar-produtos-orcamento", Component: GerenciarProdutosOrcamento },
      { path: "resumo-orcamentos", Component: ResumoOrcamentos },
      { path: "usuarios", Component: Usuarios },
      { path: "relatorios", Component: Relatorios },
      { path: "relatorios-cliente", Component: RelatoriosCliente },
      { path: "backup", Component: BackupPage },
      { path: "configurar-backup", Component: ConfigurarBackupPage },
      { path: "configurar-emailjs", Component: ConfigurarEmailJSPage },
      { path: "configurar-template-emailjs", Component: ConfigurarTemplateEmailJSPage },
      { path: "configurar-firebase", Component: ConfigurarFirebasePage },
      { path: "criar-firebase", Component: CriarFirebasePage },
      { path: "configuracoes", Component: Configuracoes },
      { path: "inicializar", Component: InicializarDados },
      { path: "migracao", Component: MigracaoRapida },
      { path: "dados-exemplo", Component: DadosExemplo },
      { path: "restaurar-clientes", Component: RestaurarClientes },
      { path: "restaurar-clientes-completo", Component: RestaurarClientesCompleto },
      { path: "diagnostico-clientes", Component: DiagnosticoClientes },
      { path: "teste-sincronizacao", Component: TesteSincronizacao },
      { path: "delivery", Component: Delivery },
      { path: "fechamento-caixa", Component: FechamentoCaixa },
      { path: "fluxo-caixa", Component: FluxoCaixa },
      { path: "integracao-whatsapp", Component: IntegracaoWhatsApp },
      { path: "download-backup/:timestamp", Component: DownloadBackup },
      { path: "teste", Component: DownloadBackupTest },
    ],
  },
]);

console.log("🔧 [ROUTES] Rotas carregadas:", router.routes);