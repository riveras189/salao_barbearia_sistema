import { describe, expect, it } from "vitest";
import {
  applySystemModelToDocument,
  getModelCopy,
  normalizeSystemModel,
} from "@/lib/system-models";

describe("system-model helpers", () => {
  it("normaliza o payload do modelo", () => {
    const model = normalizeSystemModel({
      id: "barbearia_v1",
      nome: "Barbearia",
      descricao: "Tema e linguagem de barbearia",
      icone: "scissors",
      padrao: true,
      configuracoes: {
        greeting: "Bem-vindo à barbearia!",
        priceTemplate: "R$ {value}",
        responseTone: "informal",
        serviceLabel: "corte",
      },
    });

    expect(model.name).toBe("Barbearia");
    expect(model.settings.serviceLabel).toBe("corte");
    expect(model.isDefault).toBe(true);
  });

  it("aplica o modelo no documento", () => {
    applySystemModelToDocument("barbearia_v1");

    expect(document.documentElement).toHaveAttribute("data-model", "barbearia_v1");
    expect(document.body.classList.contains("model-barbearia")).toBe(true);
  });

  it("gera textos com fallback seguro", () => {
    const copy = getModelCopy(null);

    expect(copy.greeting).toBe("Bem-vindo ao sistema!");
    expect(copy.serviceLabel).toBe("serviço");
  });
});
