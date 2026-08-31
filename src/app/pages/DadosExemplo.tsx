import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  Copy,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import {
  clientesExemplo,
  produtosExemplo,
  encomendaExemplo,
  INSTRUCOES_EXEMPLO,
} from "../dados-exemplo";

export default function DadosExemplo() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copiarCodigo = (codigo: string, tipo: string) => {
    // Método alternativo compatível com todas as políticas de segurança
    try {
      // Cria um textarea temporário
      const textarea = document.createElement("textarea");
      textarea.value = codigo;
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      
      // Seleciona e copia o texto
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Para mobile
      document.execCommand("copy");
      
      // Remove o textarea
      document.body.removeChild(textarea);
      
      // Feedback visual
      setCopiedCode(`${tipo}-${codigo}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Erro ao copiar código:", error);
      // Fallback: mostrar o código em um alert
      alert(`Código copiado: ${codigo}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Dados de Exemplo</h1>
          <p className="text-muted-foreground">
            Use estes dados para testar o sistema com a nova funcionalidade de códigos
          </p>
        </div>
      </div>

      {/* Instruções */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>Como Usar</CardTitle>
          </div>
          <CardDescription>
            Siga estas etapas para criar sua primeira encomenda com códigos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <p className="font-semibold">Cadastre os Clientes</p>
                <p className="text-sm text-muted-foreground">
                  Vá em "Clientes" e cadastre usando os códigos CLI001, CLI002, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <p className="font-semibold">Cadastre os Produtos</p>
                <p className="text-sm text-muted-foreground">
                  Vá em "Produtos" e cadastre usando os códigos P001, B001, D001, S001, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <p className="font-semibold">Crie a Encomenda</p>
                <p className="text-sm text-muted-foreground">
                  Digite apenas os códigos e veja o preenchimento automático!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com dados */}
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="encomenda" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Encomenda
          </TabsTrigger>
        </TabsList>

        {/* CLIENTES */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes para Cadastro</CardTitle>
              <CardDescription>
                {clientesExemplo.length} clientes de exemplo com códigos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesExemplo.map((cliente, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {cliente.codigo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cliente.telefone}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cliente.email}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarCodigo(cliente.codigo!, "CLI")}
                          >
                            {copiedCode === `CLI-${cliente.codigo}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUTOS */}
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos para Cadastro</CardTitle>
              <CardDescription>
                {produtosExemplo.length} produtos de exemplo com códigos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosExemplo.map((produto, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {produto.codigo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{produto.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {produto.pesoPorUnidadeKg.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          R$ {produto.preco?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarCodigo(produto.codigo!, "PRD")}
                          >
                            {copiedCode === `PRD-${produto.codigo}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENCOMENDA */}
        <TabsContent value="encomenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encomenda de Exemplo</CardTitle>
              <CardDescription>
                Exemplo completo de encomenda usando códigos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cliente
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Código:</span>
                    <Badge variant="outline" className="font-mono">
                      {encomendaExemplo.clienteCodigo}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copiarCodigo(encomendaExemplo.clienteCodigo, "CLI-ENC")
                      }
                    >
                      {copiedCode === `CLI-ENC-${encomendaExemplo.clienteCodigo}` ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Nome:</span>
                    <span className="font-medium">{encomendaExemplo.clienteNome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Telefone:</span>
                    <span className="text-sm">{encomendaExemplo.clienteTelefone}</span>
                  </div>
                </div>
              </div>

              {/* Data e Hora */}
              <div className="space-y-2">
                <h3 className="font-semibold">Data e Hora da Entrega</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Data:</span>
                    <Badge>
                      {new Date(encomendaExemplo.data).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Hora:</span>
                    <Badge>{encomendaExemplo.hora}</Badge>
                  </div>
                </div>
              </div>

              {/* Produtos */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos Encomendados
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Peso Total</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {encomendaExemplo.produtos.map((produto, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {produto.produtoCodigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {produto.produtoNome}
                          </TableCell>
                          <TableCell className="text-right">
                            {produto.quantidade}
                          </TableCell>
                          <TableCell className="text-right">
                            {produto.pesoTotalKg.toFixed(2)} kg
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {produto.observacao}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totais */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {encomendaExemplo.quantidadeTotal} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {encomendaExemplo.pesoTotalGeral.toFixed(2)} kg
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vantagens */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-900 dark:text-green-100">
              Vantagens do Sistema com Códigos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Cadastro Rápido
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Digite apenas o código e os dados são preenchidos automaticamente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Sem Erros
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Nomes padronizados, sem variações de digitação
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Produção Facilitada
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Lista mostra "Código - Nome" facilitando identificação rápida
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Busca Inteligente
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Filtre por código OU nome em relatórios
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}