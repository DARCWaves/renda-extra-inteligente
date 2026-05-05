const fs = require("fs");
const cp = require("child_process");

const APP_FILE = "app.js";

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function tryExec(command) {
  try {
    return cp.execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function scoreApp(code) {
  let score = 0;

  if (code.includes('require("express")') || code.includes("require('express')")) score += 40;
  if (code.includes("express-ejs-layouts")) score += 40;
  if (code.includes('app.set("view engine", "ejs")') || code.includes("app.set('view engine', 'ejs')")) score += 45;
  if (code.includes("app.use(expressLayouts)")) score += 35;
  if (code.includes('app.set("layout", "layout")') || code.includes("app.set('layout', 'layout')")) score += 25;
  if (code.includes('res.render("home"') || code.includes("res.render('home'")) score += 40;
  if (code.includes('app.get("/", async') || code.includes("app.get('/', async") || code.includes('app.get("/",')) score += 30;
  if (code.includes('app.get("/posts"') || code.includes("app.get('/posts'")) score += 20;
  if (code.includes('app.get("/post/:slug"') || code.includes("app.get('/post/:slug'")) score += 20;
  if (code.includes('app.get("/categoria/:categoria"') || code.includes("app.get('/categoria/:categoria'")) score += 20;
  if (code.includes('app.get("/indicadores"') || code.includes("app.get('/indicadores'")) score += 20;
  if (code.includes("getEconomicData")) score += 15;
  if (code.includes("getLatestPosts")) score += 15;
  if (code.includes("getAffiliatesForContext")) score += 15;
  if (code.includes("module.exports = app")) score += 40;

  if (code.includes("views/home.html")) score -= 250;
  if (code.includes("home.html")) score -= 180;
  if (code.includes("res.sendFile") && code.includes("views")) score -= 100;
  if (code.includes("SENDSTREAM_SAFE_FIX_START")) score -= 80;
  if (code.includes("app.listen(") && code.includes("module.exports = app")) score -= 40;
  if (!code.includes("module.exports = app")) score -= 120;

  return score;
}

function collectCandidates() {
  const candidates = [];

  if (fs.existsSync(APP_FILE)) {
    candidates.push({
      source: "atual:app.js",
      code: read(APP_FILE),
      type: "file"
    });
  }

  fs.readdirSync(".")
    .filter(name => /^app\.js\.bak/.test(name))
    .forEach(name => {
      candidates.push({
        source: `backup:${name}`,
        code: read(name),
        type: "backup"
      });
    });

  const hashes = tryExec("git rev-list --max-count=30 HEAD")
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  hashes.forEach(hash => {
    const code = tryExec(`git show ${hash}:app.js`);
    if (code) {
      candidates.push({
        source: `git:${hash}`,
        code,
        type: "git"
      });
    }
  });

  return candidates
    .map(item => ({ ...item, score: scoreApp(item.code) }))
    .sort((a, b) => b.score - a.score);
}

function removeMarkedBlock(source, startMarker, endMarker) {
  let output = source;

  while (output.includes(startMarker) && output.includes(endMarker)) {
    const start = output.indexOf(startMarker);
    const end = output.indexOf(endMarker, start);
    output = output.slice(0, start) + output.slice(end + endMarker.length);
  }

  return output;
}

function removeLinesContaining(source, fragments) {
  return source
    .split("\n")
    .filter(line => !fragments.some(fragment => line.includes(fragment)))
    .join("\n");
}

function removeAppGetRoute(source, routePath) {
  let output = source;

  while (true) {
    const patterns = [
      `app.get("${routePath}"`,
      `app.get('${routePath}'`
    ];

    let start = -1;

    for (const pattern of patterns) {
      const idx = output.indexOf(pattern);
      if (idx !== -1 && (start === -1 || idx < start)) start = idx;
    }

    if (start === -1) break;

    const braceStart = output.indexOf("{", start);

    if (braceStart === -1) {
      console.error(`❌ Rota ${routePath} encontrada, mas sem bloco válido.`);
      process.exit(1);
    }

    let depth = 0;
    let end = -1;
    let inString = false;
    let stringChar = "";
    let escaped = false;

    for (let i = braceStart; i < output.length; i++) {
      const char = output[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === stringChar) {
          inString = false;
          stringChar = "";
        }
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "{") depth++;
      if (char === "}") depth--;

      if (depth === 0) {
        let j = i + 1;
        while (j < output.length && /\s/.test(output[j])) j++;

        if (output.slice(j, j + 2) === ");") {
          end = j + 2;
          break;
        }
      }
    }

    if (end === -1) {
      console.error(`❌ Não consegui remover rota antiga ${routePath} com segurança.`);
      process.exit(1);
    }

    output = output.slice(0, start) + output.slice(end);
  }

  return output;
}

function insertRequire(code) {
  const requireLine = 'const { generateSitemapXml, generateRobotsTxt } = require("./services/seoSitemapService");';

  code = removeLinesContaining(code, [
    'require("./sitemap-fix")',
    "require('./sitemap-fix')",
    'require("./services/seoSitemapService")',
    "require('./services/seoSitemapService')"
  ]);

  if (code.includes(requireLine)) return code;

  const matches = [...code.matchAll(/^const .+require\(.+\);$/gm)];

  if (!matches.length) return requireLine + "\n" + code;

  const last = matches[matches.length - 1];
  const pos = last.index + last[0].length;

  return code.slice(0, pos) + "\n" + requireLine + code.slice(pos);
}

function insertSeoRoutes(code) {
  const block = `
/* SEO_SAFE_ROUTES_START */

/*
==================================================
SEO TÉCNICO — SITEMAP E ROBOTS BLINDADOS
==================================================
*/

app.get("/sitemap.xml", (req, res) => {
  try {
    const xml = generateSitemapXml();

    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.send(xml);
  } catch (err) {
    console.error("ERRO SITEMAP XML:", err);

    res.status(500);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");

    return res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

app.get("/robots.txt", (req, res) => {
  try {
    const robots = generateRobotsTxt();

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.send(robots);
  } catch (err) {
    console.error("ERRO ROBOTS TXT:", err);

    res.status(500);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    return res.send("User-agent: *\\nAllow: /\\n");
  }
});

/* SEO_SAFE_ROUTES_END */
`;

  code = removeMarkedBlock(code, "/* SEO_SAFE_ROUTES_START */", "/* SEO_SAFE_ROUTES_END */");
  code = removeMarkedBlock(code, "/* SENDSTREAM_SAFE_FIX_START */", "/* SENDSTREAM_SAFE_FIX_END */");
  code = removeAppGetRoute(code, "/sitemap.xml");
  code = removeAppGetRoute(code, "/robots.txt");

  const markers = [
    "/*\n==================================================\n404",
    "/* ==================================================\n404",
    "\napp.use((req, res) =>",
    "\nmodule.exports = app;"
  ];

  let insertAt = -1;

  for (const marker of markers) {
    const idx = code.indexOf(marker);
    if (idx !== -1) {
      insertAt = idx;
      break;
    }
  }

  if (insertAt === -1) {
    return code + "\n" + block + "\n";
  }

  return code.slice(0, insertAt) + block + "\n" + code.slice(insertAt);
}

function validateFinal(code) {
  const errors = [];

  if (!code.includes('require("express")') && !code.includes("require('express')")) errors.push("sem Express");
  if (!code.includes('app.set("view engine", "ejs")') && !code.includes("app.set('view engine', 'ejs')")) errors.push("sem view engine EJS");
  if (!code.includes("app.use(expressLayouts)")) errors.push("sem expressLayouts");
  if (!code.includes('res.render("home"') && !code.includes("res.render('home'")) errors.push("sem renderização home.ejs");
  if (!code.includes('app.get("/sitemap.xml"')) errors.push("sem rota sitemap");
  if (!code.includes('app.get("/robots.txt"')) errors.push("sem rota robots");
  if (code.includes("home.html")) errors.push("ainda contém home.html");
  if (code.includes("SENDSTREAM_SAFE_FIX_START")) errors.push("ainda contém patch SendStream antigo");
  if (!code.includes("module.exports = app")) errors.push("sem export do app");

  const sitemapCount = (code.match(/app\.get\(["']\/sitemap\.xml["']/g) || []).length;
  const robotsCount = (code.match(/app\.get\(["']\/robots\.txt["']/g) || []).length;

  if (sitemapCount !== 1) errors.push(`sitemap duplicado ou ausente: ${sitemapCount}`);
  if (robotsCount !== 1) errors.push(`robots duplicado ou ausente: ${robotsCount}`);

  return errors;
}

const candidates = collectCandidates();

if (!candidates.length) {
  console.error("❌ Nenhum app.js candidato encontrado.");
  process.exit(1);
}

console.log("📊 Candidatos encontrados:");
candidates.slice(0, 8).forEach((item, index) => {
  console.log(`${index + 1}. score=${item.score} source=${item.source}`);
});

const best = candidates[0];

if (best.score < 120) {
  console.error("❌ Nenhum app.js saudável encontrado. Envie seu app.js atual antes de continuar.");
  process.exit(1);
}

const backupName = `app.js.bak-before-restore-${Date.now()}`;

if (fs.existsSync(APP_FILE)) {
  fs.copyFileSync(APP_FILE, backupName);
  console.log(`🛡️ Backup do app atual criado: ${backupName}`);
}

let finalCode = best.code;

finalCode = finalCode.replace(/views\/home\.html/g, "views/home.ejs");
finalCode = finalCode.replace(/home\.html/g, "home.ejs");

finalCode = insertRequire(finalCode);
finalCode = insertSeoRoutes(finalCode);

const errors = validateFinal(finalCode);

if (errors.length) {
  console.error("❌ Validação do app final falhou:");
  errors.forEach(err => console.error(" - " + err));
  console.error("Nada foi salvo no app.js.");
  process.exit(1);
}

write(APP_FILE, finalCode);

console.log(`✅ app.js restaurado a partir de: ${best.source}`);
console.log("✅ Lógica principal preservada e SEO técnico aplicado sem duplicatas.");
