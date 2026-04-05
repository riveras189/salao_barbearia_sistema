"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toNullable(value: string) {
  return value ? value : null;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeColor(value: string, fallback: string) {
  const v = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

function getImageExtension(file: File) {
  const type = file.type.toLowerCase();

  if (type === "image/png") return "png";
  if (type === "image/jpeg" || type === "image/jpg") return "jpg";

  const original = (file.name || "").toLowerCase();
  if (original.endsWith(".png")) return "png";
  if (original.endsWith(".jpg") || original.endsWith(".jpeg")) return "jpg";

  return "";
}

async function saveEmpresaLogo(empresaId: string, file: File) {
  const ext = getImageExtension(file);

  if (!ext) {
    throw new Error("A logo deve ser PNG ou JPG.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const dir = path.join(process.cwd(), "public", "uploads", "empresas");
  await mkdir(dir, { recursive: true });

  const internalName = `empresa-logo-${empresaId}-${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(dir, internalName);

  await writeFile(fullPath, bytes);

  const url = `/uploads/empresas/${internalName}`;

  const arquivo = await prisma.arquivo.create({
    data: {
      empresaId,
      nomeOriginal: file.name || internalName,
      nomeInterno: internalName,
      mimeType: file.type || (ext === "png" ? "image/png" : "image/jpeg"),
      tamanho: file.size,
      url,
      categoria: "LOGO" as any,
    },
    select: {
      id: true,
    },
  });

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      logoFileId: arquivo.id,
    },
  });
}

export async function saveEmpresaAction(formData: FormData) {
  await requireUser();

  let errorMessage = "";

  try {
    const id = getString(formData, "id");
    const logo = formData.get("logo");
    const logoFile = logo instanceof File && logo.size > 0 ? logo : null;

    const data = {
      razaoSocial: toNullable(getString(formData, "razaoSocial")),
      nomeFantasia: toNullable(getString(formData, "nomeFantasia")),
      cnpj: toNullable(onlyDigits(getString(formData, "cnpj"))),
      email: toNullable(getString(formData, "email").toLowerCase()),
      telefone: toNullable(getString(formData, "telefone")),
      whatsapp: toNullable(getString(formData, "whatsapp")),
      cep: toNullable(onlyDigits(getString(formData, "cep"))),
      logradouro: toNullable(getString(formData, "logradouro")),
      numero: toNullable(getString(formData, "numero")),
      complemento: toNullable(getString(formData, "complemento")),
      bairro: toNullable(getString(formData, "bairro")),
      cidade: toNullable(getString(formData, "cidade")),
      uf: toNullable(getString(formData, "uf").toUpperCase()),
      descricaoPublica: toNullable(getString(formData, "descricaoPublica")),
      missao: toNullable(getString(formData, "missao")),
      valores: toNullable(getString(formData, "valores")),
      corPrimaria: normalizeColor(getString(formData, "corPrimaria"), "#0f172a"),
      corSecundaria: normalizeColor(getString(formData, "corSecundaria"), "#334155"),
      ativo: formData.get("ativo") === "on",
    };

    let empresaId = id;

    if (id) {
      await prisma.empresa.update({
        where: { id },
        data,
      });
    } else {
      const existente = await prisma.empresa.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (existente) {
        empresaId = existente.id;

        await prisma.empresa.update({
          where: { id: existente.id },
          data,
        });
      } else {
        const created = await prisma.empresa.create({
          data,
          select: { id: true },
        });

        empresaId = created.id;
      }
    }

    if (empresaId && logoFile) {
      await saveEmpresaLogo(empresaId, logoFile);
    }
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar os dados da empresa.";
  }

  revalidatePath("/empresa");
  revalidatePath("/relatorios");
  revalidatePath("/relatorios/clientes");
  revalidatePath("/relatorios/profissionais");
  revalidatePath("/relatorios/vendas");
  revalidatePath("/relatorios/estoque");
  revalidatePath("/relatorios/financeiro");

  if (errorMessage) {
    redirect(`/empresa?erro=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/empresa?ok=1");
}