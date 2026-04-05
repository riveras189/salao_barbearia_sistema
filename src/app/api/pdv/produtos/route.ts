import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const produtos = await prisma.produto.findMany({
      where: {
        empresaId: user.empresaId,
        ativo: true,
        estoqueAtual: {
          gt: 0, // Only return products with stock
        },
      },
      select: {
        id: true,
        nome: true,
        preco: true,
        estoqueAtual: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Erro ao carregar produtos PDV:", error);
    return NextResponse.json(
      { error: "Erro ao carregar produtos" },
      { status: 500 }
    );
  }
}
