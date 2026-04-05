"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { OrigemAgendamento, StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BookingState = {
  ok: boolean;
  message: string;
};

function getStr(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLocalDateTime(data: string, hora: string) {
  const [y, m, d] = data.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && startB < endA;
}

export async function criarAgendamentoSiteAction(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: { ativo: true },
      orderBy: { createdAt: "asc" },
      include: {
        agendamentoOnlineConfig: true,
      },
    });

    if (!empresa) {
      return { ok: false, message: "Empresa não encontrada." };
    }

    const nome = getStr(formData.get("nome"));
    const telefone = getStr(formData.get("telefone"));
    const email = getStr(formData.get("email"));
    const profissionalId = getStr(formData.get("profissionalId"));
    const data = getStr(formData.get("data"));
    const hora = getStr(formData.get("hora"));
    const observacoes = getStr(formData.get("observacoes"));
    const login = getStr(formData.get("login"));
    const senha = getStr(formData.get("senha"));
    const confirmarSenha = getStr(formData.get("confirmarSenha"));

    const servicoIds = formData
      .getAll("servicoIds")
      .map((v) => String(v).trim())
      .filter(Boolean);

    if (!nome || !telefone || !profissionalId || !data || !hora || servicoIds.length === 0) {
      return {
        ok: false,
        message:
          "Preencha nome, telefone, profissional, data, horário e selecione ao menos um serviço.",
      };
    }

    // Validar campos de login
    if (login && !senha) {
      return {
        ok: false,
        message: "Informe a senha para criar o login.",
      };
    }

    if (login && senha !== confirmarSenha) {
      return {
        ok: false,
        message: "As senhas não coincidem.",
      };
    }

    if (login && senha.length < 4) {
      return {
        ok: false,
        message: "A senha deve ter pelo menos 4 caracteres.",
      };
    }

    const profissional = await prisma.profissional.findFirst({
      where: {
        id: profissionalId,
        empresaId: empresa.id,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!profissional) {
      return { ok: false, message: "Profissional não encontrado." };
    }

    const servicos = await prisma.servico.findMany({
      where: {
        id: { in: servicoIds },
        empresaId: empresa.id,
        ativo: true,
        exibirNoSite: true,
      },
      select: {
        id: true,
        nome: true,
        duracaoMin: true,
        preco: true,
        comissaoPercentualPadrao: true,
      },
    });

    if (servicos.length !== servicoIds.length) {
      return {
        ok: false,
        message: "Um ou mais serviços selecionados não estão disponíveis.",
      };
    }

    const relacoesProfissional = await prisma.profissionalServico.findMany({
      where: {
        profissionalId,
        ativo: true,
      },
      select: {
        servicoId: true,
        duracaoMinOverride: true,
        valorOverride: true,
        comissaoPercentualOverride: true,
      },
    });

    const profissionalTemServicosConfigurados = relacoesProfissional.length > 0;
    const relacaoMap = new Map(
      relacoesProfissional.map((r) => [r.servicoId, r])
    );

    if (profissionalTemServicosConfigurados) {
      const invalido = servicoIds.some((id) => !relacaoMap.has(id));
      if (invalido) {
        return {
          ok: false,
          message: "Esse profissional não atende um ou mais serviços selecionados.",
        };
      }
    }

    const servicosOrdenados = servicoIds
      .map((id) => servicos.find((s) => s.id === id))
      .filter(Boolean)
      .map((servico) => {
        const relacao = relacaoMap.get(servico!.id);

        return {
          id: servico!.id,
          nome: servico!.nome,
          duracaoMin: relacao?.duracaoMinOverride ?? servico!.duracaoMin,
          valor: relacao?.valorOverride ?? servico!.preco,
          comissao:
            relacao?.comissaoPercentualOverride ??
            servico!.comissaoPercentualPadrao,
        };
      });

    const duracaoTotal = servicosOrdenados.reduce(
      (acc, item) => acc + item.duracaoMin,
      0
    );

    const inicio = parseLocalDateTime(data, hora);
    const fim = addMinutes(inicio, duracaoTotal);

    const [conflitoAgendamento, conflitoBloqueio] = await Promise.all([
      prisma.agendamento.findFirst({
        where: {
          empresaId: empresa.id,
          profissionalId,
          status: {
            notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.FALTOU],
          },
          AND: [{ inicio: { lt: fim } }, { fim: { gt: inicio } }],
        },
        select: {
          id: true,
          inicio: true,
          fim: true,
        },
      }),
      prisma.bloqueioAgenda.findFirst({
        where: {
          empresaId: empresa.id,
          profissionalId,
          ativo: true,
          AND: [{ dataInicio: { lt: fim } }, { dataFim: { gt: inicio } }],
        },
        select: {
          id: true,
          dataInicio: true,
          dataFim: true,
        },
      }),
    ]);

    if (conflitoAgendamento) {
      return {
        ok: false,
        message:
          "Esse horário já está ocupado na agenda do sistema. Escolha outro horário.",
      };
    }

    if (conflitoBloqueio) {
      return {
        ok: false,
        message: "Esse horário está bloqueado na agenda.",
      };
    }

    const telefoneLimpo = telefone.replace(/\D+/g, "");

    let cliente = await prisma.cliente.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          { telefone: telefone },
          { telefone: telefoneLimpo },
          { whatsapp: telefone },
          { whatsapp: telefoneLimpo },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nome,
          telefone: telefoneLimpo || telefone,
          whatsapp: telefoneLimpo || telefone,
          email: email || null,
          origemCadastro: "SITE",
          ativo: true,
        },
      });
    }

    // Criar/atualizar ClienteAcesso se houver login
    if (login) {
      const loginLimpo = login.toLowerCase();
      
      // Verificar se o login já existe em outro cliente
      const acessoExistente = await prisma.clienteAcesso.findFirst({
        where: {
          empresaId: empresa.id,
          login: loginLimpo,
          NOT: {
            clienteId: cliente.id,
          },
        },
      });

      if (acessoExistente) {
        return {
          ok: false,
          message: "Esse login já está em uso. Escolha outro.",
        };
      }

      // Criar ou atualizar o acesso do cliente
      const senhaCriptografada = bcrypt.hashSync(senha, 10);
      
      const acessoDoCliente = await prisma.clienteAcesso.findFirst({
        where: {
          clienteId: cliente.id,
          empresaId: empresa.id,
        },
      });

      if (acessoDoCliente) {
        // Atualizar login existente
        await prisma.clienteAcesso.update({
          where: { id: acessoDoCliente.id },
          data: {
            login: loginLimpo,
            senhaHash: senhaCriptografada,
          },
        });
      } else {
        // Criar novo login
        await prisma.clienteAcesso.create({
          data: {
            empresaId: empresa.id,
            clienteId: cliente.id,
            login: loginLimpo,
            senhaHash: senhaCriptografada,
          },
        });
      }
    }

    await prisma.agendamento.create({
      data: {
        empresaId: empresa.id,
        clienteId: cliente.id,
        profissionalId,
        inicio,
        fim,
        origem: OrigemAgendamento.SITE,
        status: empresa.agendamentoOnlineConfig?.exigeConfirmacao
          ? StatusAgendamento.AGENDADO
          : StatusAgendamento.CONFIRMADO,
        observacoes: observacoes
          ? `[SITE] ${observacoes}`
          : "[SITE] Agendamento online",
        servicos: {
          create: servicosOrdenados.map((servico, index) => ({
            servicoId: servico.id,
            nomeSnapshot: servico.nome,
            duracaoMinSnapshot: servico.duracaoMin,
            valorSnapshot: servico.valor,
            comissaoPercentualSnapshot: servico.comissao,
            ordem: index,
          })),
        },
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/agendar");
    revalidatePath("/cliente/agenda");

    return {
      ok: true,
      message: empresa.agendamentoOnlineConfig?.exigeConfirmacao
        ? "Agendamento enviado com sucesso. Aguarde a confirmação."
        : "Agendamento realizado com sucesso.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível concluir o agendamento.",
    };
  }
}