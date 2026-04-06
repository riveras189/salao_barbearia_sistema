import PanelBackButton from "@/components/PanelBackButton";
import { requireUser } from "@/lib/auth";
import {
  getBackupCapabilities,
  getBackupRestoreGuide,
  getBackupRootDir,
  listBackups,
} from "@/lib/backup";
import {
  createBackupAction,
  deleteBackupAction,
  restoreSavedBackupAction,
  restoreUploadedSqlAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function getSingleParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const cardClass =
  "rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm";

const inputClass =
  "block w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]";

const buttonPrimaryClass =
  "inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold shadow-sm transition hover:opacity-90";
const buttonOutlineClass =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-transparent px-3 text-sm font-medium text-[var(--text)] transition hover:opacity-90";

const buttonWarningClass =
  "inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-3 text-sm font-semibold text-white transition hover:opacity-90";

const buttonDangerClass =
  "inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-3 text-sm font-semibold text-white transition hover:opacity-90";

const codeBlockClass =
  "mt-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 font-mono text-xs text-[var(--text)]";

export default async function BackupPage({ searchParams }: PageProps) {
  await requireUser();

  const params = (searchParams ? await searchParams : {}) || {};
  const ok = getSingleParam(params.ok);
  const error = getSingleParam(params.error);

  const [backups, capabilities, restoreGuide] = await Promise.all([
    listBackups(),
    getBackupCapabilities(),
    Promise.resolve(getBackupRestoreGuide()),
  ]);
  const backupRoot = getBackupRootDir();
  const databaseLabel =
    capabilities.databaseEngine === "mysql" ? "MySQL" : "PostgreSQL";

  return (
    <div className="space-y-6 p-4 md:p-6 text-[var(--text)]">
      <PanelBackButton href="/dashboard" label="Voltar" />

      <div className={`${cardClass} p-5`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Backup e restaurar
            </h1>

             <p className="mt-1 text-sm text-[var(--muted)]">
               Faça backup do banco, baixe o arquivo SQL e restaure quando
               precisar. No Render, o fluxo mais confiável é baixar o SQL e
               restaurar externamente no banco {databaseLabel}.
             </p>

            <p className="mt-2 text-xs text-[var(--muted)]">
              Pasta dos backups:{" "}
              <span className="font-mono text-[var(--text)]">{backupRoot}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {capabilities.canCreateDump ? (
              <a
                href="/api/backup/download-current"
                className={buttonPrimaryClass}
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-color) 30%, var(--line))",
                  background: "var(--brand-gradient)",
                  color: "#fff",
                }}
              >
                Baixar backup SQL agora
              </a>
            ) : (
              <span
                className={`${buttonPrimaryClass} cursor-not-allowed opacity-60`}
                style={{
                  borderColor: "color-mix(in srgb, var(--brand-color) 30%, var(--line))",
                  background: "var(--brand-gradient)",
                  color: "#fff",
                }}
              >
                Backup SQL indisponivel
              </span>
            )}

            <form action={createBackupAction}>
              <button type="submit" className={buttonOutlineClass}>
                Salvar backup no servidor
              </button>
            </form>
          </div>
        </div>

        {capabilities.isRenderEnvironment ? (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            No Render, prefira <strong>Baixar backup SQL agora</strong>. Backups
            salvos no servidor dependem do disco local e nao sao a melhor
            estrategia para recuperacao.
          </div>
        ) : null}

         {!capabilities.canCreateDump ? (
           <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
             O servidor atual nao encontrou o utilitario <code>{capabilities.dumpBinaryName}</code>.
             Configure <code>{capabilities.binDirEnvName}</code> ou gere o backup externamente.
           </div>
         ) : null}
      </div>

      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {ok === "created" && "Backup criado com sucesso."}
          {ok === "restored" && "Backup restaurado com sucesso."}
          {ok === "restored-upload" && "Arquivo SQL restaurado com sucesso."}
          {ok === "deleted" && "Backup excluído com sucesso."}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Restaurar arquivo .sql
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Use esta opcao para restaurar um backup vindo de outro computador.
          </p>

          {capabilities.canRestoreSql ? (
            <form action={restoreUploadedSqlAction} className="mt-4 space-y-4">
              <input
                type="file"
                name="arquivo"
                accept=".sql"
                required
                className={inputClass}
              />

              <button type="submit" className={buttonWarningClass}>
                Restaurar arquivo SQL
              </button>
            </form>
           ) : (
             <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] px-4 py-4 text-sm text-[var(--muted)]">
               O servidor atual nao encontrou o utilitario <code>{capabilities.restoreBinaryName}</code>.
               Para restaurar no Render, use o acesso externo do banco em um
               computador com as ferramentas do {databaseLabel} instaladas.
             </div>
           )}
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="text-lg font-semibold text-[var(--text)]">Atenção</h2>

          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <p>• Restaurar substitui os dados atuais do banco pelo conteúdo do backup.</p>
            <p>• O botao de download gera um arquivo SQL na hora, sem depender da lista local abaixo.</p>
            <p>• Backups salvos no servidor sao secundarios e podem nao ser a melhor opcao no Render.</p>
            <p>• Quando o backup tiver arquivos salvos junto, eles tambem sao restaurados.</p>
            <p>• Antes de restaurar, e recomendado baixar um novo SQL do estado atual.</p>
          </div>
        </div>
      </div>

      {!capabilities.canRestoreSql ? (
        <div className={`${cardClass} p-5`}>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Restauracao assistida
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Quando o servidor nao consegue restaurar sozinho, use estes comandos
            no seu computador com PostgreSQL instalado.
          </p>

          {restoreGuide.directUrlConfigured ? (
            <div className="mt-4 space-y-4 text-sm text-[var(--muted)]">
              <p>
                Banco atual: <span className="font-mono text-[var(--text)]">{restoreGuide.database || "-"}</span>
                {" "}em <span className="font-mono text-[var(--text)]">{restoreGuide.host || "-"}</span>
              </p>

              <p>
                Use a mesma conexao configurada em <code>DIRECT_URL</code>.
                Referencia: <span className="font-mono text-[var(--text)] break-all">{restoreGuide.directUrlMasked}</span>
              </p>

              <div>
                <p className="font-medium text-[var(--text)]">
                  1. Limpar o banco antes de restaurar
                </p>
                <pre className={codeBlockClass}>{restoreGuide.resetCommand}</pre>
              </div>

              <div>
                <p className="font-medium text-[var(--text)]">
                  2. Restaurar o arquivo SQL
                </p>
                <pre className={codeBlockClass}>{restoreGuide.restoreCommand}</pre>
              </div>

              <div>
                <p className="font-medium text-[var(--text)]">
                  3. Reaplicar as migrations do projeto
                </p>
                <pre className={codeBlockClass}>{restoreGuide.migrateCommand}</pre>
              </div>

              <p>
                Troque apenas <code>C:\caminho\do\backup.sql</code> pelo
                arquivo correto. A senha da conexao foi ocultada de proposito.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] px-4 py-4 text-sm text-[var(--muted)]">
              Configure <code>DIRECT_URL</code> para que a pagina possa montar as
              instrucoes de restauracao externa.
            </div>
          )}
        </div>
      ) : null}

      <div className={`${cardClass} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Backups salvos no servidor
          </h2>

          <span className="text-sm text-[var(--muted)]">
            {backups.length} arquivo(s)
          </span>
        </div>

        <p className="mb-4 text-sm text-[var(--muted)]">
          Esta lista e local ao servidor atual. Use o download SQL acima como
          backup principal.
        </p>

        {backups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            Nenhum backup encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-[var(--text)]">
                      {item.name}
                    </div>

                    <div className="text-sm text-[var(--muted)]">
                      Criado em: {formatDateTime(item.createdAt)}
                    </div>

                    <div className="text-sm text-[var(--muted)]">
                      Tamanho: {formatBytes(item.sizeBytes)}
                    </div>

                    <div className="text-sm text-[var(--muted)]">
                      Arquivos salvos no backup: {item.assets.length}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/backup/download/${encodeURIComponent(item.name)}`}
                      className={buttonOutlineClass}
                    >
                      Baixar SQL
                    </a>

                    {capabilities.canRestoreSql ? (
                      <form action={restoreSavedBackupAction}>
                        <input type="hidden" name="name" value={item.name} />
                        <button type="submit" className={buttonWarningClass}>
                          Restaurar
                        </button>
                      </form>
                    ) : (
                      <span className={`${buttonWarningClass} cursor-not-allowed opacity-60`}>
                        Restaurar externamente
                      </span>
                    )}

                    <form action={deleteBackupAction}>
                      <input type="hidden" name="name" value={item.name} />
                      <button type="submit" className={buttonDangerClass}>
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
