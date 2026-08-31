import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Edit2, Trash2, X, Plus } from "lucide-react";

interface ItemEncomenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  observacao?: string;
  pesoUnitario: number;
  pesoTotal: number;
}

interface Encomenda {
  id: string;
  clienteId?: string;
  clienteNome: string;
  data: string;
  hora: string;
  itens: ItemEncomenda[];
}

interface Props {
  encomendas: Encomenda[];
  encomendaEditandoId: string | null;
  encomendaAtual: any;
  temAlteracoes: boolean;
  clientes: any[];
  produtos: any[];
  itemTemp: any;
  onEditar: (encomenda: Encomenda) => void;
  onExcluir: (encomenda: Encomenda) => void;
  onCancelar: () => void;
  onSalvar: () => void;
  setEncomendaAtual: (e: any) => void;
  setTemAlteracoes: (v: boolean) => void;
  setItemTemp: (i: any) => void;
  adicionarItem: () => void;
  removerItem: (index: number) => void;
  gerarHorarios: () => string[];
  calcularPesoTotal: (itens: ItemEncomenda[]) => number;
  setEncomendaEditandoId: (id: string | null) => void;
  atualizarItem: (index: number, itemAtualizado: Partial<ItemEncomenda>) => void;
}

export function TabelaEncomendas({
  encomendas,
  encomendaEditandoId,
  encomendaAtual,
  temAlteracoes,
  clientes,
  produtos,
  itemTemp,
  onEditar,
  onExcluir,
  onCancelar,
  onSalvar,
  setEncomendaAtual,
  setTemAlteracoes,
  setItemTemp,
  adicionarItem,
  removerItem,
  gerarHorarios,
  calcularPesoTotal,
  setEncomendaEditandoId,
  atualizarItem,
}: Props) {
  console.log("🔄 TabelaEncomendas.tsx VERSÃO 2.9.0 - Adicionar Produtos - Destaque Verde");
  console.log("✅ Formulário de adicionar produtos (verde) está ATIVO no modo de edição!");
  
  return (
    <Card className="print:hidden">
      <CardContent className="pt-6">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <div className="border rounded-lg overflow-hidden min-w-max">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-center p-3 font-semibold">Hora</th>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">Produto</th>
                  <th className="text-center p-3 font-semibold">Quantidade</th>
                  <th className="text-left p-3 font-semibold">Observação</th>
                  <th className="text-center p-3 font-semibold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {encomendas.map((encomenda) => {
                  const estaEditando = encomendaEditandoId === encomenda.id;
                  console.log(`📋 Tabela - Encomenda ${encomenda.id}: estaEditando=${estaEditando}, encomendaEditandoId=${encomendaEditandoId}`);

                  return (
                    <React.Fragment key={encomenda.id}>
                      {/* LINHAS NORMAIS DA ENCOMENDA */}
                      {encomenda.itens.map((item, idx) => (
                        <tr
                          key={`${encomenda.id}-${idx}`}
                          className="border-t hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-3">
                            {new Date(encomenda.data + "T00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3 text-center">{encomenda.hora}</td>
                          <td className="p-3">
                            {clientes.find(c => c.id === encomenda.clienteId)?.codigo && (
                              <span className="text-xs text-muted-foreground font-mono mr-2 bg-muted px-1.5 py-0.5 rounded">
                                {clientes.find(c => c.id === encomenda.clienteId)?.codigo}
                              </span>
                            )}
                            {encomenda.clienteNome}
                          </td>
                          <td className="p-3 font-medium">
                            {produtos.find(p => p.id === item.produtoId)?.codigo && (
                              <span className="text-xs text-muted-foreground font-mono mr-2 bg-muted px-1.5 py-0.5 rounded">
                                {produtos.find(p => p.id === item.produtoId)?.codigo}
                              </span>
                            )}
                            {item.produtoNome}
                          </td>
                          <td className="p-3 text-center font-semibold">{item.quantidade}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {item.observacao || "-"}
                          </td>
                          <td className="p-3 text-center">
                            {idx === 0 && (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log("🔒 CLIQUE NO BOTÃO EDITAR - Solicitando senha - ID:", encomenda.id);
                                    onEditar(encomenda);
                                  }}
                                  title="Requer senha para editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log("🔒 CLIQUE NO BOTÃO EXCLUIR - Solicitando senha - ID:", encomenda.id);
                                    onExcluir(encomenda);
                                  }}
                                  title="Requer senha para excluir"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* LINHA DE EDIÇÃO INLINE */}
                      {estaEditando && (
                        <tr className="bg-blue-50 dark:bg-blue-950">
                          <td colSpan={7} className="p-6 border-t-4 border-primary">
                            {console.log("✅ RENDERIZANDO FORMULÁRIO DE EDIÇÃO INLINE")}
                            <div className="space-y-6">
                              {/* Cabeçalho */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Edit2 className="w-5 h-5 text-primary" />
                                  <h3 className="text-lg font-semibold text-primary">
                                    Editando Encomenda
                                  </h3>
                                  {temAlteracoes && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-sm animate-pulse">
                                      <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                                      Alterações não salvas
                                    </div>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={onCancelar}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Dados Básicos */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Cliente *</Label>
                                  <select
                                    value={encomendaAtual.clienteId || ""}
                                    onChange={(e) => {
                                      setEncomendaAtual({ ...encomendaAtual, clienteId: e.target.value });
                                      setTemAlteracoes(true);
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {clientes.map((cliente) => (
                                      <option key={cliente.id} value={cliente.id}>
                                        {cliente.nome}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label>Data *</Label>
                                  <Input
                                    type="date"
                                    value={encomendaAtual.data || ""}
                                    onChange={(e) => {
                                      setEncomendaAtual({ ...encomendaAtual, data: e.target.value });
                                      setTemAlteracoes(true);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Hora *</Label>
                                  <select
                                    value={encomendaAtual.hora || ""}
                                    onChange={(e) => {
                                      setEncomendaAtual({ ...encomendaAtual, hora: e.target.value });
                                      setTemAlteracoes(true);
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="">Selecione...</option>
                                    {gerarHorarios().map((hora) => (
                                      <option key={hora} value={hora}>
                                        {hora}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Adicionar Produtos - Destaque Verde */}
                              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-950/30 shadow-md mb-4">
                                <h4 className="font-bold mb-4 text-green-700 dark:text-green-300 flex items-center gap-2 text-lg">
                                  <Plus className="w-5 h-5" />
                                  Adicionar Mais Produtos ao Pedido
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                  <div className="md:col-span-5">
                                    <Label className="font-semibold">Produto *</Label>
                                    <select
                                      value={itemTemp.produtoId || ""}
                                      onChange={(e) =>
                                        setItemTemp({ ...itemTemp, produtoId: e.target.value })
                                      }
                                      className="flex h-10 w-full rounded-md border-2 border-green-300 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500"
                                    >
                                      <option value="">Selecione o produto...</option>
                                      {produtos.map((produto) => (
                                        <option key={produto.id} value={produto.id}>
                                          {produto.codigo ? `${produto.codigo} - ` : ""}
                                          {produto.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label className="font-semibold">Quantidade *</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={itemTemp.quantidade || ""}
                                      onChange={(e) =>
                                        setItemTemp({
                                          ...itemTemp,
                                          quantidade: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="border-2 border-green-300 focus:border-green-500"
                                    />
                                  </div>
                                  <div className="md:col-span-4">
                                    <Label className="font-semibold">Observação</Label>
                                    <Input
                                      value={itemTemp.observacao || ""}
                                      onChange={(e) =>
                                        setItemTemp({ ...itemTemp, observacao: e.target.value })
                                      }
                                      placeholder="Ex: Sem açúcar, recheio extra..."
                                      className="border-2 border-green-300 focus:border-green-500"
                                    />
                                  </div>
                                  <div className="md:col-span-1 flex items-end">
                                    <Button 
                                      onClick={adicionarItem} 
                                      className="w-full bg-green-600 hover:bg-green-700 font-bold"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">
                                  💡 Após adicionar todos os produtos, clique em "Salvar" no final da página
                                </p>
                              </div>

                              {/* Lista de Itens */}
                              {encomendaAtual.itens && encomendaAtual.itens.length > 0 && (
                                <div className="border rounded-lg overflow-hidden bg-background">
                                  <table className="w-full">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="text-left p-3 font-semibold">Produto</th>
                                        <th className="text-center p-3 font-semibold w-24">Qtd</th>
                                        <th className="text-center p-3 font-semibold w-32">
                                          Peso Un.
                                        </th>
                                        <th className="text-center p-3 font-semibold w-32">
                                          Peso Total
                                        </th>
                                        <th className="text-left p-3 font-semibold">Observação</th>
                                        <th className="w-16"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {console.log("🎨 TABELA DE EDIÇÃO - Renderizando", encomendaAtual.itens?.length, "itens com campos editáveis")}
                                      {encomendaAtual.itens.map((item: ItemEncomenda, index: number) => {
                                        console.log(`📝 Item ${index}: ${item.produtoNome} - Renderizando SELECT + INPUTs`);
                                        return (
                                        <tr key={index} className="border-t bg-amber-50 dark:bg-amber-950/20">
                                          <td className="p-2">
                                            <select
                                              value={item.produtoId}
                                              onChange={(e) => atualizarItem(index, { produtoId: e.target.value })}
                                              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                                            >
                                              {produtos.map((produto) => (
                                                <option key={produto.id} value={produto.id}>
                                                  {produto.codigo ? `${produto.codigo} - ` : ""}{produto.nome}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="p-2">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={item.quantidade}
                                              onChange={(e) => atualizarItem(index, { quantidade: parseInt(e.target.value) || 1 })}
                                              className="w-full h-9 text-center"
                                            />
                                          </td>
                                          <td className="p-2 text-center text-sm">
                                            {item.pesoUnitario.toFixed(3)} kg
                                          </td>
                                          <td className="p-2 text-center font-semibold text-sm">
                                            {item.pesoTotal.toFixed(3)} kg
                                          </td>
                                          <td className="p-2">
                                            <Input
                                              value={item.observacao || ""}
                                              onChange={(e) => atualizarItem(index, { observacao: e.target.value })}
                                              placeholder="Observação..."
                                              className="w-full h-9 text-sm"
                                            />
                                          </td>
                                          <td className="p-2 text-center">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removerItem(index)}
                                            >
                                              <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                          </td>
                                        </tr>
                                      )})}
                                      <tr className="border-t bg-muted/50 font-semibold">
                                        <td className="p-3 text-right" colSpan={3}>
                                          Peso Total:
                                        </td>
                                        <td className="p-3 text-center text-primary">
                                          {calcularPesoTotal(encomendaAtual.itens).toFixed(3)} kg
                                        </td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Botões de Ação */}
                              <div className="flex gap-2 pt-4 border-t">
                                <Button
                                  onClick={() => {
                                    console.log("💾 SALVANDO ENCOMENDA");
                                    onSalvar();
                                    setEncomendaEditandoId(null);
                                  }}
                                  className={
                                    temAlteracoes
                                      ? "animate-pulse bg-green-600 hover:bg-green-700"
                                      : ""
                                  }
                                >
                                  💾 Salvar
                                </Button>
                                <Button variant="outline" onClick={onCancelar}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}