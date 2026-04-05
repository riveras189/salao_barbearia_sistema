export function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export async function fetchCep(cep: string) {
  const normalized = digitsOnly(cep);

  if (normalized.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const response = await fetch(`/api/cep?cep=${normalized}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "CEP não encontrado.");
  }

  return data as {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}