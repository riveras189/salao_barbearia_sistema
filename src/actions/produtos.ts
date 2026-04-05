"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveProdutoImage } from "@/lib/saveProdutoImage";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getInt(formData: FormData, key: string, fallback = 0) {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function getDecimalString(
  formData: FormData,
  key: string,
  fallback = "0.00"
) {
  let raw = String(formData.get(key) ?? "").trim();
  if (!raw) return fallback;

  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;

  return value.toFixed(2);
}

function buildErrorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function buildMovimentacaoObservacao(
  tipo: string,
  finalidade: string,
  observacao: string
) {
  let prefixo = "";

  if (tipo === "ENTRADA") {
    if (finalidade === "COMPRA") prefixo = "Entrada por compra";
    else if (finalidade === "AJUSTE") prefixo = "Entrada por ajuste";
    else prefixo = "Entrada manual";
  }

  if (tipo === "SAIDA") {
    if (finalidade === "VENDA") prefixo = "Saída para venda";
    else if (finalidade === "USO_INTERNO") prefixo = "Saída para uso interno";
    else if (finalidade === "PERDA") prefixo = "Saída por perda/quebra";
    else if (finalidade === "AJUSTE") prefixo = "Saída por ajuste";
    else prefixo = "Saída manual";
  }

  if (!observacao) return prefixo || null;
  if (!prefixo) return observacao;

  return `${prefixo} - ${observacao}`;
}

export async function createProdutoAction(formData: FormData) {
  const user = await requireUser();

  const nome = getString(formData, "nome");
  if (!nome) {
    redirect(buildErrorUrl("/produtos/novo", "Informe o nome do produto."));
  }

  const fotoUrlManual = getString(formData, "fotoUrl");
  let fotoUrl = fotoUrlManual || null;

  const fotoFile = formData.get("fotoFile");
  if (fotoFile instanceof File && fotoFile.size > 0) {
    const uploaded = await saveProdutoImage(fotoFile);
    if (!uploaded.ok) {
      redirect(buildErrorUrl("/produtos/novo", uploaded.error));
    }
    fotoUrl = uploaded.url;
  }

  const produtoCreateResult = await prisma.produto.create({
    data: {
      empresaId: user.empresaId,
      nome,
      descricao: getString(formData, "descricao") || null,
      marca: getString(formData, "marca") || null,
      codigoBarras: getString(formData, "codigoBarras") || null,
      unidade: getString(formData, "unidade") || "UN",
      custo: getDecimalString(formData, "custo"),
      preco: getDecimalString(formData, "preco") || "0.00",
      estoqueAtual: getInt(formData, "estoqueAtual", 0),
      estoqueMinimo: getInt(formData, "estoqueMinimo", 0),
      fotoUrl,
      ativo: formData.get("ativo") === "on",
    },
  });

  // Update comissao separately
  const comissaoValue = getDecimalString(formData, "comissao");
  if (comissaoValue) {
    await prisma.produto.update({
      where: { id: produtoCreateResult.id },
      data: {
        comissao: comissaoValue,
      },
    });
  }

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  redirect("/produtos?ok=created");
}

export async function updateProdutoAction(formData: FormData) {
  const user = await requireUser();

  const produtoId = getString(formData, "produtoId");
  if (!produtoId) {
    redirect(buildErrorUrl("/produtos", "Produto inválido."));
  }

  const produto = await prisma.produto.findFirst({
    where: {
      id: produtoId,
      empresaId: user.empresaId,
    },
  });

  if (!produto) {
    redirect(buildErrorUrl("/produtos", "Produto não encontrado."));
  }

  const nome = getString(formData, "nome");
  if (!nome) {
    redirect(
      buildErrorUrl(`/produtos/${produtoId}/editar`, "Informe o nome do produto.")
    );
  }

  let fotoUrl = getString(formData, "fotoAtualUrl") || null;
  const fotoUrlManual = getString(formData, "fotoUrl");
  if (fotoUrlManual) fotoUrl = fotoUrlManual;

  const fotoFile = formData.get("fotoFile");
  if (fotoFile instanceof File && fotoFile.size > 0) {
    const uploaded = await saveProdutoImage(fotoFile);
    if (!uploaded.ok) {
      redirect(buildErrorUrl(`/produtos/${produtoId}/editar`, uploaded.error));
    }
    fotoUrl = uploaded.url;
  }

  await prisma.produto.update({
    where: { id: produto.id },
    data: {
      nome,
      descricao: getString(formData, "descricao") || null,
      marca: getString(formData, "marca") || null,
      codigoBarras: getString(formData, "codigoBarras") || null,
      unidade: getString(formData, "unidade") || "UN",
      custo: getDecimalString(formData, "custo"),
      preco: getDecimalString(formData, "preco") || "0.00",
      estoqueAtual: getInt(formData, "estoqueAtual", produto.estoqueAtual),
      estoqueMinimo: getInt(formData, "estoqueMinimo", produto.estoqueMinimo),
      fotoUrl,
      ativo: formData.get("ativo") === "on",
    },
  });

  // Update comissao separately with safer handling
  const comissaoValue = getDecimalString(formData, "comissao");
  if (comissaoValue) {
    await prisma.produto.update({
      where: { id: produto.id },
      data: {
        comissao: comissaoValue,
      },
    });
  }

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  redirect("/produtos?ok=updated");
}

export async function registrarMovimentoEstoqueAction(formData: FormData) {
  const user = await requireUser();

  const produtoId = getString(formData, "produtoId");
  const tipo = getString(formData, "tipo");
  const finalidade = getString(formData, "finalidade");
  const quantidade = getInt(formData, "quantidade", 0);
  const observacao = getString(formData, "observacao");

  if (!produtoId) {
    redirect(buildErrorUrl("/estoque", "Selecione o produto."));
  }

  if (!["ENTRADA", "SAIDA"].includes(tipo)) {
    redirect(buildErrorUrl("/estoque", "Tipo de movimentação inválido."));
  }

  if (quantidade <= 0) {
    redirect(buildErrorUrl("/estoque", "A quantidade deve ser maior que zero."));
  }

  const produto = await prisma.produto.findFirst({
    where: {
      id: produtoId,
      empresaId: user.empresaId,
    },
  });

  if (!produto) {
    redirect(buildErrorUrl("/estoque", "Produto não encontrado."));
  }

  const saldoAnterior = produto.estoqueAtual;
  const saldoAtual =
    tipo === "ENTRADA"
      ? saldoAnterior + quantidade
      : saldoAnterior - quantidade;

  if (saldoAtual < 0) {
    redirect(
      buildErrorUrl(
        "/estoque",
        `Estoque insuficiente para saída. Saldo atual: ${saldoAnterior}.`
      )
    );
  }

  const observacaoFinal = buildMovimentacaoObservacao(
    tipo,
    finalidade,
    observacao
  );

  await prisma.$transaction([
    prisma.produto.update({
      where: { id: produto.id },
      data: {
        estoqueAtual: saldoAtual,
      },
    }),
    prisma.estoqueMovimentacao.create({
      data: {
        empresaId: user.empresaId,
        produtoId: produto.id,
        tipo: tipo as any,
        quantidade,
        saldoAnterior,
        saldoAtual,
        observacao: observacaoFinal,
      },
    }),
  ]);

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  redirect("/estoque?ok=mov");
}

export async function excluirMovimentoEstoqueAction(formData: FormData) {
  const user = await requireUser();

  const movimentoId = getString(formData, "movimentoId");
  if (!movimentoId) {
    redirect(buildErrorUrl("/estoque", "Movimentação inválida."));
  }

  const movimento = await prisma.estoqueMovimentacao.findFirst({
    where: {
      id: movimentoId,
      empresaId: user.empresaId,
    },
    include: {
      produto: true,
    },
  });

  if (!movimento) {
    redirect(buildErrorUrl("/estoque", "Movimentação não encontrada."));
  }

  const produto = movimento.produto;
  if (!produto) {
    redirect(buildErrorUrl("/estoque", "Produto da movimentação não encontrado."));
  }

  let novoSaldo = produto.estoqueAtual;

  if (movimento.tipo === "ENTRADA") {
    novoSaldo = produto.estoqueAtual - movimento.quantidade;
  } else if (movimento.tipo === "SAIDA") {
    novoSaldo = produto.estoqueAtual + movimento.quantidade;
  }

  if (novoSaldo < 0) {
    redirect(
      buildErrorUrl(
        "/estoque",
        "Não é possível excluir essa movimentação porque o estoque atual ficaria negativo."
      )
    );
  }

  await prisma.$transaction([
    prisma.produto.update({
      where: { id: produto.id },
      data: {
        estoqueAtual: novoSaldo,
      },
    }),
    prisma.estoqueMovimentacao.delete({
      where: { id: movimento.id },
    }),
  ]);

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  redirect("/estoque?ok=deleted");
}