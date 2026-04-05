import path from "path";
import os from "os";
import { spawn } from "child_process";
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  unlink,
  writeFile,
} from "fs/promises";

type BackupAsset = {
  sourceRelative: string;
  snapshotRelative: string;
};

type BackupMeta = {
  name: string;
  createdAt: string;
  databaseFile: string;
  assets: BackupAsset[];
};

export type BackupItem = BackupMeta & {
  sizeBytes: number;
};

const PROJECT_ROOT = process.cwd();

const BACKUP_ROOT = process.env.BACKUP_DIR
  ? path.resolve(PROJECT_ROOT, process.env.BACKUP_DIR)
  : path.join(PROJECT_ROOT, "storage", "backups");

const ASSET_DIRS = [
  "public/uploads",
  "storage/uploads",
  "public/imagens",
  "storage/imagens",
  "public/files",
];

function toPosix(value: string) {
  return value.replace(/\\/g, "/");
}

function safeName(name: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    throw new Error("Nome de backup inválido.");
  }
  return name;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureBackupRoot() {
  await mkdir(BACKUP_ROOT, { recursive: true });
}

function getTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function parseDatabaseUrl() {
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    throw new Error("DATABASE_URL não foi configurada.");
  }

  const url = new URL(urlString);

  if (!url.protocol.startsWith("postgres")) {
    throw new Error("DATABASE_URL precisa ser PostgreSQL.");
  }

  const database = url.pathname.replace(/^\/+/, "");
  const schema = url.searchParams.get("schema") || "public";

  return {
    host: url.hostname || "localhost",
    port: url.port || "5432",
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database,
    schema,
  };
}

async function resolveBinary(binary: "pg_dump" | "psql") {
  const exe = process.platform === "win32" ? `${binary}.exe` : binary;

  const envDir = process.env.PG_BIN_DIR;
  if (envDir) {
    const envPath = path.join(envDir, exe);
    if (await exists(envPath)) {
      return envPath;
    }
  }

  if (process.platform === "win32") {
    const versions = ["18", "17", "16", "15", "14", "13", "12", "11", "10"];
    const bases = [
      "C:\\Program Files\\PostgreSQL",
      "C:\\Program Files (x86)\\PostgreSQL",
    ];

    for (const base of bases) {
      for (const version of versions) {
        const full = path.join(base, version, "bin", exe);
        if (await exists(full)) {
          return full;
        }
      }
    }
  }

  return exe;
}

async function runCommand(command: string, args: string[], extraEnv?: Record<string, string | undefined>) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...extraEnv,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        reject(
          new Error(
            `Não encontrei ${path.basename(
              command
            )}. Configure PG_BIN_DIR no .env com a pasta bin do PostgreSQL.`
          )
        );
        return;
      }
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `Falha ao executar ${command}.`));
    });
  });
}

async function getDirSize(targetPath: string): Promise<number> {
  const info = await stat(targetPath);

  if (!info.isDirectory()) {
    return info.size;
  }

  const items = await readdir(targetPath, { withFileTypes: true });
  let total = 0;

  for (const item of items) {
    const full = path.join(targetPath, item.name);
    total += await getDirSize(full);
  }

  return total;
}

async function readMeta(folderPath: string, folderName: string): Promise<BackupMeta> {
  const metaPath = path.join(folderPath, "meta.json");

  if (await exists(metaPath)) {
    const raw = await readFile(metaPath, "utf8");
    return JSON.parse(raw) as BackupMeta;
  }

  const dbFile = path.join(folderPath, "database.sql");
  const info = await stat(folderPath);

  return {
    name: folderName,
    createdAt: info.mtime.toISOString(),
    databaseFile: "database.sql",
    assets: [],
  };
}

export function getBackupRootDir() {
  return BACKUP_ROOT;
}

export async function listBackups(): Promise<BackupItem[]> {
  await ensureBackupRoot();

  const entries = await readdir(BACKUP_ROOT, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory());

  const items: BackupItem[] = [];

  for (const folder of folders) {
    const folderPath = path.join(BACKUP_ROOT, folder.name);
    const meta = await readMeta(folderPath, folder.name);
    const sizeBytes = await getDirSize(folderPath);

    items.push({
      ...meta,
      sizeBytes,
    });
  }

  items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return items;
}

export async function createBackup() {
  await ensureBackupRoot();

  const stamp = getTimestamp();
  const name = `backup-${stamp}`;
  const folderPath = path.join(BACKUP_ROOT, name);

  await mkdir(folderPath, { recursive: true });

  const db = parseDatabaseUrl();
  const pgDump = await resolveBinary("pg_dump");
  const databaseFile = path.join(folderPath, "database.sql");

  await runCommand(
    pgDump,
    [
      "-h",
      db.host,
      "-p",
      db.port,
      "-U",
      db.user,
      "-d",
      db.database,
      "-Fp",
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "-f",
      databaseFile,
    ],
    { PGPASSWORD: db.password }
  );

  const assets: BackupAsset[] = [];

  for (const relativeSource of ASSET_DIRS) {
    const sourceAbs = path.join(PROJECT_ROOT, relativeSource);
    if (!(await exists(sourceAbs))) continue;

    const snapshotRelative = toPosix(path.join("assets", relativeSource));
    const snapshotAbs = path.join(folderPath, snapshotRelative);

    await mkdir(path.dirname(snapshotAbs), { recursive: true });
    await cp(sourceAbs, snapshotAbs, {
      recursive: true,
      force: true,
      errorOnExist: false,
    });

    assets.push({
      sourceRelative: toPosix(relativeSource),
      snapshotRelative,
    });
  }

  const meta: BackupMeta = {
    name,
    createdAt: new Date().toISOString(),
    databaseFile: "database.sql",
    assets,
  };

  await writeFile(path.join(folderPath, "meta.json"), JSON.stringify(meta, null, 2), "utf8");

  return meta;
}

async function restoreDatabaseFromSql(sqlFilePath: string) {
  const db = parseDatabaseUrl();
  const psql = await resolveBinary("psql");

  await runCommand(
    psql,
    [
      "-X",
      "-h",
      db.host,
      "-p",
      db.port,
      "-U",
      db.user,
      "-d",
      db.database,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      sqlFilePath,
    ],
    {
      PGPASSWORD: db.password,
    }
  );
}

export async function restoreSavedBackup(name: string) {
  const safe = safeName(name);
  const folderPath = path.join(BACKUP_ROOT, safe);

  if (!(await exists(folderPath))) {
    throw new Error("Backup não encontrado.");
  }

  const meta = await readMeta(folderPath, safe);
  const sqlFilePath = path.join(folderPath, meta.databaseFile);

  if (!(await exists(sqlFilePath))) {
    throw new Error("Arquivo SQL do backup não foi encontrado.");
  }

  await restoreDatabaseFromSql(sqlFilePath);

  for (const asset of meta.assets || []) {
    const sourceAbs = path.join(PROJECT_ROOT, asset.sourceRelative);
    const snapshotAbs = path.join(folderPath, asset.snapshotRelative);

    if (!(await exists(snapshotAbs))) continue;

    await rm(sourceAbs, { recursive: true, force: true });
    await mkdir(path.dirname(sourceAbs), { recursive: true });
    await cp(snapshotAbs, sourceAbs, {
      recursive: true,
      force: true,
      errorOnExist: false,
    });
  }

  return meta;
}

export async function restoreUploadedSql(file: File) {
  if (!file || file.size === 0) {
    throw new Error("Envie um arquivo .sql válido.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (extension !== ".sql") {
    throw new Error("Só é permitido restaurar arquivos .sql.");
  }

  const tempDir = path.join(os.tmpdir(), "salao-backup-restore");
  await mkdir(tempDir, { recursive: true });

  const tempFilePath = path.join(
    tempDir,
    `restore-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  );

  const bytes = await file.arrayBuffer();
  await writeFile(tempFilePath, Buffer.from(bytes));

  try {
    await restoreDatabaseFromSql(tempFilePath);
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }
}

export async function deleteBackup(name: string) {
  const safe = safeName(name);
  const folderPath = path.join(BACKUP_ROOT, safe);

  if (!(await exists(folderPath))) {
    throw new Error("Backup não encontrado.");
  }

  await rm(folderPath, { recursive: true, force: true });
}

export async function getBackupSqlPath(name: string) {
  const safe = safeName(name);
  const folderPath = path.join(BACKUP_ROOT, safe);

  if (!(await exists(folderPath))) {
    throw new Error("Backup não encontrado.");
  }

  const meta = await readMeta(folderPath, safe);
  const sqlFilePath = path.join(folderPath, meta.databaseFile);

  if (!(await exists(sqlFilePath))) {
    throw new Error("Arquivo SQL não encontrado.");
  }

  return sqlFilePath;
}