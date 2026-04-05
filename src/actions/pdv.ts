"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type PdvItem = {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
};

export type PdvVendaInput = {
  itens: PdvItem[];
  desconto?: number;
  acrescimo?: number;
  formaPagamento: "DINHEIRO" | "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "TRANSFERENCIA" | "BOLETO" | "MISTO" | "FIADO" | "OUTRO";
  observacoes?: string;
};

export async function criarVendaPdvAction(data: PdvVendaInput) {
  try {
    const user = await requireUser();

    if (!data.itens || data.itens.length === 0) {
      throw new Error("Nenhum item na venda");
    }

    // Verificar estoque e preparar dados
    const itensComVerificacao = await Promise.all(
      data.itens.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: {
            id: true,
            nome: true,
            estoqueAtual: true,
            preco: true,
          },
        });

        if (!produto) {
          throw new Error(`Produto ${item.produtoId} não encontrado`);
        }

        if (produto.estoqueAtual < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoqueAtual}`
          );
        }

        return {
          ...item,
          produtoNome: produto.nome,
          preco: item.precoUnitario || produto.preco,
        };
      })
    );

    // Calcular totais
    const subtotal = itensComVerificacao.reduce(
      (sum, item) => sum + Number(item.quantidade) * Number(item.preco),
      0
    );
    const desconto = Number(data.desconto) || 0;
    const acrescimo = Number(data.acrescimo) || 0;
    const total = subtotal - desconto + acrescimo;

    // Verificar se o caixa está aberto
    const caixaAberto = await prisma.caixaFechamento.findFirst({
      where: {
        empresaId: user.empresaId,
        dataFechamento: null,
      },
    });

    if (!caixaAberto) {
      throw new Error("Caixa não está aberto. Abra o caixa antes de registrar vendas.");
    }

    // Criar transação
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Decrementar estoque
      for (const item of itensComVerificacao) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoqueAtual: {
              decrement: item.quantidade,
            },
          },
        });

        // 2. Registrar movimentação de estoque
        await tx.estoqueMovimentacao.create({
          data: {
            produtoId: item.produtoId,
            empresaId: user.empresaId,
            tipo: "SAIDA",
            quantidade: Number(item.quantidade),
            origem: "VENDA_PDV",
            saldoAnterior: 0,
            saldoAtual: 0,
            usuarioId: user.id,
          },
        });
      }

      // 3. Criar registro de venda PDV
      const venda = await tx.vendaPdv.create({
        data: {
          empresaId: user.empresaId,
          usuarioId: user.id,
          subtotal,
          desconto,
          acrescimo,
          total,
          formaPagamento: data.formaPagamento,
          observacoes: data.observacoes,
          itens: {
            create: itensComVerificacao.map((item) => ({
              produtoId: item.produtoId,
              quantidade: Number(item.quantidade),
              precoUnitario: Number(item.preco),
              subtotal: Number(item.quantidade) * Number(item.preco),
            })),
          },
        },
        include: {
          itens: true,
        },
      });

      // 4. Criar movimento de caixa
      if (data.formaPagamento !== "FIADO") {
        await tx.caixaMovimento.create({
          data: {
            caixaFechamentoId: caixaAberto.id,
            empresaId: user.empresaId,
            usuarioId: user.id,
            tipo: "ENTRADA",
            categoria: "VENDA_PDV",
            valor: total,
            descricao: `Venda PDV - ${itensComVerificacao.map((i) => i.produtoNome).join(", ")}`,
            referencia: `PDV-${venda.id}`,
          },
        });
      } else {
        // Se for FIADO, criar conta a receber
        await tx.contaReceber.create({
          data: {
            empresaId: user.empresaId,
            descricao: `Venda PDV - ${itensComVerificacao.map((i) => i.produtoNome).join(", ")}`,
            valorOriginal: total,
            valorAberto: total,
            vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            status: "ABERTA",
            origemTipo: "VENDA_PDV",
            origemId: venda.id,
          },
        });
      }

      return venda;
    });

    return {
      success: true,
      vendaId: resultado.id,
      total: resultado.total,
      message: "Venda registrada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao criar venda PDV:", error);
    throw error;
  }
}

export async function listarVendasPdvAction() {
  try {
    const user = await requireUser();

    const vendas = await prisma.vendaPdv.findMany({
      where: {
        empresaId: user.empresaId,
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
              },
            },
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
      take: 50,
    });

    return vendas;
  } catch (error) {
    console.error("Erro ao listar vendas PDV:", error);
    throw error;
  }
}
