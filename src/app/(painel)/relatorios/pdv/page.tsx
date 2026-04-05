import { Suspense } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { PdvRelatorioContent } from "./PdvRelatorioContent";

export default function PdvRelatorioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatório de PDV"
        description="Análise de vendas rápidas por ponto de venda"
      />

      <Suspense fallback={<div className="p-4 text-center">Carregando...</div>}>
        <PdvRelatorioContent />
      </Suspense>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Clique em <strong>PDF</strong> ou <strong>Excel</strong> para gerar o relatório com os filtros aplicados
        </p>
      </div>
    </div>
  );
}
