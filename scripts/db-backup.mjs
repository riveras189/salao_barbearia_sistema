import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

function parseDatabaseUrl() {
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    throw new Error("DATABASE_URL não definida.");
  }

  const url = new URL(urlString);
  if (!url.protocol.startsWith("mysql")) {
    throw new Error("O script db:backup suporta apenas MySQL.");
  }

  return {
    host: url.hostname || "127.0.0.1",
    port: url.port || "3306",
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    database: url.pathname.replace(/^\/+/, ""),
  };
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function mysqldumpPath() {
  const exe = process.platform === "win32" ? "mysqldump.exe" : "mysqldump";
  const binDir = process.env.DB_BIN_DIR || process.env.MYSQL_BIN_DIR;
  return binDir ? path.join(binDir, exe) : exe;
}

function run(command, args, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...extraEnv },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `mysqldump finalizou com código ${code}.`));
    });
  });
}

const db = parseDatabaseUrl();
const outputDir = path.join(process.cwd(), "storage", "backups");
const outputFile = path.join(outputDir, `${db.database}_${timestamp()}.sql`);

await mkdir(outputDir, { recursive: true });

const dump = await run(
  mysqldumpPath(),
  [
    `--host=${db.host}`,
    `--port=${db.port}`,
    `--user=${db.user}`,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--default-character-set=utf8mb4",
    "--databases",
    db.database,
  ],
  { MYSQL_PWD: db.password }
);

await writeFile(outputFile, dump, "utf8");
console.log(outputFile);
