import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText } from "lucide-react";
import { ProtecaoAdministracao } from "../components/ProtecaoAdministracao";
import { GeradorOrcamento } from "../components/GeradorOrcamento";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function Administracao() {
  return (
    <ProtecaoAdministracao>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🔐 Administração
            </h1>
            <p className="text-muted-foreground">
              Área exclusiva para gestão avançada e históricos
            </p>
          </div>
        </div>

        {/* Gerador de Orçamento */}
        <ErrorBoundary fallbackMessage="Erro ao carregar o Gerador de Orçamento">
          <GeradorOrcamento />
        </ErrorBoundary>
      </div>
    </ProtecaoAdministracao>
  );
}