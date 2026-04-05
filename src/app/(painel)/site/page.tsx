import { randomUUID } from "crypto";
import type { ReactNode } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import SiteImageField from "@/components/site/SiteImageField";

const SITE_PATH = "/site";

const ui = {
  page: "space-y-6 p-1 text-[var(--text)]",
  card: "rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm",
  cardLg:
    "rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm",
  title: "text-[var(--text)]",
  muted: "text-[var(--muted)]",
  label: "mb-1.5 block text-sm font-medium text-[var(--text)]",
  input:
    "w-full rounded-2xl border border-slate-400 bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-slate-700 dark:border-[var(--line)] dark:focus:border-white",
  checkbox:
    "flex items-center gap-3 rounded-2xl border border-slate-400 bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] dark:border-[var(--line)]",
  primaryButton:
    "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  neutralButton:
    "inline-flex items-center justify-center rounded-2xl border border-slate-500 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",
  dangerButton:
    "inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700",
  subtleBox:
    "rounded-2xl border border-slate-300 bg-[var(--card)] p-4 dark:border-[var(--line)]",
  empty:
    "rounded-2xl border border-dashed border-slate-400 bg-[var(--card)] p-6 text-sm text-[var(--muted)] dark:border-[var(--line)]",
  successAlert:
    "rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  errorAlert:
    "rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  toggleOn:
    "rounded-2xl border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-200 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60",
  toggleOff:
    "rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-200 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function toStr(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullable(value: FormDataEntryValue | null) {
  const text = toStr(value);
  return text ? text : null;
}

function toBool(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function toInt(value: FormDataEntryValue | null, fallback = 0) {
  const text = toStr(value);
  if (!text) return fallback;
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toOptionalInt(value: FormDataEntryValue | null) {
  const text = toStr(value);
  if (!text) return null;
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toDecimalString(value: FormDataEntryValue | null, fallback = "0.00") {
  const text = toStr(value).replace(",", ".");
  if (!text) return fallback;
  const n = Number(text);
  return Number.isFinite(n) ? n.toFixed(2) : fallback;
}

function ensureImageUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

function guessMimeType(url: string) {
  const clean = url.split("?")[0].toLowerCase();

  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".avif")) return "image/avif";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";

  return "image/jpeg";
}

function filenameFromUrl(url: string, fallback: string) {
  try {
    const pathname = url.startsWith("/") ? url : new URL(url).pathname;
    const file = decodeURIComponent(pathname.split("/").pop() || "").trim();
    return file || fallback;
  } catch {
    return fallback;
  }
}

function horarioJsonToText(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join("\n");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (typeof obj.texto === "string") return obj.texto;

    return JSON.stringify(obj, null, 2);
  }

  return "";
}

function textToHorarioJson(text: string) {
  const lines = text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : undefined;
}

async function getEmpresaId() {
  const user = await requireUser();
  return user.empresaId;
}

async function nextBannerOrder(empresaId: string) {
  const result = await prisma.bannerSite.aggregate({
    where: { empresaId },
    _max: { ordem: true },
  });

  return (result._max.ordem ?? -1) + 1;
}

async function nextGaleriaOrder(empresaId: string) {
  const result = await prisma.galeriaItem.aggregate({
    where: { empresaId },
    _max: { ordem: true },
  });

  return (result._max.ordem ?? -1) + 1;
}

async function salvarConteudoPublico(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const horarioTexto = toStr(formData.get("horarioFuncionamentoText"));

    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        razaoSocial: toNullable(formData.get("razaoSocial")),
        nomeFantasia: toNullable(formData.get("nomeFantasia")),
        descricaoPublica: toNullable(formData.get("descricaoPublica")),
        missao: toNullable(formData.get("missao")),
        visao: toNullable(formData.get("visao")),
        valores: toNullable(formData.get("valores")),
        email: toNullable(formData.get("email")),
        telefone: toNullable(formData.get("telefone")),
        whatsapp: toNullable(formData.get("whatsapp")),
        cep: toNullable(formData.get("cep")),
        logradouro: toNullable(formData.get("logradouro")),
        numero: toNullable(formData.get("numero")),
        complemento: toNullable(formData.get("complemento")),
        bairro: toNullable(formData.get("bairro")),
        cidade: toNullable(formData.get("cidade")),
        uf: toNullable(formData.get("uf")),
        corPrimaria: toNullable(formData.get("corPrimaria")),
        corSecundaria: toNullable(formData.get("corSecundaria")),
        horarioFuncionamento: horarioTexto
          ? textToHorarioJson(horarioTexto)
          : undefined,
      },
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Conteúdo público salvo com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível salvar o conteúdo público.")}`,
    );
  }
}

async function salvarAgendamentoOnline(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const sitePublicado = toBool(formData.get("sitePublicado"));
    const agendamentoAtivo = toBool(formData.get("agendamentoAtivo"));
    const exigeConfirmacao = toBool(formData.get("exigeConfirmacao"));
    const exigeSinal = toBool(formData.get("exigeSinal"));

    const antecedenciaMinHoras = Math.max(
      0,
      toInt(formData.get("antecedenciaMinHoras"), 2),
    );

    const antecedenciaMaxDias = Math.max(
      1,
      toInt(formData.get("antecedenciaMaxDias"), 30),
    );

    const intervaloAgendaMin = Math.max(
      5,
      toInt(formData.get("intervaloAgendaMin"), 30),
    );

    const percentualSinal = exigeSinal
      ? toDecimalString(formData.get("percentualSinal"), "0.00")
      : "0.00";

    const politicaCancelamento = toNullable(
      formData.get("politicaCancelamento"),
    );

    await prisma.$transaction([
      prisma.agendamentoOnlineConfig.upsert({
        where: { empresaId },
        create: {
          empresaId,
          ativo: agendamentoAtivo,
          antecedenciaMinHoras,
          antecedenciaMaxDias,
          exigeConfirmacao,
          exigeSinal,
          percentualSinal,
        },
        update: {
          ativo: agendamentoAtivo,
          antecedenciaMinHoras,
          antecedenciaMaxDias,
          exigeConfirmacao,
          exigeSinal,
          percentualSinal,
        },
      }),
      prisma.empresaConfiguracao.upsert({
        where: { empresaId },
        create: {
          empresaId,
          sitePublicado,
          intervaloAgendaMin,
          diasAntecedenciaAgendamentoOnline: antecedenciaMaxDias,
          politicaCancelamento,
        },
        update: {
          sitePublicado,
          intervaloAgendaMin,
          diasAntecedenciaAgendamentoOnline: antecedenciaMaxDias,
          politicaCancelamento,
        },
      }),
    ]);

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Configurações do site e do agendamento online salvas.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível salvar as configurações do agendamento online.")}`,
    );
  }
}

async function criarBanner(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const imagemUrl = toStr(formData.get("imagemUrl"));

    if (!imagemUrl || !ensureImageUrl(imagemUrl)) {
      redirect(
        `${SITE_PATH}?erro=${encodeURIComponent("Informe uma URL válida para o banner.")}`,
      );
    }

    const ordemInformada = toOptionalInt(formData.get("ordem"));
    const ordem = ordemInformada ?? (await nextBannerOrder(empresaId));

    const arquivo = await prisma.arquivo.create({
      data: {
        empresaId,
        nomeOriginal: filenameFromUrl(imagemUrl, "banner-site"),
        nomeInterno: `banner-${randomUUID()}`,
        mimeType: guessMimeType(imagemUrl),
        tamanho: 0,
        url: imagemUrl,
        categoria: "BANNER",
      },
    });

    await prisma.bannerSite.create({
      data: {
        empresaId,
        titulo: toNullable(formData.get("titulo")),
        subtitulo: toNullable(formData.get("subtitulo")),
        link: toNullable(formData.get("link")),
        ordem,
        ativo: toBool(formData.get("ativo")),
        arquivoId: arquivo.id,
      },
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Banner cadastrado com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível cadastrar o banner.")}`,
    );
  }
}

async function atualizarBanner(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const bannerId = toStr(formData.get("bannerId"));
    const arquivoId = toStr(formData.get("arquivoId"));
    const imagemUrl = toStr(formData.get("imagemUrl"));

    if (!bannerId || !arquivoId) {
      redirect(`${SITE_PATH}?erro=${encodeURIComponent("Banner inválido.")}`);
    }

    if (!imagemUrl || !ensureImageUrl(imagemUrl)) {
      redirect(
        `${SITE_PATH}?erro=${encodeURIComponent("Informe uma URL válida para o banner.")}`,
      );
    }

    await prisma.$transaction([
      prisma.bannerSite.updateMany({
        where: { id: bannerId, empresaId },
        data: {
          titulo: toNullable(formData.get("titulo")),
          subtitulo: toNullable(formData.get("subtitulo")),
          link: toNullable(formData.get("link")),
          ordem: Math.max(0, toInt(formData.get("ordem"), 0)),
          ativo: toBool(formData.get("ativo")),
        },
      }),
      prisma.arquivo.updateMany({
        where: { id: arquivoId, empresaId },
        data: {
          url: imagemUrl,
          nomeOriginal: filenameFromUrl(imagemUrl, "banner-site"),
          mimeType: guessMimeType(imagemUrl),
        },
      }),
    ]);

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Banner atualizado com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível atualizar o banner.")}`,
    );
  }
}

async function excluirBanner(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const bannerId = toStr(formData.get("bannerId"));

    await prisma.$transaction(async (tx) => {
      const banner = await tx.bannerSite.findFirst({
        where: { id: bannerId, empresaId },
      });

      if (!banner) {
        throw new Error("Banner não encontrado.");
      }

      const arquivoId = banner.arquivoId;

      await tx.bannerSite.delete({
        where: { id: banner.id },
      });

      const restante = await tx.bannerSite.count({
        where: { arquivoId },
      });

      if (restante === 0) {
        await tx.arquivo.deleteMany({
          where: { id: arquivoId, empresaId },
        });
      }
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Banner excluído com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível excluir o banner.")}`,
    );
  }
}

async function criarGaleria(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const imagemUrl = toStr(formData.get("imagemUrl"));

    if (!imagemUrl || !ensureImageUrl(imagemUrl)) {
      redirect(
        `${SITE_PATH}?erro=${encodeURIComponent("Informe uma URL válida para a galeria.")}`,
      );
    }

    const ordemInformada = toOptionalInt(formData.get("ordem"));
    const ordem = ordemInformada ?? (await nextGaleriaOrder(empresaId));

    const arquivo = await prisma.arquivo.create({
      data: {
        empresaId,
        nomeOriginal: filenameFromUrl(imagemUrl, "galeria-site"),
        nomeInterno: `galeria-${randomUUID()}`,
        mimeType: guessMimeType(imagemUrl),
        tamanho: 0,
        url: imagemUrl,
        categoria: "GALERIA_SITE",
      },
    });

    await prisma.galeriaItem.create({
      data: {
        empresaId,
        titulo: toNullable(formData.get("titulo")),
        descricao: toNullable(formData.get("descricao")),
        categoria: toNullable(formData.get("categoria")),
        ordem,
        ativo: toBool(formData.get("ativo")),
        arquivoId: arquivo.id,
      },
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Item da galeria cadastrado com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível cadastrar o item da galeria.")}`,
    );
  }
}

async function atualizarGaleria(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const itemId = toStr(formData.get("itemId"));
    const arquivoId = toStr(formData.get("arquivoId"));
    const imagemUrl = toStr(formData.get("imagemUrl"));

    if (!itemId || !arquivoId) {
      redirect(
        `${SITE_PATH}?erro=${encodeURIComponent("Item da galeria inválido.")}`,
      );
    }

    if (!imagemUrl || !ensureImageUrl(imagemUrl)) {
      redirect(
        `${SITE_PATH}?erro=${encodeURIComponent("Informe uma URL válida para a galeria.")}`,
      );
    }

    await prisma.$transaction([
      prisma.galeriaItem.updateMany({
        where: { id: itemId, empresaId },
        data: {
          titulo: toNullable(formData.get("titulo")),
          descricao: toNullable(formData.get("descricao")),
          categoria: toNullable(formData.get("categoria")),
          ordem: Math.max(0, toInt(formData.get("ordem"), 0)),
          ativo: toBool(formData.get("ativo")),
        },
      }),
      prisma.arquivo.updateMany({
        where: { id: arquivoId, empresaId },
        data: {
          url: imagemUrl,
          nomeOriginal: filenameFromUrl(imagemUrl, "galeria-site"),
          mimeType: guessMimeType(imagemUrl),
        },
      }),
    ]);

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Item da galeria atualizado com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível atualizar o item da galeria.")}`,
    );
  }
}

async function excluirGaleria(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const itemId = toStr(formData.get("itemId"));

    await prisma.$transaction(async (tx) => {
      const item = await tx.galeriaItem.findFirst({
        where: { id: itemId, empresaId },
      });

      if (!item) {
        throw new Error("Item da galeria não encontrado.");
      }

      const arquivoId = item.arquivoId;

      await tx.galeriaItem.delete({
        where: { id: item.id },
      });

      const restante = await tx.galeriaItem.count({
        where: { arquivoId },
      });

      if (restante === 0) {
        await tx.arquivo.deleteMany({
          where: { id: arquivoId, empresaId },
        });
      }
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Item da galeria excluído com sucesso.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível excluir o item da galeria.")}`,
    );
  }
}

async function alternarServicoNoSite(formData: FormData) {
  "use server";

  try {
    const empresaId = await getEmpresaId();
    const servicoId = toStr(formData.get("servicoId"));
    const exibirNoSite = toBool(formData.get("exibirNoSite"));

    await prisma.servico.updateMany({
      where: {
        id: servicoId,
        empresaId,
      },
      data: {
        exibirNoSite,
      },
    });

    revalidatePath(SITE_PATH);
    redirect(
      `${SITE_PATH}?ok=${encodeURIComponent("Serviço atualizado no site.")}`,
    );
  } catch (error) {
    console.error(error);
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Não foi possível atualizar o serviço.")}`,
    );
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={ui.card}>
      <div className="mb-5">
        <h2 className={`text-lg font-semibold ${ui.title}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm ${ui.muted}`}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={ui.label}>{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={ui.input}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={ui.label}>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={rows}
        className={ui.input}
      />
    </label>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className={ui.checkbox}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-400 accent-rose-600 dark:border-slate-600"
      />
      <span>{label}</span>
    </label>
  );
}

function SaveButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className={ui.primaryButton}>
      {children}
    </button>
  );
}

export default async function SitePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const ok = getParam(params, "ok");
  const erro = getParam(params, "erro");

  const user = await requireUser();

  const empresa = await prisma.empresa.findUnique({
    where: { id: user.empresaId },
    include: {
      configuracao: true,
      agendamentoOnlineConfig: true,
      bannersSite: {
        include: { arquivo: true },
        orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      },
      galerias: {
        include: { arquivo: true },
        orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      },
      servicos: {
        orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      },
    },
  });

  if (!empresa) {
    redirect(
      `${SITE_PATH}?erro=${encodeURIComponent("Empresa não encontrada.")}`,
    );
  }

  const sitePublicado = !!empresa.configuracao?.sitePublicado;
  const horarioTexto = horarioJsonToText(empresa.horarioFuncionamento);

  return (
    <div className={ui.page}>
      <section className={ui.cardLg}>
        <h1 className={`text-2xl font-bold ${ui.title}`}>Site</h1>
        <p className={`mt-2 text-sm ${ui.muted}`}>
          Configure o conteúdo público, banners, galeria e o agendamento online.
        </p>
      </section>

      {ok ? <div className={ui.successAlert}>{ok}</div> : null}
      {erro ? <div className={ui.errorAlert}>{erro}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard
          title="Conteúdo público"
          description="Informações principais que podem aparecer no site."
        >
          <form action={salvarConteudoPublico} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Nome fantasia"
                name="nomeFantasia"
                defaultValue={empresa.nomeFantasia}
                placeholder="Nome do salão"
              />
              <Field
                label="Razão social"
                name="razaoSocial"
                defaultValue={empresa.razaoSocial}
                placeholder="Razão social"
              />
              <Field
                label="E-mail"
                name="email"
                type="email"
                defaultValue={empresa.email}
                placeholder="contato@empresa.com"
              />
              <Field
                label="Telefone"
                name="telefone"
                defaultValue={empresa.telefone}
                placeholder="(17) 0000-0000"
              />
              <Field
                label="WhatsApp"
                name="whatsapp"
                defaultValue={empresa.whatsapp}
                placeholder="(17) 00000-0000"
              />
              <Field
                label="CEP"
                name="cep"
                defaultValue={empresa.cep}
                placeholder="00000-000"
              />
              <Field
                label="Logradouro"
                name="logradouro"
                defaultValue={empresa.logradouro}
                placeholder="Rua / Avenida"
              />
              <Field
                label="Número"
                name="numero"
                defaultValue={empresa.numero}
                placeholder="123"
              />
              <Field
                label="Complemento"
                name="complemento"
                defaultValue={empresa.complemento}
                placeholder="Sala, fundos..."
              />
              <Field
                label="Bairro"
                name="bairro"
                defaultValue={empresa.bairro}
                placeholder="Bairro"
              />
              <Field
                label="Cidade"
                name="cidade"
                defaultValue={empresa.cidade}
                placeholder="Cidade"
              />
              <Field
                label="UF"
                name="uf"
                defaultValue={empresa.uf}
                placeholder="SP"
              />
              <Field
                label="Cor primária"
                name="corPrimaria"
                defaultValue={empresa.corPrimaria}
                placeholder="#0f172a"
              />
              <Field
                label="Cor secundária"
                name="corSecundaria"
                defaultValue={empresa.corSecundaria}
                placeholder="#334155"
              />
            </div>

            <TextArea
              label="Descrição pública"
              name="descricaoPublica"
              defaultValue={empresa.descricaoPublica}
              placeholder="Texto principal do site"
              rows={4}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <TextArea
                label="Missão"
                name="missao"
                defaultValue={empresa.missao}
                rows={4}
              />
              <TextArea
                label="Visão"
                name="visao"
                defaultValue={empresa.visao}
                rows={4}
              />
              <TextArea
                label="Valores"
                name="valores"
                defaultValue={empresa.valores}
                rows={4}
              />
            </div>

            <TextArea
              label="Horário de funcionamento"
              name="horarioFuncionamentoText"
              defaultValue={horarioTexto}
              placeholder={`Segunda a sexta - 08:00 às 18:00\nSábado - 08:00 às 14:00`}
              rows={4}
            />

            <div className="flex justify-end">
              <SaveButton>Salvar conteúdo público</SaveButton>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Publicação e agendamento online"
            description="Liga e ajusta as configurações do site e do agendamento do cliente."
          >
            <form action={salvarAgendamentoOnline} className="space-y-5">
              <div className="grid gap-3">
                <Checkbox
                  name="sitePublicado"
                  label="Site publicado"
                  defaultChecked={sitePublicado}
                />
                <Checkbox
                  name="agendamentoAtivo"
                  label="Agendamento online ativo"
                  defaultChecked={!!empresa.agendamentoOnlineConfig?.ativo}
                />
                <Checkbox
                  name="exigeConfirmacao"
                  label="Exigir confirmação"
                  defaultChecked={
                    empresa.agendamentoOnlineConfig?.exigeConfirmacao ?? true
                  }
                />
                <Checkbox
                  name="exigeSinal"
                  label="Exigir sinal"
                  defaultChecked={!!empresa.agendamentoOnlineConfig?.exigeSinal}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Antecedência mínima (horas)"
                  name="antecedenciaMinHoras"
                  type="number"
                  defaultValue={String(
                    empresa.agendamentoOnlineConfig?.antecedenciaMinHoras ?? 2,
                  )}
                />
                <Field
                  label="Antecedência máxima (dias)"
                  name="antecedenciaMaxDias"
                  type="number"
                  defaultValue={String(
                    empresa.agendamentoOnlineConfig?.antecedenciaMaxDias ??
                      empresa.configuracao?.diasAntecedenciaAgendamentoOnline ??
                      30,
                  )}
                />
                <Field
                  label="Intervalo da agenda (min)"
                  name="intervaloAgendaMin"
                  type="number"
                  defaultValue={String(
                    empresa.configuracao?.intervaloAgendaMin ?? 30,
                  )}
                />
                <Field
                  label="Percentual do sinal (%)"
                  name="percentualSinal"
                  type="number"
                  defaultValue={
                    empresa.agendamentoOnlineConfig?.percentualSinal?.toString() ??
                    "0"
                  }
                />
              </div>

              <TextArea
                label="Política de cancelamento"
                name="politicaCancelamento"
                defaultValue={empresa.configuracao?.politicaCancelamento}
                rows={4}
                placeholder="Ex.: cancelamentos com menos de 2 horas poderão perder o sinal."
              />

              <div className="flex justify-end">
                <SaveButton>Salvar configuração do site</SaveButton>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Serviços exibidos no site"
            description="Marque o que o cliente pode ver e agendar no site."
          >
            <div className="space-y-3">
              {empresa.servicos.length === 0 ? (
                <p className={`text-sm ${ui.muted}`}>
                  Nenhum serviço cadastrado.
                </p>
              ) : (
                empresa.servicos.map((servico) => (
                  <form
                    key={servico.id}
                    action={alternarServicoNoSite}
                    className={ui.subtleBox + " flex flex-col gap-3 md:flex-row md:items-center md:justify-between"}
                  >
                    <input type="hidden" name="servicoId" value={servico.id} />
                    <input
                      type="hidden"
                      name="exibirNoSite"
                      value={servico.exibirNoSite ? "false" : "true"}
                    />

                    <div>
                      <p className={`font-medium ${ui.title}`}>{servico.nome}</p>
                      <p className={`text-sm ${ui.muted}`}>
                        {servico.ativo ? "Ativo" : "Inativo"} •{" "}
                        {Number(servico.preco).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                        • {servico.duracaoMin} min
                      </p>
                    </div>

                    <button
                      type="submit"
                      className={
                        servico.exibirNoSite ? ui.toggleOn : ui.toggleOff
                      }
                    >
                      {servico.exibirNoSite
                        ? "Ocultar do site"
                        : "Exibir no site"}
                    </button>
                  </form>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Banners"
        description="Cadastro dos banners do topo do site."
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <form action={criarBanner} className="space-y-4">
            <Field
              label="Título"
              name="titulo"
              placeholder="Título do banner"
            />
            <Field
              label="Subtítulo"
              name="subtitulo"
              placeholder="Texto complementar"
            />
            <Field label="Link" name="link" placeholder="https://..." />

            <SiteImageField
              label="Imagem do banner"
              folder="banners"
              previewName="Banner"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Ordem"
                name="ordem"
                type="number"
                placeholder="0"
              />
              <div className="flex items-end">
                <Checkbox name="ativo" label="Banner ativo" defaultChecked />
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton>Cadastrar banner</SaveButton>
            </div>
          </form>

          <div className="space-y-4">
            {empresa.bannersSite.length === 0 ? (
              <div className={ui.empty}>Nenhum banner cadastrado.</div>
            ) : (
              empresa.bannersSite.map((banner) => (
                <form
                  key={banner.id}
                  action={atualizarBanner}
                  className={ui.subtleBox + " space-y-4"}
                >
                  <input type="hidden" name="bannerId" value={banner.id} />
                  <input
                    type="hidden"
                    name="arquivoId"
                    value={banner.arquivoId}
                  />

                  <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-[var(--line)]">
                    <img
                      src={banner.arquivo.url}
                      alt={banner.titulo || "Banner"}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Título"
                      name="titulo"
                      defaultValue={banner.titulo}
                    />
                    <Field
                      label="Subtítulo"
                      name="subtitulo"
                      defaultValue={banner.subtitulo}
                    />
                    <Field
                      label="Link"
                      name="link"
                      defaultValue={banner.link}
                    />
                    <Field
                      label="Ordem"
                      name="ordem"
                      type="number"
                      defaultValue={String(banner.ordem)}
                    />
                  </div>

                  <SiteImageField
                    label="Imagem do banner"
                    folder="banners"
                    defaultValue={banner.arquivo.url}
                    previewName={banner.titulo || "Banner"}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <Checkbox
                      name="ativo"
                      label="Banner ativo"
                      defaultChecked={banner.ativo}
                    />

                    <div className="flex flex-wrap justify-end gap-3">
                      <SaveButton>Salvar banner</SaveButton>
                      <button
                        formAction={excluirBanner}
                        className={ui.dangerButton}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </form>
              ))
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Galeria"
        description="Imagens que podem aparecer na galeria do site."
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <form action={criarGaleria} className="space-y-4">
            <Field
              label="Título"
              name="titulo"
              placeholder="Ex.: Corte feminino"
            />
            <Field
              label="Categoria"
              name="categoria"
              placeholder="Ex.: Cabelo, Unhas, Barbearia"
            />
            <TextArea
              label="Descrição"
              name="descricao"
              placeholder="Descrição curta da foto"
              rows={3}
            />

            <SiteImageField
              label="Imagem da galeria"
              folder="galeria"
              previewName="Galeria"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Ordem"
                name="ordem"
                type="number"
                placeholder="0"
              />
              <div className="flex items-end">
                <Checkbox name="ativo" label="Item ativo" defaultChecked />
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton>Cadastrar item</SaveButton>
            </div>
          </form>

          <div className="space-y-4">
            {empresa.galerias.length === 0 ? (
              <div className={ui.empty}>Nenhum item na galeria.</div>
            ) : (
              empresa.galerias.map((item) => (
                <form
                  key={item.id}
                  action={atualizarGaleria}
                  className={ui.subtleBox + " space-y-4"}
                >
                  <input type="hidden" name="itemId" value={item.id} />
                  <input
                    type="hidden"
                    name="arquivoId"
                    value={item.arquivoId}
                  />

                  <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-[var(--line)]">
                    <img
                      src={item.arquivo.url}
                      alt={item.titulo || "Galeria"}
                      className="h-40 w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Título"
                      name="titulo"
                      defaultValue={item.titulo}
                    />
                    <Field
                      label="Categoria"
                      name="categoria"
                      defaultValue={item.categoria}
                    />
                    <Field
                      label="Ordem"
                      name="ordem"
                      type="number"
                      defaultValue={String(item.ordem)}
                    />
                  </div>

                  <TextArea
                    label="Descrição"
                    name="descricao"
                    defaultValue={item.descricao}
                    rows={3}
                  />

                  <SiteImageField
                    label="Imagem da galeria"
                    folder="galeria"
                    defaultValue={item.arquivo.url}
                    previewName={item.titulo || "Galeria"}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <Checkbox
                      name="ativo"
                      label="Item ativo"
                      defaultChecked={item.ativo}
                    />

                    <div className="flex flex-wrap justify-end gap-3">
                      <SaveButton>Salvar item</SaveButton>
                      <button
                        formAction={excluirGaleria}
                        className={ui.dangerButton}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </form>
              ))
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}