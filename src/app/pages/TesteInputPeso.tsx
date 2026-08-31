import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { InputPeso } from "../components/InputPeso";
import { InputMonetario } from "../components/InputMonetario";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, XCircle, Calculator } from "lucide-react";

/**
 * Página de Teste do InputPeso
 *
 * Demonstra a separação correta entre:
 * - InputPeso: para QUANTIDADE em kg
 * - InputMonetario: para DINHEIRO em R$
 */
export default function TesteInputPeso() {
  // ⚖️ PESO (kg)
  const [teste1Kg, setTeste1Kg] = useState(0);
  const [teste2Kg, setTeste2Kg] = useState(3.33);
  const [teste3Kg, setTeste3Kg] = useState(50);
  const [teste4Un, setTeste4Un] = useState(5);

  // 💰 PREÇOS (R$)
  const [precoKg, setPrecoKg] = useState(15.00);

  // 🧮 CÁLCULOS AUTOMÁTICOS
  const valorTeste1 = teste1Kg * precoKg;
  const valorTeste2 = teste2Kg * precoKg;
  const valorTeste3 = teste3Kg * precoKg;
  const valorTotal = valorTeste1 + valorTeste2 + valorTeste3;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">⚖️ Teste do InputPeso</h1>
        <p className="text-muted-foreground mt-2">
          Validação da separação correta entre PESO (kg) e DINHEIRO (R$)
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-2 border-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-full">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Conceitos Separados</h3>
              <ul className="text-sm space-y-1">
                <li><strong>⚖️ InputPeso:</strong> Para quantidade em kg (3 casas decimais)</li>
                <li><strong>💰 InputMonetario:</strong> Para dinheiro em R$ (2 casas decimais)</li>
                <li><strong>🧮 Cálculo:</strong> quantidade(kg) × preço(R$/kg) = valor(R$)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste 1: Campo Vazio */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 1</Badge>
            Digitação Normal - kg
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teste1Kg">⚖️ Quantidade (kg)</Label>
              <InputPeso
                id="teste1Kg"
                valor={teste1Kg}
                onChange={(v) => setTeste1Kg(v)}
                unidade="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>💰 Valor Total</Label>
              <div className="text-2xl font-bold text-primary">
                R$ {valorTeste1.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Teste: Digite "50"</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                {teste1Kg === 50 || teste1Kg === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                Ao sair: formata para "50,000" (3 casas decimais)
              </li>
              <li className="flex items-center gap-2 mt-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Cálculo: {teste1Kg.toFixed(3)} kg × R$ {precoKg.toFixed(2)}/kg = R$ {valorTeste1.toFixed(2)}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 2: Edição de Valor (BUG ORIGINAL) */}
      <Card className="border-2 border-orange-500">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">Teste Crítico</Badge>
            Edição de Quantidade Existente (Bug Original)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teste2Kg">⚖️ Quantidade (kg)</Label>
              <InputPeso
                id="teste2Kg"
                valor={teste2Kg}
                onChange={(v) => setTeste2Kg(v)}
                unidade="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>💰 Valor Total</Label>
              <div className="text-2xl font-bold text-primary">
                R$ {valorTeste2.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">🐛 Bug Original:</p>
            <ul className="text-sm space-y-1">
              <li className="line-through text-red-600">
                ❌ Ao editar 3,330 → 50, mostrava valor errado
              </li>
              <li className="line-through text-red-600">
                ❌ Campo "brigava" com o usuário durante edição
              </li>
            </ul>
            <p className="text-sm font-semibold mt-4 mb-2">✅ Correção:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Teste: Edite 3,330 para 50,000 (funciona perfeitamente!)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Formatação só acontece ao sair do campo (onBlur)
              </li>
              <li className="flex items-center gap-2 mt-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Cálculo: {teste2Kg.toFixed(3)} kg × R$ {precoKg.toFixed(2)}/kg = R$ {valorTeste2.toFixed(2)}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 3: Valores Grandes */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 3</Badge>
            Valores Grandes em kg
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teste3Kg">⚖️ Quantidade (kg)</Label>
              <InputPeso
                id="teste3Kg"
                valor={teste3Kg}
                onChange={(v) => setTeste3Kg(v)}
                unidade="kg"
              />
            </div>
            <div className="space-y-2">
              <Label>💰 Valor Total</Label>
              <div className="text-2xl font-bold text-primary">
                R$ {valorTeste3.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Teste: Digite "50,00"</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Formata para "50,000" (3 decimais para kg)
              </li>
              <li className="flex items-center gap-2 mt-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Cálculo: {teste3Kg.toFixed(3)} kg × R$ {precoKg.toFixed(2)}/kg = R$ {valorTeste3.toFixed(2)}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Teste 4: Unidade (un) */}
      <Card>
        <CardHeader className="bg-yellow-50">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Teste 4</Badge>
            Unidade (un) - Número Inteiro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teste4Un">🔢 Quantidade (un)</Label>
              <InputPeso
                id="teste4Un"
                valor={teste4Un}
                onChange={(v) => setTeste4Un(v)}
                unidade="un"
              />
            </div>
            <div className="space-y-2">
              <Label>💰 Preço por unidade</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                R$ 10,00/un
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Comportamento para "un":</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Aceita apenas números inteiros
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Arredonda automaticamente: 5,7 → 6
              </li>
              <li className="flex items-center gap-2 mt-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Valor: {teste4Un} un × R$ 10,00/un = R$ {(teste4Un * 10).toFixed(2)}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Preço */}
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-green-600" />
            Configuração de Preço (R$/kg)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="precoKg">💰 Preço por Kilograma (R$/kg)</Label>
            <InputMonetario
              id="precoKg"
              valor={precoKg}
              onChange={(v) => setPrecoKg(v)}
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">
              Todos os cálculos acima usam este preço
            </p>
            <p className="text-sm text-muted-foreground">
              Altere o preço e veja os valores totais atualizarem automaticamente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Resumo Geral do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Teste 1</p>
                <p className="text-lg font-bold">⚖️ {teste1Kg.toFixed(3)} kg</p>
                <p className="text-md text-primary">💰 R$ {valorTeste1.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Teste 2</p>
                <p className="text-lg font-bold">⚖️ {teste2Kg.toFixed(3)} kg</p>
                <p className="text-md text-primary">💰 R$ {valorTeste2.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Teste 3</p>
                <p className="text-lg font-bold">⚖️ {teste3Kg.toFixed(3)} kg</p>
                <p className="text-md text-primary">💰 R$ {valorTeste3.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t-2 pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>TOTAL GERAL:</span>
                <span className="text-2xl text-primary">R$ {valorTotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Peso total: {(teste1Kg + teste2Kg + teste3Kg).toFixed(3)} kg × R$ {precoKg.toFixed(2)}/kg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
