import { NextResponse } from "next/server";

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = digitsOnly(searchParams.get("cep") || "");

  if (cep.length !== 8) {
    return NextResponse.json(
      { error: "CEP inválido." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CEP." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data?.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cep: data.cep || "",
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar o CEP." },
      { status: 500 }
    );
  }
}