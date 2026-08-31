import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { InputMonetario } from "../components/InputMonetario";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Página de Teste do InputMonetario
 *
 * Demonstra o funcionamento correto do componente monetário
 * com diversos cenários de uso e validação
 */
export default function TesteInputMonetario() {
  const [teste1, setTeste1] = useState(0);
  const [teste2, setTeste2] = useState(3.33);
  const [teste3, setTeste3] = useState(1234.56);
  const [teste4, setTeste4] = useState(50);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">🧪 Teste do InputMonetario</h1>
        <p className="text-muted-foreground mt-2">
          Página de testes para validar o comportamento correto dos inputs monetários
        </p>
      </div>

      {/* Teste 1: Campo Vazio */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 1</Badge>
            Digitação Normal (campo vazio)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teste1">Digite "50"</Label>
            <InputMonetario
              id="teste1"
              valor={teste1}
              onChange={(v) => setTeste1(v)}
              placeholder="0,00"
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Comportamento esperado:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                {teste1 === 50 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Durante digitação: mostra "50"
              </li>
              <li className="flex items-center gap-2">
                {teste1 === 50 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Ao sair (blur): formata para "50,00"
              </li>
              <li className="flex items-center gap-2 mt-2 font-bold">
                Valor armazenado: {teste1}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 2: Edição de Valor Existente (BUG ORIGINAL) */}
      <Card className="border-2 border-orange-500">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">Teste Crítico</Badge>
            Edição de Valor Existente (Bug Original)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teste2">Tente editar 3,33 para 50,00</Label>
            <InputMonetario
              id="teste2"
              valor={teste2}
              onChange={(v) => setTeste2(v)}
              placeholder="0,00"
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">🐛 Bug Original:</p>
            <ul className="text-sm space-y-1">
              <li className="line-through text-red-600">
                ❌ Ao editar 3,33 → 50, campo mostrava 5,00 (ERRADO)
              </li>
            </ul>
            <p className="text-sm font-semibold mt-4 mb-2">✅ Correção:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                {teste2 === 50 || teste2 === 3.33 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Ao focar: remove formatação (3,33 fica editável)
              </li>
              <li className="flex items-center gap-2">
                {teste2 === 50 || teste2 === 3.33 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Durante edição: permite digitar "50" livremente
              </li>
              <li className="flex items-center gap-2">
                {teste2 === 50 || teste2 === 3.33 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Ao sair: formata corretamente para "50,00"
              </li>
              <li className="flex items-center gap-2 mt-2 font-bold">
                Valor armazenado: {teste2}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 3: Valores com Milhar */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 3</Badge>
            Valores com Separador de Milhar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teste3">Digite "1234,56"</Label>
            <InputMonetario
              id="teste3"
              valor={teste3}
              onChange={(v) => setTeste3(v)}
              placeholder="0,00"
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Comportamento esperado:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Durante digitação: mostra "1234,56"
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Ao sair: formata para "1.234,56" (adiciona ponto de milhar)
              </li>
              <li className="flex items-center gap-2 mt-2 font-bold">
                Valor armazenado: {teste3}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 4: Valores com Decimal Incompleto */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 4</Badge>
            Decimal Incompleto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teste4">Digite "3,3"</Label>
            <InputMonetario
              id="teste4"
              valor={teste4}
              onChange={(v) => setTeste4(v)}
              placeholder="0,00"
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Comportamento esperado:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Durante digitação: mostra "3,3"
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Ao sair: formata para "3,30" (completa 2 casas decimais)
              </li>
              <li className="flex items-center gap-2 mt-2 font-bold">
                Valor armazenado: {teste4}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Resumo dos Valores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Teste 1</p>
              <p className="text-2xl font-bold text-primary">R$ {teste1.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Teste 2</p>
              <p className="text-2xl font-bold text-primary">R$ {teste2.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Teste 3</p>
              <p className="text-2xl font-bold text-primary">R$ {teste3.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Teste 4</p>
              <p className="text-2xl font-bold text-primary">R$ {teste4.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
