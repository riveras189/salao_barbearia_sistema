"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PanelBackButton from "@/components/PanelBackButton";
import {
  CategoriaCaixaMovimento,
  FormaPagamento,
  OrigemFinanceiraTipo,
  Prisma,
  StatusConta,
  TipoCaixaMovimento,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function toText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: FormDataEntryValue | null | undefined) {
  const v = toText(value);
  return v || null;
}

function toDecimal(
  value: FormDataEntryValue | string | number | null | undefined,
  label: string,
) {
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : value == null
          ? ""
          : String(value);

  const clean = raw.trim();
  if (!clean) {
    throw new Error(`${label} é obrigatório.`);
  }

  let normalized = clean.replace(/\s/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(",", ".");
  }

  const decimal = new Prisma.Decimal(normalized);

  if (decimal.lte(0)) {
    throw new Error(`${label} deve ser maior que zero.`);
  }

  return decimal;
}

function toDate(value: FormDataEntryValue | null | undefined) {
  const raw = toText(value);
  if (!raw) return null;

  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(raw);

  if (Number.isNaN(d.getTime())) {
    throw new Error("Data inválida.");
  }

  return d;
}

function toDateTime(value: FormDataEntryValue | null | undefined) {
  const raw = toText(value);
  if (!raw) return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Data inválida.");
  }

  return d;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calcStatusConta(
  valorOriginal: Prisma.Decimal,
  valorAberto: Prisma.Decimal,
  vencimento: Date | null,
): StatusConta {
  if (valorAberto.lte(0)) return StatusConta.PAGA;
  if (valorAberto.lt(valorOriginal)) return StatusConta.PARCIAL;
  if (vencimento && vencimento < startOfToday()) return StatusConta.VENCIDA;
  return StatusConta.ABERTA;
}

function parseFormaPagamento(
  value: FormDataEntryValue | null | undefined,
  options?: {
    required?: boolean;
    allowFiado?: boolean;
  },
) {
  const required = options?.required ?? true;
  const allowFiado = options?.allowFiado ?? true;

  const raw = toText(value);

  if (!raw) {
    if (!required) return null;
    throw new Error("Forma de pagamento é obrigatória.");
  }

  if (!Object.values(FormaPagamento).includes(raw as FormaPagamento)) {
    throw new Error("Forma de pagamento inválida.");
  }

  const metodo = raw as FormaPagamento;

  if (!allowFiado && metodo === FormaPagamento.FIADO) {
    throw new Error("FIADO não é permitido nesta operação.");
  }

  return metodo;
}

async function getAuth() {
  const user = await requireUser();

  if (!user?.id || !user?.empresaId) {
    throw new Error("Usuário não autenticado.");
  }

  return user;
}

function refreshFinanceiro() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro/contas-receber");
  revalidatePath("/financeiro/contas-pagar");
  revalidatePath("/caixa");
  revalidatePath("/comandas");
}

function go(path: string, params?: Record<string, string>) {
  const url = new URL(path, "http://localhost");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  redirect(`${url.pathname}${url.search}`);
}

export async function criarContaPagarAction(formData: FormData) {
  let redirectTo = "/financeiro/contas-pagar?ok=created";

  try {
    const user = await requireUser();

    if (!user?.id || !user?.empresaId) {
      redirectTo =
        "/financeiro/contas-pagar?erro=Usu%C3%A1rio%20n%C3%A3o%20autenticado";
    } else {
      const descricao = String(formData.get("descricao") ?? "").trim();
      const fornecedorId =
        String(formData.get("fornecedorId") ?? "").trim() || null;
      const vencimentoRaw = String(formData.get("vencimento") ?? "").trim();
      const valorRaw = String(formData.get("valorOriginal") ?? "").trim();

      if (!descricao) {
        redirectTo =
          "/financeiro/contas-pagar?erro=Informe%20a%20descri%C3%A7%C3%A3o";
      } else if (!valorRaw) {
        redirectTo = "/financeiro/contas-pagar?erro=Informe%20o%20valor";
      } else {
        let valorNormalizado = valorRaw.replace(/\s/g, "");

        if (valorNormalizado.includes(",") && valorNormalizado.includes(".")) {
          valorNormalizado = valorNormalizado
            .replace(/\./g, "")
            .replace(",", ".");
        } else {
          valorNormalizado = valorNormalizado.replace(",", ".");
        }

        const valorOriginal = new Prisma.Decimal(valorNormalizado);

        if (valorOriginal.lte(0)) {
          redirectTo =
            "/financeiro/contas-pagar?erro=O%20valor%20deve%20ser%20maior%20que%20zero";
        } else {
          let vencimento: Date | null = null;

          if (vencimentoRaw) {
            const data = /^\d{4}-\d{2}-\d{2}$/.test(vencimentoRaw)
              ? new Date(`${vencimentoRaw}T12:00:00`)
              : new Date(vencimentoRaw);

            if (Number.isNaN(data.getTime())) {
              redirectTo =
                "/financeiro/contas-pagar?erro=Data%20de%20vencimento%20inv%C3%A1lida";
            } else {
              vencimento = data;
            }
          }

          if (redirectTo === "/financeiro/contas-pagar?ok=created" && fornecedorId) {
            const fornecedor = await prisma.fornecedor.findFirst({
              where: {
                id: fornecedorId,
                empresaId: user.empresaId,
              },
              select: { id: true },
            });

            if (!fornecedor) {
              redirectTo =
                "/financeiro/contas-pagar?erro=Fornecedor%20inv%C3%A1lido";
            }
          }

          if (redirectTo === "/financeiro/contas-pagar?ok=created") {
            const hoje = new Date();
            const inicioHoje = new Date(
              hoje.getFullYear(),
              hoje.getMonth(),
              hoje.getDate(),
            );

            let status: StatusConta = StatusConta.ABERTA;
            if (vencimento && vencimento < inicioHoje) {
              status = StatusConta.VENCIDA;
            }

            await prisma.contaPagar.create({
              data: {
                empresaId: user.empresaId,
                fornecedorId,
                descricao,
                valorOriginal,
                valorAberto: valorOriginal,
                vencimento,
                status,
              },
            });

            revalidatePath("/financeiro");
            revalidatePath("/financeiro/contas-pagar");
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro ao criar conta a pagar:", error);

    const message =
      error instanceof Error ? error.message : "Erro ao lançar conta a pagar.";

    redirectTo = `/financeiro/contas-pagar?erro=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

export async function pagarContaPagarAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "paid" };

  try {
    const user = await getAuth();

    const contaPagarId = toText(formData.get("contaPagarId"));
    const valor = toDecimal(formData.get("valor"), "Valor pago");
    const metodo = parseFormaPagamento(formData.get("metodo"), {
      required: false,
      allowFiado: false,
    });
    const pagoEm = toDateTime(formData.get("pagoEm")) ?? new Date();
    const observacao = toNullableText(formData.get("observacao"));

    if (!contaPagarId) {
      throw new Error("Conta a pagar é obrigatória.");
    }

    await prisma.$transaction(async (tx) => {
      const conta = await tx.contaPagar.findFirst({
        where: {
          id: contaPagarId,
          empresaId: user.empresaId,
        },
      });

      if (!conta) {
        throw new Error("Conta a pagar não encontrada.");
      }

      const valorAbertoAtual = new Prisma.Decimal(conta.valorAberto);

      if (valor.gt(valorAbertoAtual)) {
        throw new Error("O valor pago não pode ser maior que o saldo aberto.");
      }

      const novoValorAberto = valorAbertoAtual.minus(valor);
      const novoStatus = calcStatusConta(
        new Prisma.Decimal(conta.valorOriginal),
        novoValorAberto,
        conta.vencimento,
      );

      await tx.contaPagarPagamento.create({
        data: {
          contaPagarId: conta.id,
          valor,
          pagoEm,
          metodo,
          usuarioId: user.id,
        },
      });

      await tx.contaPagar.update({
        where: { id: conta.id },
        data: {
          valorAberto: novoValorAberto,
          status: novoStatus,
        },
      });

      await tx.caixaMovimento.create({
        data: {
          empresaId: user.empresaId,
          tipo: TipoCaixaMovimento.SAIDA,
          categoria: CategoriaCaixaMovimento.DESPESA,
          descricao: observacao
            ? `Pagamento: ${conta.descricao} - ${observacao}`
            : `Pagamento: ${conta.descricao}`,
          valor,
          formaPagamento: metodo,
          referenciaTipo: "CONTA_PAGAR",
          referenciaId: conta.id,
          usuarioId: user.id,
          dataMovimento: pagoEm,
        },
      });
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao pagar conta a pagar:", error);
    redirectParams = {
      erro: error instanceof Error ? error.message : "Erro ao pagar conta.",
    };
  }

  go("/financeiro/contas-pagar", redirectParams);
}

export async function criarContaReceberAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "created" };

  try {
    const user = await getAuth();

    const descricao = toText(formData.get("descricao"));
    const clienteId = toNullableText(formData.get("clienteId"));
    const valorOriginal = toDecimal(formData.get("valorOriginal"), "Valor");
    const vencimento = toDate(formData.get("vencimento"));
    const origemTipo = toNullableText(formData.get("origemTipo"));
    const origemId = toNullableText(formData.get("origemId"));

    if (!descricao) {
      throw new Error("Descrição é obrigatória.");
    }

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: clienteId,
          empresaId: user.empresaId,
        },
        select: { id: true },
      });

      if (!cliente) {
        throw new Error("Cliente inválido.");
      }
    }

    const status = calcStatusConta(valorOriginal, valorOriginal, vencimento);

    const origemTipoEnum = origemTipo && Object.values(OrigemFinanceiraTipo).includes(origemTipo as OrigemFinanceiraTipo) ? (origemTipo as OrigemFinanceiraTipo) : null;

    await prisma.contaReceber.create({
      data: {
        empresaId: user.empresaId,
        clienteId,
        descricao,
        valorOriginal,
        valorAberto: valorOriginal,
        vencimento,
        status,
        origemTipo: origemTipoEnum,
        origemId,
      },
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao criar conta a receber:", error);
    redirectParams = {
      erro:
        error instanceof Error
          ? error.message
          : "Erro ao lançar conta a receber.",
    };
  }

  go("/financeiro/contas-receber", redirectParams);
}

export async function receberContaReceberAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "paid" };

  try {
    const user = await getAuth();

    const contaReceberId = toText(formData.get("contaReceberId"));
    const valor = toDecimal(formData.get("valor"), "Valor recebido");
    const metodo = parseFormaPagamento(formData.get("metodo"), {
      allowFiado: false,
    });
    const pagoEm = toDateTime(formData.get("pagoEm")) ?? new Date();
    const observacao = toNullableText(formData.get("observacao"));

    if (!contaReceberId) {
      throw new Error("Conta a receber é obrigatória.");
    }

    await prisma.$transaction(async (tx) => {
      const conta = await tx.contaReceber.findFirst({
        where: {
          id: contaReceberId,
          empresaId: user.empresaId,
        },
      });

      if (!conta) {
        throw new Error("Conta a receber não encontrada.");
      }

      const valorAbertoAtual = new Prisma.Decimal(conta.valorAberto);

      if (valor.gt(valorAbertoAtual)) {
        throw new Error("O valor recebido não pode ser maior que o saldo aberto.");
      }

      const novoValorAberto = valorAbertoAtual.minus(valor);
      const novoStatus = calcStatusConta(
        new Prisma.Decimal(conta.valorOriginal),
        novoValorAberto,
        conta.vencimento,
      );

      await tx.contaReceberPagamento.create({
        data: {
          contaReceberId: conta.id,
          valor,
          metodo: metodo!,
          pagoEm,
          usuarioId: user.id,
        },
      });

      await tx.contaReceber.update({
        where: { id: conta.id },
        data: {
          valorAberto: novoValorAberto,
          status: novoStatus,
        },
      });

      await tx.caixaMovimento.create({
        data: {
          empresaId: user.empresaId,
          tipo: TipoCaixaMovimento.ENTRADA,
          categoria: CategoriaCaixaMovimento.CONTA_RECEBER,
          descricao: observacao
            ? `Recebimento: ${conta.descricao} - ${observacao}`
            : `Recebimento: ${conta.descricao}`,
          valor,
          formaPagamento: metodo!,
          referenciaTipo: "CONTA_RECEBER",
          referenciaId: conta.id,
          usuarioId: user.id,
          dataMovimento: pagoEm,
        },
      });
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao receber conta a receber:", error);
    redirectParams = {
      erro:
        error instanceof Error ? error.message : "Erro ao receber conta.",
    };
  }

  go("/financeiro/contas-receber", redirectParams);
}

export async function lancarSangriaAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "sangria" };

  try {
    const user = await getAuth();

    const valor = toDecimal(formData.get("valor"), "Valor");
    const descricao = toText(formData.get("descricao")) || "Sangria de caixa";
    const formaPagamento =
      parseFormaPagamento(formData.get("formaPagamento"), {
        required: false,
        allowFiado: false,
      }) ?? FormaPagamento.DINHEIRO;
    const dataMovimento = toDateTime(formData.get("dataMovimento")) ?? new Date();

    await prisma.caixaMovimento.create({
      data: {
        empresaId: user.empresaId,
        tipo: TipoCaixaMovimento.SAIDA,
        categoria: CategoriaCaixaMovimento.SANGRIA,
        descricao,
        valor,
        formaPagamento,
        referenciaTipo: null,
        referenciaId: null,
        usuarioId: user.id,
        dataMovimento,
      },
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao lançar sangria:", error);
    redirectParams = {
      erro: error instanceof Error ? error.message : "Erro ao lançar sangria.",
    };
  }

  go("/financeiro/caixa", redirectParams);
}

export async function lancarSuprimentoAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "suprimento" };

  try {
    const user = await getAuth();

    const valor = toDecimal(formData.get("valor"), "Valor");
    const descricao =
      toText(formData.get("descricao")) || "Suprimento de caixa";
    const formaPagamento =
      parseFormaPagamento(formData.get("formaPagamento"), {
        required: false,
        allowFiado: false,
      }) ?? FormaPagamento.DINHEIRO;
    const dataMovimento = toDateTime(formData.get("dataMovimento")) ?? new Date();

    await prisma.caixaMovimento.create({
      data: {
        empresaId: user.empresaId,
        tipo: TipoCaixaMovimento.ENTRADA,
        categoria: CategoriaCaixaMovimento.SUPRIMENTO,
        descricao,
        valor,
        formaPagamento,
        referenciaTipo: null,
        referenciaId: null,
        usuarioId: user.id,
        dataMovimento,
      },
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao lançar suprimento:", error);
    redirectParams = {
      erro:
        error instanceof Error ? error.message : "Erro ao lançar suprimento.",
    };
  }

  go("/financeiro/caixa", redirectParams);
}

export async function estornarMovimentoCaixaAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "estornado" };

  try {
    const user = await getAuth();

    const movimentoId = toText(formData.get("movimentoId"));
    const motivo = toNullableText(formData.get("motivo"));

    if (!movimentoId) {
      throw new Error("Movimento é obrigatório.");
    }

    await prisma.$transaction(async (tx) => {
      const movimento = await tx.caixaMovimento.findFirst({
        where: {
          id: movimentoId,
          empresaId: user.empresaId,
        },
      });

      if (!movimento) {
        throw new Error("Movimento não encontrado.");
      }

      await tx.caixaMovimento.create({
        data: {
          empresaId: user.empresaId,
          tipo:
            movimento.tipo === TipoCaixaMovimento.ENTRADA
              ? TipoCaixaMovimento.SAIDA
              : TipoCaixaMovimento.ENTRADA,
          categoria: CategoriaCaixaMovimento.ESTORNO,
          descricao: motivo
            ? `Estorno de "${movimento.descricao}" - ${motivo}`
            : `Estorno de "${movimento.descricao}"`,
          valor: movimento.valor,
          formaPagamento: movimento.formaPagamento,
          referenciaTipo: null,
          referenciaId: movimento.id,
          usuarioId: user.id,
          dataMovimento: new Date(),
        },
      });
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao estornar movimento:", error);
    redirectParams = {
      erro: error instanceof Error ? error.message : "Erro ao estornar movimento.",
    };
  }

  go("/financeiro/caixa", redirectParams);
}

export async function atualizarContasVencidasAction() {
  let redirectParams: Record<string, string> = { ok: "updated" };

  try {
    const user = await getAuth();
    const hoje = startOfToday();

    await prisma.$transaction(async (tx) => {
      await tx.contaReceber.updateMany({
        where: {
          empresaId: user.empresaId,
          status: StatusConta.ABERTA,
          vencimento: { lt: hoje },
          valorAberto: { gt: 0 },
        },
        data: {
          status: StatusConta.VENCIDA,
        },
      });

      await tx.contaPagar.updateMany({
        where: {
          empresaId: user.empresaId,
          status: StatusConta.ABERTA,
          vencimento: { lt: hoje },
          valorAberto: { gt: 0 },
        },
        data: {
          status: StatusConta.VENCIDA,
        },
      });
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao atualizar contas vencidas:", error);
    redirectParams = {
      erro:
        error instanceof Error ? error.message : "Erro ao atualizar vencidas.",
    };
  }

  go("/financeiro", redirectParams);
}

export async function getResumoFinanceiro(params?: {
  de?: string | null;
  ate?: string | null;
}) {
  const user = await getAuth();

  const de = params?.de ? new Date(`${params.de}T00:00:00`) : null;
  const ate = params?.ate ? new Date(`${params.ate}T23:59:59.999`) : null;

  const whereCaixa: Prisma.CaixaMovimentoWhereInput = {
    empresaId: user.empresaId,
    ...(de || ate
      ? {
        dataMovimento: {
          ...(de ? { gte: de } : {}),
          ...(ate ? { lte: ate } : {}),
        },
      }
      : {}),
  };

  const [
    entradas,
    saidas,
    receberAberto,
    pagarAberto,
    receberVencido,
    pagarVencido,
  ] = await Promise.all([
    prisma.caixaMovimento.aggregate({
      where: {
        ...whereCaixa,
        tipo: TipoCaixaMovimento.ENTRADA,
      },
      _sum: { valor: true },
    }),
    prisma.caixaMovimento.aggregate({
      where: {
        ...whereCaixa,
        tipo: TipoCaixaMovimento.SAIDA,
      },
      _sum: { valor: true },
    }),
    prisma.contaReceber.aggregate({
      where: {
        empresaId: user.empresaId,
        status: {
          in: [StatusConta.ABERTA, StatusConta.PARCIAL, StatusConta.VENCIDA],
        },
      },
      _sum: { valorAberto: true },
    }),
    prisma.contaPagar.aggregate({
      where: {
        empresaId: user.empresaId,
        status: {
          in: [StatusConta.ABERTA, StatusConta.PARCIAL, StatusConta.VENCIDA],
        },
      },
      _sum: { valorAberto: true },
    }),
    prisma.contaReceber.aggregate({
      where: {
        empresaId: user.empresaId,
        status: StatusConta.VENCIDA,
      },
      _sum: { valorAberto: true },
    }),
    prisma.contaPagar.aggregate({
      where: {
        empresaId: user.empresaId,
        status: StatusConta.VENCIDA,
      },
      _sum: { valorAberto: true },
    }),
  ]);

  const totalEntradas = new Prisma.Decimal(entradas._sum.valor ?? 0);
  const totalSaidas = new Prisma.Decimal(saidas._sum.valor ?? 0);

  return {
    entradas: totalEntradas,
    saidas: totalSaidas,
    saldo: totalEntradas.minus(totalSaidas),
    contasReceberAberto: new Prisma.Decimal(receberAberto._sum.valorAberto ?? 0),
    contasPagarAberto: new Prisma.Decimal(pagarAberto._sum.valorAberto ?? 0),
    contasReceberVencido: new Prisma.Decimal(receberVencido._sum.valorAberto ?? 0),
    contasPagarVencido: new Prisma.Decimal(pagarVencido._sum.valorAberto ?? 0),
  };
}
/**
 * Calcula o saldo atual do caixa de uma empresa para uma data específica
 * @param empresaId ID da empresa
 * @param ate Data limite para calcular o saldo (padrão: agora)
 */
export async function obterSaldoCaixaAction(
  empresaId: string,
  ate?: Date,
) {
  try {
    const dataLimite = ate || new Date();

    const [entradas, saidas] = await prisma.$transaction([
      prisma.caixaMovimento.aggregate({
        where: {
          empresaId,
          tipo: TipoCaixaMovimento.ENTRADA,
          dataMovimento: { lte: dataLimite },
        },
        _sum: { valor: true },
      }),
      prisma.caixaMovimento.aggregate({
        where: {
          empresaId,
          tipo: TipoCaixaMovimento.SAIDA,
          dataMovimento: { lte: dataLimite },
        },
        _sum: { valor: true },
      }),
    ]);

    const totalEntradas = new Prisma.Decimal(entradas._sum.valor ?? 0);
    const totalSaidas = new Prisma.Decimal(saidas._sum.valor ?? 0);
    const saldo = totalEntradas.minus(totalSaidas);

    return {
      totalEntradas,
      totalSaidas,
      saldo,
    };
  } catch (error) {
    console.error("Erro ao calcular saldo do caixa:", error);
    throw error;
  }
}

/**
 * Verifica se existe caixa aberto para hoje, se não abre automaticamente
 */
export async function verificarEAbrirCaixaSePrecisoAction(empresaId: string) {
  try {
    const hoje = startOfToday();

    // Verifica se já existe um caixa aberto para hoje
    const caixaAberto = await prisma.caixaFechamento.findFirst({
      where: {
        empresaId,
        dataAbertura: {
          gte: hoje,
          lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (caixaAberto) {
      return caixaAberto;
    }

    // Se não há caixa aberto, calcula o saldo inicial
    const saldoAtual = await obterSaldoCaixaAction(
      empresaId,
      new Date(hoje.getTime() - 1),
    );

    // Abre novo caixa
    const novoCaixa = await prisma.caixaFechamento.create({
      data: {
        empresaId,
        dataAbertura: new Date(),
        saldoAbertura: saldoAtual.saldo,
        descricao: `Abertura automática de caixa - ${new Date().toLocaleDateString("pt-BR")}`,
      },
    });

    return novoCaixa;
  } catch (error) {
    console.error("Erro ao verificar/abrir caixa:", error);
    throw error;
  }
}

/**
 * Fecha o caixa automaticamente ao final do dia (função interna, não é server action)
 */
export async function fecharCaixaAutomaticoFn(
  empresaId: string,
  usuarioId?: string,
) {
  try {
    const hoje = startOfToday();

    // Busca o caixa aberto para hoje
    const caixaAberto = await prisma.caixaFechamento.findFirst({
      where: {
        empresaId,
        dataAbertura: {
          gte: hoje,
          lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000),
        },
        dataFechamento: null, // Ainda não foi fechado
      },
    });

    if (!caixaAberto) {
      throw new Error(
        "Não há caixa aberto para hoje. Abra o caixa primeiro.",
      );
    }

    // Calcula o saldo final do caixa
    const saldoFinal = await obterSaldoCaixaAction(empresaId);

    // Fecha o caixa
    const caixaFechado = await prisma.caixaFechamento.update({
      where: { id: caixaAberto.id },
      data: {
        dataFechamento: new Date(),
        saldoFechamento: saldoFinal.saldo,
        usuarioFechamentoId: usuarioId || undefined,
      },
    });

    return caixaFechado;
  } catch (error) {
    console.error("Erro ao fechar caixa:", error);
    throw error;
  }
}

/**
 * Abre o caixa manualmente com suprimento inicial
 */
export async function abrirCaixaManualmenteAction(formData: FormData) {
  let redirectParams: Record<string, string> = { ok: "caixa_aberto" };

  try {
    const user = await getAuth();
    const hoje = startOfToday();

    // Verifica se já existe um caixa aberto para hoje
    const caixaExistente = await prisma.caixaFechamento.findFirst({
      where: {
        empresaId: user.empresaId,
        dataAbertura: {
          gte: hoje,
          lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (caixaExistente && !caixaExistente.dataFechamento) {
      throw new Error("Caixa já está aberto para hoje.");
    }

    const saldoAbertura = toDecimal(
      formData.get("saldoAbertura"),
      "Saldo de abertura",
    );
    const descricao =
      toText(formData.get("descricao")) ||
      `Abertura manual de caixa - ${new Date().toLocaleDateString("pt-BR")}`;

    // Cria um suprimento para registrar o saldo de abertura
    await prisma.caixaMovimento.create({
      data: {
        empresaId: user.empresaId,
        tipo: TipoCaixaMovimento.ENTRADA,
        categoria: CategoriaCaixaMovimento.SUPRIMENTO,
        descricao: `Suprimento de abertura - ${descricao}`,
        valor: saldoAbertura,
        formaPagamento: FormaPagamento.DINHEIRO,
        usuarioId: user.id,
        dataMovimento: new Date(),
      },
    });

    // Abre o caixa
    await prisma.caixaFechamento.create({
      data: {
        empresaId: user.empresaId,
        usuarioAberturaId: user.id,
        dataAbertura: new Date(),
        saldoAbertura,
        descricao,
      },
    });

    refreshFinanceiro();
  } catch (error) {
    console.error("Erro ao abrir caixa:", error);
    redirectParams = {
      erro: error instanceof Error ? error.message : "Erro ao abrir caixa.",
    };
  }

  go("/financeiro/caixa", redirectParams);
}