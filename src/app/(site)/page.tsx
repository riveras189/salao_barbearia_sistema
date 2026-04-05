import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteImageField from "@/components/site/SiteImageField";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatMoney(value: unknown) {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : value && typeof value === "object" && "toNumber" in (value as any)
      ? (value as any).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

function formatHorario(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        const r = asRecord(item);
        const dia = getString(r.dia);
        const inicio = getString(r.inicio || r.abertura);
        const fim = getString(r.fim || r.fechamento);

        if (!dia && !inicio && !fim) return "";
        if (dia && inicio && fim) return `${dia}: ${inicio} às ${fim}`;
        return [dia, inicio, fim].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("\n");
  }

  const r = asRecord(value);
  return Object.entries(r)
    .map(([k, v]) => `${k}: ${String(v ?? "")}`)
    .join("\n");
}

export default async function SitePage() {
  const empresa = await prisma.empresa.findFirst({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
    include: {
      configuracao: true,
      logo: {
        select: {
          url: true,
        },
      },
    },
  });

  if (!empresa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Site indisponível
          </h1>
          <p className="mt-3 text-slate-700">
            Nenhuma empresa ativa foi encontrada para exibir o site.
          </p>
        </div>
      </main>
    );
  }

  const [paginaHome, banners, galeria, servicos, depoimentos] =
    await Promise.all([
      prisma.paginaSite.findFirst({
        where: {
          empresaId: empresa.id,
          slug: "home",
        },
      }),
      prisma.bannerSite.findMany({
        where: {
          empresaId: empresa.id,
          ativo: true,
        },
        include: {
          arquivo: {
            select: {
              url: true,
            },
          },
        },
        orderBy: [{ ordem: "asc" }],
        take: 5,
      }),
      prisma.galeriaItem.findMany({
        where: {
          empresaId: empresa.id,
          ativo: true,
        },
        include: {
          arquivo: {
            select: {
              url: true,
            },
          },
        },
        orderBy: [{ ordem: "asc" }],
        take: 8,
      }),
      prisma.servico.findMany({
        where: {
          empresaId: empresa.id,
          ativo: true,
          exibirNoSite: true,
        },
        include: {
          imagens: {
            include: {
              arquivo: {
                select: {
                  url: true,
                },
              },
            },
            orderBy: { ordem: "asc" },
            take: 1,
          },
          categoria: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: { nome: "asc" },
        take: 12,
      }),
      prisma.depoimento.findMany({
        where: {
          empresaId: empresa.id,
          ativo: true,
        },
        orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
        take: 6,
      }),
    ]);

  const conteudo = asRecord(paginaHome?.conteudoJson);
  const hero = asRecord(conteudo.hero);
  const seo = asRecord(conteudo.seo);
  const contatoExtra = asRecord(conteudo.contato);
  const sobreExtra = asRecord(conteudo.sobre);

  const nomeEmpresa =
    empresa.nomeFantasia || empresa.razaoSocial || "Salão de Beleza";

  const tituloHero = getString(hero.titulo) || nomeEmpresa;

  const subtituloHero =
    getString(hero.subtitulo) ||
    empresa.descricaoPublica ||
    "Beleza, cuidado, atendimento profissional e agendamento online em um só lugar.";

  const sobreTitulo = getString(sobreExtra.titulo) || "Sobre a empresa";
  const sobreTexto =
    getString(sobreExtra.texto) ||
    empresa.descricaoPublica ||
    "Apresente aqui a história da empresa, seus diferenciais, atendimento e proposta de valor.";

  const horarioFuncionamento = formatHorario(empresa.horarioFuncionamento);
  const mostrarSite =
    empresa.configuracao?.sitePublicado === undefined
      ? true
      : empresa.configuracao.sitePublicado;

  const instagram = getString(contatoExtra.instagram);
  const facebook = getString(contatoExtra.facebook);
  const whatsapp = empresa.whatsapp || empresa.telefone || "";

  const heroBanner = banners[0]?.arquivo?.url || galeria[0]?.arquivo?.url || "";

  if (!mostrarSite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Site temporariamente indisponível
          </h1>
          <p className="mt-3 text-slate-700">
            O site público desta empresa ainda não foi publicado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-fuchsia-500/20 selection:text-fuchsia-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {empresa.logo?.url ? (
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:scale-105 flex-shrink-0">
                <Image
                  src={empresa.logo.url}
                  alt={nomeEmpresa}
                  width={56}
                  height={56}
                  quality={95}
                  priority
                  className="object-contain transition-all"
                  style={{
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    imageRendering: 'crisp-edges'
                  }}
                />
              </div>
            ) : null}

            <div className="min-w-0">
              <p className="truncate text-xl font-bold font-display text-slate-900">{nomeEmpresa}</p>
              {empresa.cidade || empresa.uf ? (
                <p className="truncate text-sm text-slate-700 font-medium">
                  {[empresa.cidade, empresa.uf].filter(Boolean).join(" - ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-8 md:flex mr-4">
              <a
                href="#sobre"
                className="text-sm font-semibold text-slate-700 transition hover:text-fuchsia-600"
              >
                Sobre
              </a>
              <a
                href="#servicos"
                className="text-sm font-semibold text-slate-700 transition hover:text-fuchsia-600"
              >
                Serviços
              </a>
              <a
                href="#galeria"
                className="text-sm font-semibold text-slate-700 transition hover:text-fuchsia-600"
              >
                Galeria
              </a>
              <a
                href="#contato"
                className="text-sm font-semibold text-slate-700 transition hover:text-fuchsia-600"
              >
                Contato
              </a>
            </nav>

            <Link
              href="/login"
              className="hidden lg:inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-fuchsia-600"
            >
              Acesso Restrito
            </Link>

            <Link
              href="/cliente/login"
              className="hidden sm:inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Minha Agenda
            </Link>

            <Link
              href="/agendar"
              className="inline-flex shrink-0 items-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-fuchsia-500/20 transition hover:scale-105 active:scale-95"
            >
              Agendar Horário
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0A0615] text-white">
        <div className="absolute inset-0 z-0">
          {heroBanner ? (
            <Image
              src={heroBanner}
              alt={tituloHero}
              fill
              className="object-cover opacity-20 filter grayscale hover:grayscale-0 transition-all duration-1000"
              priority
            />
          ) : null}
        </div>

        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#0A0615] via-[#0A0615]/90 to-fuchsia-900/40" />
        
        {/* Animated Orbs for visual interest */}
        <div className="absolute z-10 bottom-0 left-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl animate-float" />
        <div className="absolute z-10 top-20 right-20 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-20 mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-32 lg:px-8">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">
                {getString(seo.titulo) || "Beleza & Cuidado"}
              </p>
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl text-white">
              {tituloHero}
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              {subtituloHero}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/agendar"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-fuchsia-500/20 transition-all hover:scale-105 active:scale-95"
              >
                Agendar Horário
              </Link>

              <Link
                href="/cliente/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Minha Agenda
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {(banners.length > 0 ? banners : galeria)
              .slice(0, 4)
              .map((item, index) => {
                const imageUrl =
                  "arquivo" in item ? item.arquivo?.url : undefined;

                if (!imageUrl) return null;

                return (
                  <div
                    key={("id" in item && item.id) || index}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition hover:border-fuchsia-500/50 ${
                      index === 0 ? "col-span-2 h-64 sm:h-72" : "h-40 sm:h-48"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={("titulo" in item && item.titulo) || nomeEmpresa}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section
        id="sobre"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.25fr,0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
              Sobre
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {sobreTitulo}
            </h2>
            <p className="mt-5 whitespace-pre-line text-slate-700">
              {sobreTexto}
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Missão</h3>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {empresa.missao || "Defina aqui a missão da empresa."}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Valores</h3>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                {empresa.valores || "Defina aqui os valores da empresa."}
              </p>
            </div>

            {horarioFuncionamento ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-slate-900">
                  Horário de funcionamento
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                  {horarioFuncionamento}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        id="servicos"
        className="border-y border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
                Serviços
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Serviços disponíveis
              </h2>
              <p className="mt-2 text-slate-700">
                Conheça alguns dos serviços disponíveis para atendimento.
              </p>
            </div>

            <Link
              href="/agendar"
              className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-800"
              style={{color: '#fff !important'}}
            >
              Agendar online
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {servicos.map((servico) => {
              const imageUrl = servico.imagens[0]?.arquivo?.url || "";

              return (
                <article
                  key={servico.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-56 bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={servico.nome}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-700">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {servico.categoria?.nome ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {servico.categoria.nome}
                      </p>
                    ) : null}

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {servico.nome}
                    </h3>

                    {servico.descricao ? (
                      <p className="mt-3 text-sm text-slate-700">
                        {servico.descricao}
                      </p>
                    ) : null}

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-700">Valor inicial</p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatMoney(servico.preco)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-700">Duração</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {servico.duracaoMin} min
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {servicos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-700">
              Nenhum serviço publicado no site ainda.
            </div>
          ) : null}
        </div>
      </section>

      <section
        id="galeria"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
            Galeria
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Fotos do salão
          </h2>
          <p className="mt-2 text-slate-700">
            Ambiente, resultados, detalhes e trabalhos realizados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {galeria.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-fuchsia-200"
            >
              <div className="relative h-72 bg-slate-100 overflow-hidden">
                {item.arquivo?.url ? (
                  <Image
                    src={item.arquivo.url}
                    alt={item.titulo || nomeEmpresa}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {(item.titulo || item.descricao) && (
                <div className="p-5">
                  {item.titulo ? (
                    <h3 className="font-bold text-slate-900 line-clamp-1">
                      {item.titulo}
                    </h3>
                  ) : null}
                  {item.descricao ? (
                    <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                      {item.descricao}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        {galeria.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-700">
            Nenhuma foto cadastrada na galeria ainda.
          </div>
        ) : null}
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
              Avaliações
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {depoimentos.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < item.nota ? "★" : "☆"}</span>
                  ))}
                </div>

                <p className="text-slate-700">“{item.texto}”</p>

                <p className="mt-5 font-semibold text-slate-900">
                  {item.nomeCliente}
                </p>
              </article>
            ))}
          </div>

          {depoimentos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-700">
              Nenhum depoimento publicado ainda.
            </div>
          ) : null}
        </div>
      </section>

      <section id="contato" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Contato
            </p>
            <h2 className="mt-2 text-3xl font-bold">{nomeEmpresa}</h2>

            {empresa.email ? (
              <p className="mt-5 text-slate-300">E-mail: {empresa.email}</p>
            ) : null}

            {empresa.telefone ? (
              <p className="mt-2 text-slate-300">Telefone: {empresa.telefone}</p>
            ) : null}

            {empresa.whatsapp ? (
              <p className="mt-2 text-slate-300">WhatsApp: {empresa.whatsapp}</p>
            ) : null}

            <p className="mt-4 whitespace-pre-line text-slate-300">
              {[
                empresa.logradouro,
                empresa.numero,
                empresa.complemento,
                empresa.bairro,
                [empresa.cidade, empresa.uf].filter(Boolean).join(" - "),
                empresa.cep,
              ]
                .filter(Boolean)
                .join("\n")}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold">Acessos rápidos</h3>
            <p className="mt-3 text-slate-300">
              Escolha a opção desejada.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/agendar"
                className="inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Agendar horário
              </Link>

              <Link
                href="/cliente/login"
                className="inline-flex items-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
                style={{color: '#fff !important'}}
              >
                Minha agenda
              </Link>

              <Link
                href="/cliente/cadastro"
                className="inline-flex items-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
                style={{color: '#fff !important'}}
              >
                Criar cadastro
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
                style={{color: '#fff !important'}}
              >
                Entrar no sistema
              </Link>

              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D+/g, "")}`}
                  target="_blank"
                  className="inline-flex items-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
                  style={{color: '#fff !important'}}
                >
                  Falar no WhatsApp
                </a>
              ) : null}
            </div>

            {(instagram || facebook) && (
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
                {instagram ? (
                  <a href={instagram} target="_blank" className="underline">
                    Instagram
                  </a>
                ) : null}
                {facebook ? (
                  <a href={facebook} target="_blank" className="underline">
                    Facebook
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
