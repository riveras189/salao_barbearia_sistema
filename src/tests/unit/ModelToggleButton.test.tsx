import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ModelToggleButton from "@/components/layout/ModelToggleButton";

const { switchModel, trackAnalyticsSpy } = vi.hoisted(() => ({
  switchModel: vi.fn(),
  trackAnalyticsSpy: vi.fn(),
}));

vi.mock("@/hooks/useSystemModel", () => ({
  default: () => ({
    currentModel: {
      id: "barbearia_v1",
      name: "Barbearia",
      description: "Tema e linguagem de barbearia",
      icon: "scissors",
      settings: {
        greeting: "Bem-vindo à barbearia!",
        priceTemplate: "R$ {value}",
        responseTone: "informal",
      },
    },
    models: [
      {
        id: "padrao_v1",
        name: "Padrão",
        description: "Modelo original",
        icon: "sparkles",
        settings: {
          greeting: "Bem-vindo ao sistema!",
          priceTemplate: "R$ {value}",
          responseTone: "formal",
        },
      },
      {
        id: "barbearia_v1",
        name: "Barbearia",
        description: "Tema e linguagem de barbearia",
        icon: "scissors",
        settings: {
          greeting: "Bem-vindo à barbearia!",
          priceTemplate: "R$ {value}",
          responseTone: "informal",
        },
      },
    ],
    isLoading: false,
    error: null,
    switchModel,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackAnalyticsEvent: trackAnalyticsSpy,
}));

describe("ModelToggleButton", () => {
  beforeEach(() => {
    switchModel.mockReset();
    trackAnalyticsSpy.mockReset();
  });

  it("abre o painel de modelos", async () => {
    const user = userEvent.setup();
    render(<ModelToggleButton />);

    await user.click(screen.getByRole("button", { name: /modelo ativo/i }));

    expect(screen.getByRole("dialog", { name: /trocar modelo do sistema/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar modelo barbearia/i })).toBeInTheDocument();
  });

  it("troca o modelo e dispara analytics", async () => {
    const user = userEvent.setup();
    switchModel.mockResolvedValue(undefined);
    render(<ModelToggleButton />);

    await user.click(screen.getByRole("button", { name: /modelo ativo/i }));
    await user.click(screen.getByRole("button", { name: /selecionar modelo padrão/i }));

    expect(switchModel).toHaveBeenCalledWith({
      modelId: "padrao_v1",
      scope: "user",
      confirm: false,
    });

    expect(trackAnalyticsSpy).toHaveBeenCalledWith(
      "system_model_switched",
      expect.objectContaining({
        previousModelId: "barbearia_v1",
        newModelId: "padrao_v1",
        scope: "user",
      })
    );
  });
});
