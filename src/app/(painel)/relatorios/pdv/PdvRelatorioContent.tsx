"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileText } from "lucide-react";

type VendaRow = {
  id: string;
  data: string;
  hora: string;
  usuario: string;
  itens: number;
  produtos: string;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  formaPagamento: string;
  observacoes: string;
};

export function PdvRelatorioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filtros
  const [dataInicio, setDataInicio] = useState(searchParams.get("de") || "");
  const [dataFim, setDataFim] = useState(searchParams.get("ate") || "");
  const [formaPagamento, setFormaPagamento] = useState(searchParams.get("status") || "");
  const [observacoes, setObservacoes] = useState(searchParams.get("q") || "");

  // Loading states
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [gerandoExcel, setGerandoExcel] = useState(false);

  const aplicarFiltros = () => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("de", dataInicio);
    if (dataFim) params.set("ate", dataFim);
    if (formaPagamento) params.set("status", formaPagamento);
    if (observacoes) params.set("q", observacoes);

    router.push(`?${params.toString()}`);
  };

  const exportarPdf = async () => {
    setGerandoPdf(true);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set("de", dataInicio);
      if (dataFim) params.set("ate", dataFim);
      if (formaPagamento) params.set("status", formaPagamento);
      if (observacoes) params.set("q", observacoes);

      const response = await fetch(`/api/relatorios/pdv/pdf?${params}`);
      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-pdv-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erro ao gerar PDF: " + (error as Error).message);
    } finally {
      setGerandoPdf(false);
    }
  };

  const exportarExcel = async () => {
    setGerandoExcel(true);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set("de", dataInicio);
      if (dataFim) params.set("ate", dataFim);
      if (formaPagamento) params.set("status", formaPagamento);
      if (observacoes) params.set("q", observacoes);

      const response = await fetch(`/api/relatorios/pdv/excel?${params}`);
      if (!response.ok) throw new Error("Erro ao gerar Excel");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-pdv-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erro ao gerar Excel: " + (error as Error).message);
    } finally {
      setGerandoExcel(false);
    }
  };

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setFormaPagamento("");
    setObservacoes("");
    router.push("?");
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="">Todos</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão Crédito</option>
              <option value="CARTAO_DEBITO">Cartão Débito</option>
              <option value="PIX">PIX</option>
              <option value="FIADO">Fiado</option>
              <option value="CHEQUE">Cheque</option>
              <option value="VALE">Vale</option>
              <option value="CONVENCAO">Convenção</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observações (Busca)</label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Pesquisar observações..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={aplicarFiltros}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={limparFiltros}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Exportar */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Exportar</h2>
        <div className="flex gap-3">
          <button
            onClick={exportarPdf}
            disabled={gerandoPdf}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            <FileText size={18} />
            {gerandoPdf ? "Gerando..." : "Gerar PDF"}
          </button>
          <button
            onClick={exportarExcel}
            disabled={gerandoExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            <Download size={18} />
            {gerandoExcel ? "Gerando..." : "Gerar Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
