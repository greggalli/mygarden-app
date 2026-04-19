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

function resolvePath(value, fallbackRelativeToBackend) {
  const raw = (value || fallbackRelativeToBackend).trim();
  return path.isAbsolute(raw) ? raw : path.resolve(backendRoot, raw);
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
  dbPath: resolvePath(process.env.DB_PATH, "../data/db/garden.sqlite"),
  imageDir: resolvePath(process.env.IMAGE_DIR, "../data/images"),
  corsOrigin: process.env.CORS_ORIGIN || "*"
};

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.imageDir, { recursive: true });
fs.mkdirSync(path.join(config.imageDir, "species"), { recursive: true });

module.exports = { config };
