"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { criarVendaPdvAction, type PdvItem } from "@/actions/pdv";
import PageHeader from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/agenda";
import { AlertCircle, Trash2 } from "lucide-react";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoqueAtual: number;
};

type CarrinhoItem = PdvItem & {
  nomeProduto: string;
  produtoReferencia?: Produto;
};

export default function PdvPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [busca, setBusca] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState<"DINHEIRO" | "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "TRANSFERENCIA" | "BOLETO" | "FIADO" | "OUTRO">("DINHEIRO");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    // Carregar produtos
    async function carregarProdutos() {
      try {
        const response = await fetch("/api/pdv/produtos");
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const data = await response.json();
        setProdutos(data);
        setCarregando(false);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar produtos");
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((item) => item.produtoId === produto.id);

    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoqueAtual) {
        setCarrinho(
          carrinho.map((item) =>
            item.produtoId === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          )
        );
      } else {
        setErro("Estoque insuficiente");
      }
    } else {
      setCarrinho([
        ...carrinho,
        {
          produtoId: produto.id,
          quantidade: 1,
          precoUnitario: produto.preco,
          nomeProduto: produto.nome,
          produtoReferencia: produto,
        },
      ]);
    }
    setBusca("");
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter((item) => item.produtoId !== produtoId));
  };

  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }

    const produto = produtos.find((p) => p.id === produtoId);
    if (produto && novaQuantidade > produto.estoqueAtual) {
      setErro("Quantidade superior ao estoque disponível");
      return;
    }

    setCarrinho(
      carrinho.map((item) =>
        item.produtoId === produtoId
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  };

  const subtotal = carrinho.reduce(
    (sum, item) => sum + item.quantidade * item.precoUnitario,
    0
  );
  const total = subtotal - desconto + acrescimo;

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      setErro("Carrinho vazio");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const result = await criarVendaPdvAction({
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
        desconto,
        acrescimo,
        formaPagamento,
        observacoes,
      });

      setSucesso(`Venda realizada com sucesso! Total: ${formatCurrency(Number(result.total))}`);
      setCarrinho([]);
      setDesconto(0);
      setAcrescimo(0);
      setFormaPagamento("DINHEIRO");
      setObservacoes("");

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar venda");
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="PDV - Ponto de Venda"
        description="Venda rápida de produtos sem comanda"
        actions={
          <Link
            href="/financeiro/caixa"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para Caixa
          </Link>
        }
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Coluna esquerda: Produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Busca de produtos */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Grade de produtos */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoqueAtual === 0}
                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition"
                  >
                    <div className="font-semibold text-sm text-slate-900">
                      {produto.nome}
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">
                      {formatCurrency(produto.preco)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Est. {produto.estoqueAtual}
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center text-slate-500 py-8">
                  {busca ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita: Carrinho */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
          <h2 className="text-lg font-bold">Carrinho</h2>

          {/* Alertas */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{sucesso}</p>
            </div>
          )}

          {/* Itens do carrinho */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {carrinho.length > 0 ? (
              carrinho.map((item) => (
                <div
                  key={item.produtoId}
                  className="border border-slate-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900">
                        {item.nomeProduto}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(item.precoUnitario)} cada
                      </p>
                    </div>
                    <button
                      onClick={() => removerDoCarrinho(item.produtoId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1)}
                      className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarQuantidade(
                          item.produtoId,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-12 text-center border border-slate-300 rounded"
                    />
                    <button
                      onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1)}
                      className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    Subtotal: {formatCurrency(item.quantidade * item.precoUnitario)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Carrinho vazio
              </div>
            )}
          </div>

          {/* Resumo de totais */}
          {carrinho.length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-600">Desconto</label>
                  <input
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-600">Acréscimo</label>
                  <input
                    type="number"
                    value={acrescimo}
                    onChange={(e) => setAcrescimo(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold bg-slate-50 p-3 rounded">
                <span>Total:</span>
                <span className="text-xl text-slate-900">{formatCurrency(total)}</span>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                >
                  <option value="DINHEIRO">💵 Dinheiro</option>
                  <option value="PIX">📱 PIX</option>
                  <option value="CARTAO_CREDITO">💳 Cartão Crédito</option>
                  <option value="CARTAO_DEBITO">💳 Cartão Débito</option>
                  <option value="TRANSFERENCIA">💰 Transferência</option>
                  <option value="BOLETO">📄 Boleto</option>
                  <option value="FIADO">🔖 Fiado</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-2">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações da venda..."
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <button
                onClick={finalizarVenda}
                disabled={enviando || carrinho.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 font-semibold rounded-lg"
              >
                {enviando ? "Processando..." : "Finalizar Venda"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
