import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function toNumber(value: unknown) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money2(value: number) {
  return Number(value.toFixed(2));
}

export default async function AbrirComandaPorAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const agendamento = await prisma.agendamento.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
    },
    include: {
      servicos: {
        orderBy: {
          ordem: "asc",
        },
      },
    },
  });

  if (!agendamento) notFound();

  if (agendamento.comandaId) {
    redirect(`/comandas/${agendamento.comandaId}`);
  }

  const criada = await prisma.$transaction(async (tx) => {
    const ultima = await tx.comanda.findFirst({
      where: {
        empresaId: user.empresaId,
      },
      orderBy: {
        numeroSequencial: "desc",
      },
      select: {
        numeroSequencial: true,
      },
    });

    const numeroSequencial = (ultima?.numeroSequencial ?? 0) + 1;

    const subtotalServicos = money2(
      agendamento.servicos.reduce(
        (acc, item) => acc + toNumber(item.valorSnapshot),
        0
      )
    );

    const comanda = await tx.comanda.create({
      data: {
        empresaId: user.empresaId,
        numeroSequencial,
        clienteId: agendamento.clienteId,
        profissionalPrincipalId: agendamento.profissionalId,
        agendamentoId: agendamento.id,
        status: "ABERTA" as any,
        subtotalServicos,
        subtotalProdutos: 0,
        descontoValor: 0,
        acrescimoValor: 0,
        total: subtotalServicos,
        abertaPorUsuarioId: user.id,
      },
    });

    for (const servico of agendamento.servicos) {
      const valorUnitario = money2(toNumber(servico.valorSnapshot));
      const quantidade = 1;
      const valorTotal = money2(valorUnitario * quantidade);
      const comissaoPercentual = money2(
        toNumber(servico.comissaoPercentualSnapshot)
      );
      const valorComissao = money2(
        (valorTotal * comissaoPercentual) / 100
      );

      await tx.comandaItem.create({
        data: {
          comandaId: comanda.id,
          tipo: "SERVICO" as any,
          servicoId: servico.servicoId,
          profissionalId: agendamento.profissionalId,
          descricao: servico.nomeSnapshot,
          quantidade,
          valorUnitario,
          valorTotal,
          comissaoPercentual,
          valorComissao,
        },
      });
    }

    await tx.agendamento.update({
      where: { id: agendamento.id },
      data: {
        comandaId: comanda.id,
        status: "EM_ATENDIMENTO" as any,
      },
    });

    return comanda;
  });

  redirect(`/comandas/${criada.id}`);
}