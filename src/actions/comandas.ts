"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const EPSILON = 0.01;

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getInt(formData: FormData, key: string, fallback = 0) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function getDecimal(formData: FormData, key: string, fallback = 0) {
  let raw = String(formData.get(key) ?? "").trim();
  if (!raw) return fallback;

  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function toNumber(value: unknown) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money2(value: number) {
  return Number(value.toFixed(2));
}

function buildErrorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function rethrowIfRedirectError(error: unknown): never | void {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

async function getComandaOrThrow(comandaId: string, empresaId: string) {
  const comanda = await prisma.comanda.findFirst({
    where: {
      id: comandaId,
      empresaId,
    },
    include: {
      cliente: true,
      profissionalPrincipal: true,
      agendamento: true,
      itens: true,
      pagamentos: true,
    },
  });

  if (!comanda) {
    throw new Error("Comanda não encontrada.");
  }

  return comanda;
}

async function recalcularComandaTx(tx: any, comandaId: string) {
  const [comanda, itens] = await Promise.all([
    tx.comanda.findUnique({
      where: { id: comandaId },
      select: {
        id: true,
        descontoValor: true,
        acrescimoValor: true,
      },
    }),
    tx.comandaItem.findMany({
      where: { comandaId },
      select: {
        tipo: true,
        valorTotal: true,
      },
    }),
  ]);

  if (!comanda) {
    throw new Error("Comanda não encontrada para recalcular.");
  }

  const subtotalServicos = money2(
    itens
      .filter((item: any) => item.tipo === "SERVICO")
      .reduce((acc: number, item: any) => acc + toNumber(item.valorTotal), 0)
  );

  const subtotalProdutos = money2(
    itens
      .filter((item: any) => item.tipo === "PRODUTO")
      .reduce((acc: number, item: any) => acc + toNumber(item.valorTotal), 0)
  );

  const descontoValor = money2(toNumber(comanda.descontoValor));
  const acrescimoValor = money2(toNumber(comanda.acrescimoValor));

  const total = money2(
    subtotalServicos + subtotalProdutos - descontoValor + acrescimoValor
  );

  await tx.comanda.update({
    where: { id: comandaId },
    data: {
      subtotalServicos,
      subtotalProdutos,
      total,
    },
  });

  return {
    subtotalServicos,
    subtotalProdutos,
    descontoValor,
    acrescimoValor,
    total,
  };
}

async function validarComandaAberta(comandaId: string, empresaId: string) {
  const comanda = await prisma.comanda.findFirst({
    where: {
      id: comandaId,
      empresaId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!comanda) throw new Error("Comanda não encontrada.");
  if (comanda.status === "FECHADA" || comanda.status === "CANCELADA") {
    throw new Error("Essa comanda não pode mais ser alterada.");
  }

  return comanda;
}

export async function adicionarServicoComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const servicoId = getString(formData, "servicoId");
  const profissionalId = getString(formData, "profissionalId");

  if (!comandaId || !servicoId) {
    redirect(buildErrorUrl(`/comandas/${comandaId}`, "Dados inválidos."));
  }

  try {
    await validarComandaAberta(comandaId, user.empresaId);

    const [comanda, servico] = await Promise.all([
      prisma.comanda.findFirst({
        where: {
          id: comandaId,
          empresaId: user.empresaId,
        },
        select: {
          id: true,
          profissionalPrincipalId: true,
        },
      }),
      prisma.servico.findFirst({
        where: {
          id: servicoId,
          empresaId: user.empresaId,
          ativo: true,
        },
      }),
    ]);

    if (!comanda || !servico) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Serviço não encontrado."));
    }

    const valorUnitario = money2(toNumber(servico.preco));
    const comissaoPercentual = money2(toNumber(servico.comissaoPercentualPadrao));
    const valorComissao = money2((valorUnitario * comissaoPercentual) / 100);

    await prisma.$transaction(async (tx) => {
      await tx.comandaItem.create({
        data: {
          comandaId,
          tipo: "SERVICO",
          servicoId: servico.id,
          profissionalId: profissionalId || comanda.profissionalPrincipalId || null,
          descricao: servico.nome,
          quantidade: 1,
          valorUnitario,
          valorTotal: valorUnitario,
          comissaoPercentual,
          valorComissao,
        },
      });

      await recalcularComandaTx(tx, comandaId);
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=servico`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao adicionar serviço."
      )
    );
  }
}

export async function adicionarProdutoComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const produtoId = getString(formData, "produtoId");
  const quantidade = getInt(formData, "quantidade", 1);

  if (!comandaId || !produtoId) {
    redirect(buildErrorUrl(`/comandas/${comandaId}`, "Dados inválidos."));
  }

  try {
    await validarComandaAberta(comandaId, user.empresaId);

    const produto = await prisma.produto.findFirst({
      where: {
        id: produtoId,
        empresaId: user.empresaId,
        ativo: true,
      },
    });

    if (!produto) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Produto não encontrado."));
    }

    if (quantidade <= 0) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Quantidade inválida."));
    }

    if ((produto.estoqueAtual ?? 0) < quantidade) {
      redirect(
        buildErrorUrl(
          `/comandas/${comandaId}`,
          `Estoque insuficiente para ${produto.nome}. Saldo atual: ${produto.estoqueAtual}.`
        )
      );
    }

    const valorUnitario = money2(toNumber(produto.preco));
    const custoUnitario = money2(toNumber(produto.custo));
    const valorTotal = money2(valorUnitario * quantidade);

    await prisma.$transaction(async (tx) => {
      await tx.comandaItem.create({
        data: {
          comandaId,
          tipo: "PRODUTO",
          produtoId: produto.id,
          descricao: produto.nome,
          quantidade,
          valorUnitario,
          valorTotal,
          custoUnitario,
        },
      });

      await recalcularComandaTx(tx, comandaId);
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=produto`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao adicionar produto."
      )
    );
  }
}

export async function removerItemComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const itemId = getString(formData, "itemId");

  try {
    await validarComandaAberta(comandaId, user.empresaId);

    const item = await prisma.comandaItem.findFirst({
      where: {
        id: itemId,
        comandaId,
      },
      include: {
        comanda: {
          select: {
            empresaId: true,
          },
        },
      },
    });

    if (!item || item.comanda.empresaId !== user.empresaId) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Item não encontrado."));
    }

    await prisma.$transaction(async (tx) => {
      await tx.comandaItem.delete({
        where: { id: item.id },
      });

      await recalcularComandaTx(tx, comandaId);
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=removed-item`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao remover item."
      )
    );
  }
}

export async function atualizarResumoComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const descontoValor = money2(getDecimal(formData, "descontoValor", 0));
  const acrescimoValor = money2(getDecimal(formData, "acrescimoValor", 0));
  const observacoes = getString(formData, "observacoes");

  try {
    await validarComandaAberta(comandaId, user.empresaId);

    await prisma.$transaction(async (tx) => {
      await tx.comanda.update({
        where: { id: comandaId },
        data: {
          descontoValor,
          acrescimoValor,
          observacoes: observacoes || null,
          status: "EM_ANDAMENTO",
        },
      });

      await recalcularComandaTx(tx, comandaId);
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=resumo`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao atualizar resumo."
      )
    );
  }
}

export async function adicionarPagamentoComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const metodo = getString(formData, "metodo");
  const valor = money2(getDecimal(formData, "valor", 0));
  const observacoes = getString(formData, "observacoes");

  try {
    const comanda = await getComandaOrThrow(comandaId, user.empresaId);

    if (comanda.status === "FECHADA" || comanda.status === "CANCELADA") {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Essa comanda não pode receber pagamento."));
    }

    if (valor <= 0) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Informe um valor válido."));
    }

    const totalPagoAtual = money2(
      comanda.pagamentos.reduce((acc: number, p: any) => acc + toNumber(p.valor), 0)
    );

    const novoTotalPago = money2(totalPagoAtual + valor);
    const totalComanda = money2(toNumber(comanda.total));

    if (novoTotalPago > totalComanda + EPSILON) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "O pagamento ultrapassa o total da comanda."));
    }

    await prisma.comandaPagamento.create({
      data: {
        comandaId,
        metodo: metodo as any,
        valor,
        observacoes: observacoes || null,
        recebidoPorUsuarioId: user.id,
      },
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=pagamento`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao adicionar pagamento."
      )
    );
  }
}

export async function removerPagamentoComandaAction(formData: FormData) {
  const user = await requireUser();

  const comandaId = getString(formData, "comandaId");
  const pagamentoId = getString(formData, "pagamentoId");

  try {
    await validarComandaAberta(comandaId, user.empresaId);

    const pagamento = await prisma.comandaPagamento.findFirst({
      where: {
        id: pagamentoId,
        comandaId,
      },
      include: {
        comanda: {
          select: {
            empresaId: true,
          },
        },
      },
    });

    if (!pagamento || pagamento.comanda.empresaId !== user.empresaId) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Pagamento não encontrado."));
    }

    await prisma.comandaPagamento.delete({
      where: { id: pagamento.id },
    });

    revalidatePath(`/comandas/${comandaId}`);
    redirect(`/comandas/${comandaId}?ok=removed-payment`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao remover pagamento."
      )
    );
  }
}

export async function finalizarComandaAction(formData: FormData) {
  const user = await requireUser();
  const comandaId = getString(formData, "comandaId");

  try {
    const comanda = await getComandaOrThrow(comandaId, user.empresaId);

    if (comanda.status === "FECHADA") {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "Essa comanda já está fechada."));
    }

    if (!comanda.itens.length) {
      redirect(buildErrorUrl(`/comandas/${comandaId}`, "A comanda está sem itens."));
    }

    const totalComanda = money2(toNumber(comanda.total));
    const totalPago = money2(
      comanda.pagamentos.reduce((acc: number, p: any) => acc + toNumber(p.valor), 0)
    );

    if (Math.abs(totalPago - totalComanda) > EPSILON) {
      redirect(
        buildErrorUrl(
          `/comandas/${comandaId}`,
          `O total pago (${totalPago.toFixed(2)}) precisa ser igual ao total da comanda (${totalComanda.toFixed(2)}).`
        )
      );
    }

    const itensProduto = comanda.itens.filter(
      (item: any) => item.tipo === "PRODUTO" && item.produtoId
    );

    const consumoPorProduto = new Map<string, number>();

    for (const item of itensProduto) {
      const atual = consumoPorProduto.get(item.produtoId!) ?? 0;
      consumoPorProduto.set(item.produtoId!, atual + toNumber(item.quantidade));
    }

    const produtosIds = Array.from(consumoPorProduto.keys());

    await prisma.$transaction(async (tx) => {
      await recalcularComandaTx(tx, comandaId);

      if (produtosIds.length) {
        const produtos = await tx.produto.findMany({
          where: {
            id: { in: produtosIds },
            empresaId: user.empresaId,
          },
        });

        for (const produto of produtos) {
          const qtd = consumoPorProduto.get(produto.id) ?? 0;
          const saldoAnterior = produto.estoqueAtual ?? 0;
          const saldoAtual = saldoAnterior - qtd;

          if (saldoAtual < 0) {
            throw new Error(
              `Estoque insuficiente para ${produto.nome}. Saldo atual: ${saldoAnterior}.`
            );
          }

          await tx.produto.update({
            where: { id: produto.id },
            data: {
              estoqueAtual: saldoAtual,
            },
          });

          await tx.estoqueMovimentacao.create({
            data: {
              empresaId: user.empresaId,
              produtoId: produto.id,
              tipo: "SAIDA",
              quantidade: qtd,
              saldoAnterior,
              saldoAtual,
              observacao: `Saída automática da comanda #${comanda.numeroSequencial}`,
            },
          });
        }
      }

      const pagamentosNaoFiado = comanda.pagamentos.filter(
        (p: any) => p.metodo !== "FIADO"
      );
      const pagamentosFiado = comanda.pagamentos.filter(
        (p: any) => p.metodo === "FIADO"
      );

      for (const pagamento of pagamentosNaoFiado) {
        await tx.caixaMovimento.create({
          data: {
            empresaId: user.empresaId,
            tipo: "ENTRADA",
            categoria: "COMANDA",
            descricao: `Recebimento da comanda #${comanda.numeroSequencial}`,
            valor: money2(toNumber(pagamento.valor)),
            formaPagamento: pagamento.metodo as any,
            referenciaTipo: "COMANDA",
            referenciaId: comanda.id,
            usuarioId: user.id,
          },
        });
      }

      if (pagamentosFiado.length) {
        const valorFiado = money2(
          pagamentosFiado.reduce((acc: number, p: any) => acc + toNumber(p.valor), 0)
        );

        await tx.contaReceber.create({
          data: {
            empresaId: user.empresaId,
            clienteId: comanda.clienteId || null,
            descricao: `Fiado da comanda #${comanda.numeroSequencial}`,
            valorOriginal: valorFiado,
            valorAberto: valorFiado,
            status: "ABERTA",
            origemTipo: "COMANDA",
            origemId: comanda.id,
          },
        });
      }

      await tx.comanda.update({
        where: { id: comanda.id },
        data: {
          status: "FECHADA",
          fechadaEm: new Date(),
          fechadaPorUsuarioId: user.id,
        },
      });

      if (comanda.agendamento?.id) {
        await tx.agendamento.update({
          where: { id: comanda.agendamento.id },
          data: {
            status: "CONCLUIDO",
          },
        });
      }
    });

    revalidatePath(`/comandas/${comandaId}`);
    revalidatePath("/agenda");
    revalidatePath("/estoque");
    revalidatePath("/caixa");
    revalidatePath("/contas-receber");
    redirect(`/comandas/${comandaId}?ok=finalizada`);
  } catch (error: any) {
    rethrowIfRedirectError(error);
    redirect(
      buildErrorUrl(
        `/comandas/${comandaId}`,
        error?.message || "Erro ao finalizar comanda."
      )
    );
  }
}