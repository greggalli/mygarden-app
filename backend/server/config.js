const fs = require("fs");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadDotEnv(path.join(backendRoot, ".env"));

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT || "5432";
  const db = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const pass = process.env.POSTGRES_PASSWORD;
  if (!host && !db && !user && !pass) return null;
  if (!host || !db || !user || !pass) {
    throw new Error("Incomplete PostgreSQL configuration. Use DATABASE_URL or set POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD.");
  }
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

function parsePort(rawPort) {
  const port = Number.parseInt(rawPort || "3000", 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }
  return port;
}

const config = {
  backendRoot,
  projectRoot,
  port: parsePort(process.env.PORT),
  databaseUrl: buildDatabaseUrl(),
  corsOrigin: process.env.CORS_ORIGIN || "*"
};

module.exports = { config };
