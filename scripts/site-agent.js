const fs = require("fs");
const path = require("path");
const { check } = require("./site-guardian");
const { createProposal } = require("./proposal-manager");

const ROOT = path.join(__dirname, "..");

function readJson(file, fallback) {
  try {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) return fallback;
    const raw = fs.readFileSync(full, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(ROOT, file), JSON.stringify(data, null, 2), "utf8");
}

function pendingSimilar(title) {
  const pending = readJson("data/pending-approvals.json", []);
  return pending.some(p => p.title === title && p.status === "pending");
}

function runAgent() {
  const report = check();

  if (!report.ok) {
    const title = "Correção técnica bloqueada pelo Guardian";

    if (!pendingSimilar(title)) {
      createProposal({
        urgency: "critical",
        riskLevel: "crítico",
        type: "technical",
        title,
        summary: "O Guardian encontrou falhas técnicas que podem prejudicar SEO, indexação, AdSense ou funcionamento do site.",
        whatChanged: ["Nenhuma mudança foi aplicada automaticamente."],
        whyChanged: report.failures,
        benefits: ["Evita deploy quebrado.", "Protege sitemap, rotas, posts e categorias.", "Reduz risco de queda no Google."],
        risks: ["Se ignorado, o site pode continuar com falhas técnicas."],
        financialImpact: {
          adsense: "pode ser prejudicado se páginas quebrarem",
          affiliate: "pode reduzir cliques se rotas falharem",
          seo: "risco alto se não corrigir",
          traffic: "risco alto se não corrigir",
          retention: "risco alto se páginas estiverem quebradas"
        },
        technicalImpact: report.failures,
        filesChanged: []
      });
    }

    console.log("❌ Guardian bloqueou. Proposta crítica criada ou já existente.");
    return;
  }

  const suggestions = readJson("data/admin-suggestions.json", []);
  const ideas = readJson("data/content-ideas.json", []);

  let suggestionsChanged = false;
  let ideasChanged = false;

  ideas.forEach((idea) => {
    if (!idea || idea.status === "done") return;

    const title = `Criar conteúdo: ${idea.title || idea.topic || "sem título"}`;

    if (!pendingSimilar(title)) {
      createProposal({
        urgency: idea.priority === "alta" ? "high" : "medium",
        riskLevel: "baixo",
        type: "content",
        title,
        summary: "Sugestão de conteúdo criada pelo dono do site.",
        whatChanged: [`Criar novo conteúdo sobre: ${idea.title || idea.topic}`],
        whyChanged: ["O dono do site sugeriu este tema como prioridade."],
        benefits: ["Aumenta cobertura SEO.", "Aumenta chance de tráfego orgânico.", "Fortalece autoridade no nicho."],
        risks: ["Precisa evitar duplicação com posts existentes."],
        financialImpact: {
          adsense: "pode aumentar impressões futuras",
          affiliate: "pode aumentar cliques se bem conectado",
          seo: "positivo",
          traffic: "positivo",
          retention: "positivo"
        },
        filesChanged: ["data/posts.json"]
      });
    }

    idea.status = "proposed";
    idea.updatedAt = new Date().toISOString();
    ideasChanged = true;
  });

  suggestions.forEach((suggestion) => {
    if (!suggestion || suggestion.status === "done") return;

    const title = `Melhoria sugerida: ${suggestion.area || "site"}`;

    if (!pendingSimilar(title)) {
      createProposal({
        urgency: suggestion.urgency || "medium",
        riskLevel: suggestion.riskLevel || "médio",
        type: "improvement",
        title,
        summary: suggestion.feedback || "Sugestão de melhoria registrada.",
        whatChanged: ["Nenhuma mudança aplicada ainda. Apenas proposta criada."],
        whyChanged: [suggestion.feedback || "Feedback do dono do site."],
        benefits: ["Permite melhorar o site sem perder controle."],
        risks: ["Mudanças visuais ou técnicas precisam ser revisadas antes de aplicar."],
        financialImpact: {
          adsense: "depende da mudança",
          affiliate: "depende da mudança",
          seo: "depende da mudança",
          traffic: "depende da mudança",
          retention: "depende da mudança"
        },
        filesChanged: []
      });
    }

    suggestion.status = "proposed";
    suggestion.updatedAt = new Date().toISOString();
    suggestionsChanged = true;
  });

  if (ideasChanged) writeJson("data/content-ideas.json", ideas);
  if (suggestionsChanged) writeJson("data/admin-suggestions.json", suggestions);

  console.log("✅ Site Agent rodou sem aplicar mudanças diretas.");
}

if (require.main === module) {
  runAgent();
}

module.exports = { runAgent };
