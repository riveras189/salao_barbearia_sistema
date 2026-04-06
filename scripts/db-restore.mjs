import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

function parseDatabaseUrl() {
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    throw new Error("DATABASE_URL não definida.");
  }

  const url = new URL(urlString);
  if (!url.protocol.startsWith("mysql")) {
    throw new Error("O script db:restore suporta apenas MySQL.");
  }

  return {
    host: url.hostname || "127.0.0.1",
    port: url.port || "3306",
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    database: url.pathname.replace(/^\/+/, ""),
  };
}

function mysqlPath() {
  const exe = process.platform === "win32" ? "mysql.exe" : "mysql";
  const binDir = process.env.DB_BIN_DIR || process.env.MYSQL_BIN_DIR;
  return binDir ? path.join(binDir, exe) : exe;
}

function run(command, args, stdin, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...extraEnv },
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.stdin.write(stdin);
    child.stdin.end();
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `mysql finalizou com código ${code}.`));
    });
  });
}

const fileArg = process.argv[2] || process.env.BACKUP_FILE;
if (!fileArg) {
  throw new Error("Informe o arquivo SQL: npm run db:restore -- caminho\\arquivo.sql");
}

const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
const sql = await readFile(filePath, "utf8");
const db = parseDatabaseUrl();

await run(
  mysqlPath(),
  [
    `--host=${db.host}`,
    `--port=${db.port}`,
    `--user=${db.user}`,
    db.database,
  ],
  sql,
  { MYSQL_PWD: db.password }
);

console.log(`Restore concluído: ${filePath}`);
