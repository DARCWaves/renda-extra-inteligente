const fs = require("fs");

const file = "app.js";

if (!fs.existsSync(file)) {
  console.error("❌ app.js não encontrado.");
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

function removeLineIncludes(source, text) {
  return source
    .split("\n")
    .filter(line => !line.includes(text))
    .join("\n");
}

function removeMarkedBlock(source, startMarker, endMarker) {
  let output = source;

  while (output.includes(startMarker) && output.includes(endMarker)) {
    const start = output.indexOf(startMarker);
    const end = output.indexOf(endMarker, start);

    if (start === -1 || end === -1) break;

    output = output.slice(0, start) + output.slice(end + endMarker.length);
  }

  return output;
}

function removeAppGetRoute(source, routePath) {
  let output = source;

  while (true) {
    const routeDouble = `app.get("${routePath}"`;
    const routeSingle = `app.get('${routePath}'`;

    let start = output.indexOf(routeDouble);
    if (start === -1) start = output.indexOf(routeSingle);
    if (start === -1) break;

    const braceStart = output.indexOf("{", start);
    if (braceStart === -1) {
      console.error(`❌ Rota ${routePath} encontrada, mas sem bloco válido.`);
      process.exit(1);
    }

    let depth = 0;
    let end = -1;

    for (let i = braceStart; i < output.length; i++) {
      if (output[i] === "{") depth++;
      if (output[i] === "}") depth--;

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

code = removeMarkedBlock(code, "/* SEO_SAFE_ROUTES_START */", "/* SEO_SAFE_ROUTES_END */");
code = removeLineIncludes(code, 'require("./sitemap-fix")');
code = removeLineIncludes(code, "require('./sitemap-fix')");
code = removeLineIncludes(code, 'require("./services/seoSitemapService")');
code = removeLineIncludes(code, "require('./services/seoSitemapService')");

code = removeAppGetRoute(code, "/sitemap.xml");
code = removeAppGetRoute(code, "/robots.txt");

const requireLine = 'const { generateSitemapXml, generateRobotsTxt } = require("./services/seoSitemapService");';

const requireMatches = [...code.matchAll(/^const .+require\(.+\);$/gm)];
if (requireMatches.length) {
  const last = requireMatches[requireMatches.length - 1];
  const pos = last.index + last[0].length;
  code = code.slice(0, pos) + "\n" + requireLine + code.slice(pos);
} else {
  code = requireLine + "\n" + code;
}

const seoRoutes = `
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

const markers = [
  "/*\n==================================================\n404",
  "/* ==================================================\n404",
  "app.use((req, res)",
  "module.exports = app;"
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
  code += "\n" + seoRoutes + "\n";
} else {
  code = code.slice(0, insertAt) + seoRoutes + "\n" + code.slice(insertAt);
}

fs.writeFileSync(file, code, "utf8");

console.log("✅ Rotas SEO antigas removidas e rotas blindadas inseridas sem duplicar.");
