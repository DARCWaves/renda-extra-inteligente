const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = path.join(__dirname, "..", "..");

function filePath(file) {
  return path.join(ROOT, file);
}

function exists(file) {
  return fs.existsSync(filePath(file));
}

function read(file, fallback = "") {
  try {
    return fs.readFileSync(filePath(file), "utf8");
  } catch {
    return fallback;
  }
}

function run(command) {
  try {
    childProcess.execSync(command, { cwd: ROOT, stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: String(err.stderr || err.message || err)
    };
  }
}

function countRoute(code, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`app\\.get\\(["']${escaped}["']`, "g");
  return (code.match(regex) || []).length;
}

function validateXml(xml) {
  return (
    xml.trim().startsWith('<?xml version="1.0" encoding="UTF-8"?>') &&
    xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') &&
    !xml.toLowerCase().includes("<html")
  );
}

const { createReport } = require("../../config/reportSchema");

const { DATA_CLASSIFICATION } = require("../../config/dataClassification");

function performStructuralChecks(failures, passed, appCode) {
  const startTime = Date.now();
  const moduleFailures = [];
  const moduleWarnings = [];

  if (!exists("app.js")) moduleFailures.push("app.js não existe.");
  
  const syntaxApp = run("node -c app.js");
  if (!syntaxApp.ok) moduleFailures.push("app.js possui erro de sintaxe.");

  // Validação de Dados Baseada em Classificação
  Object.keys(DATA_CLASSIFICATION).forEach(file => {
    const config = DATA_CLASSIFICATION[file];
    const path = `data/${file}`;
    
    if (config.shouldCommit && !exists(path)) {
      moduleFailures.push(`Arquivo obrigatório ausente: ${path}`);
    }
  });

  const trustRoutes = ["/sobre", "/contato", "/privacidade", "/termos", "/editorial", "/transparencia"];
  trustRoutes.forEach(route => {
    if (countRoute(appCode, route) === 0) {
      moduleFailures.push(`Página de confiança obrigatória ausente em app.js: ${route}`);
    }
  });

  const sitemapRoutes = countRoute(appCode, "/sitemap.xml");
  if (sitemapRoutes !== 1) moduleFailures.push(`Quantidade inválida de rotas /sitemap.xml: ${sitemapRoutes}.`);

  ["views/home.ejs", "views/posts.ejs", "views/category.ejs", "views/post.ejs"].forEach((file) => {
    if (!exists(file)) moduleFailures.push(`${file} não existe.`);
  });

  // Preenche arrays globais por compatibilidade (legacy support)
  moduleFailures.forEach(f => failures.push(f));
  if (moduleFailures.length === 0) passed.push("Estrutura do site validada.");

  return createReport({
    service: "Structural Integrity",
    category: "infrastructure",
    score: moduleFailures.length > 0 ? 0 : 100,
    criticalIssues: moduleFailures,
    runtime: { executionTime: Date.now() - startTime }
  });
}

function readJson(file, fallback) {
  try {
    const raw = read(file, "");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

module.exports = {
  performStructuralChecks,
  run,
  exists,
  read,
  readJson,
  filePath,
  validateXml
};
