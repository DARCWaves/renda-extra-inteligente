const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = path.join(__dirname, "..");

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

function readJson(file, fallback) {
  try {
    const raw = read(file, "");
    return raw.trim() ? JSON.parse(raw) : fallback;
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
    !xml.toLowerCase().includes("<html") &&
    !xml.toLowerCase().includes("post?id") &&
    !xml.toLowerCase().includes("draft")
  );
}

function check() {
  const failures = [];
  const warnings = [];
  const passed = [];

  const appCode = read("app.js", "");

  /*
  ==================================================
  SISTEMA E INFRAESTRUTURA
  ==================================================
  */

  if (!exists("app.js")) failures.push("app.js não existe.");
  else passed.push("app.js existe.");

  const syntaxApp = run("node -c app.js");
  if (!syntaxApp.ok) failures.push("app.js possui erro de sintaxe.");
  else passed.push("app.js sem erro de sintaxe.");

  const syncIoRegex = /fs\.read|fs\.write|fs\.exists/g;
  if ((appCode.match(syncIoRegex) || []).length > 2) {
    warnings.push("app.js usa muitas operações de IO síncronas diretamente. Considere usar StorageAdapter.");
  }

  /*
  ==================================================
  PÁGINAS DE CONFIANÇA (EEAT / ADSENSE)
  ==================================================
  */

  const trustRoutes = ["/sobre", "/contato", "/privacidade", "/termos", "/editorial", "/transparencia"];
  trustRoutes.forEach(route => {
    if (countRoute(appCode, route) === 0) {
      failures.push(`Página de confiança obrigatória ausente em app.js: ${route}`);
    } else {
      passed.push(`Rota de confiança detectada: ${route}`);
    }
  });

  const sitemapRoutes = countRoute(appCode, "/sitemap.xml");
  if (sitemapRoutes !== 1) failures.push(`Quantidade inválida de rotas /sitemap.xml: ${sitemapRoutes}.`);
  else passed.push("Rota /sitemap.xml única.");

  /*
  ==================================================
  INTEGRIDADE DE DADOS (POSTS)
  ==================================================
  */

  const postsPath = filePath("data/posts.json");
  if (exists("data/posts.json")) {
    const stats = fs.statSync(postsPath);
    const sizeMb = stats.size / (1024 * 1024);
    if (sizeMb > 1.5) {
      warnings.push(`posts.json está ficando grande (${sizeMb.toFixed(2)} MB). Considere migrar para DB.`);
    }
  }

  const posts = readJson("data/posts.json", []);
  if (!Array.isArray(posts)) failures.push("data/posts.json não é um array.");
  else passed.push("data/posts.json válido.");

  const categoryCount = {};
  const slugs = new Set();
  const OFFICIAL_CATEGORIES = ["financas", "renda-extra", "programacao", "investimentos", "economia", "trabalho"];

  if (Array.isArray(posts)) {
    posts.forEach((post, index) => {
      const id = post.slug || `index ${index}`;
      
      // Validação de estrutura
      if (!post.title) failures.push(`Post [${id}] sem title.`);
      if (!post.slug) failures.push(`Post [${id}] sem slug.`);
      else {
        if (slugs.has(post.slug)) failures.push(`Slug duplicado detectado: ${post.slug}`);
        slugs.add(post.slug);
      }

      if (!post.category) failures.push(`Post [${id}] sem category.`);
      else if (!OFFICIAL_CATEGORIES.includes(post.category)) {
        warnings.push(`Post [${id}] usa categoria não oficial: ${post.category}`);
      }

      if (!post.description && !post.seoDescription) {
        warnings.push(`Post [${id}] sem meta descrição (SEO).`);
      }

      const cat = String(post.category || "sem-categoria");
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Verificação de categorias críticas
    if (posts.length >= 10) {
      OFFICIAL_CATEGORIES.forEach((cat) => {
        if (!categoryCount[cat]) failures.push(`Categoria oficial sem conteúdo: ${cat}.`);
      });
    }
  }

  /*
  ==================================================
  INTEGRIDADE DE DADOS (AFILIADOS)
  ==================================================
  */

  const affiliates = readJson("data/affiliates.json", []);
  if (!Array.isArray(affiliates)) warnings.push("data/affiliates.json não é um array ou está ausente.");
  else {
    affiliates.forEach((aff, idx) => {
      if (!aff.id || !aff.url) warnings.push(`Afiliado índice ${idx} malformado.`);
    });
    passed.push("Base de afiliados validada.");
  }

  /*
  ==================================================
  SEO E RENDERING
  ==================================================
  */

  let seoHealth = null;
  let refreshRecommendations = [];
  let linkIntelligence = [];
  let seoPatches = [];
  let authorityMetrics = null;

  try {
    const { analyzeGlobalHealth } = require(filePath("services/seoIntelligenceService.js"));
    const { getRefreshRecommendations } = require(filePath("services/contentRefreshService.js"));
    const { analyzeConnectivity, generateLinkingOpportunities } = require(filePath("services/internalLinkingService.js"));
    const { generateSeoPatches, savePatches } = require(filePath("services/seoRefactorService.js"));
    const { calculateAuthorityMetrics } = require(filePath("services/authorityMetricsService.js"));
    const { getAllPillars } = require(filePath("services/pillarService.js"));
    
    seoHealth = analyzeGlobalHealth(posts);
    refreshRecommendations = getRefreshRecommendations(posts);
    
    const pillars = getAllPillars();
    const connectivity = analyzeConnectivity(posts);
    linkIntelligence = generateLinkingOpportunities(posts, connectivity);
    authorityMetrics = calculateAuthorityMetrics(posts, pillars);

    // Geração de Patches Sugeridos (Step 4.6)
    seoPatches = generateSeoPatches(posts, 5);
    savePatches(seoPatches);

    if (seoHealth.averageScore < 70) {
      warnings.push(`Saúde Global do SEO está baixa: ${seoHealth.averageScore}% (Ideal > 70%)`);
    } else {
      passed.push(`Saúde Global do SEO: ${seoHealth.averageScore}%`);
    }

    // Alertas de Autoridade de Cluster
    if (authorityMetrics && authorityMetrics.clusters) {
      Object.keys(authorityMetrics.clusters).forEach(cat => {
        const cluster = authorityMetrics.clusters[cat];
        if (cluster.status === "Fraco" && cluster.count > 0) {
          warnings.push(`[AUTORIDADE FRACA] Cluster "${cat}" tem baixa conectividade (${cluster.score} pts).`);
        }
      });
    }

    const lowScorePosts = seoHealth.priorityPosts || [];
    lowScorePosts.forEach(p => {
      warnings.push(`Post de baixa autoridade [${p.score}%]: ${p.slug}. Sugestão: ${p.improvements[0] || 'Melhorar SEO'}`);
    });

    if (seoHealth.intelligence) {
      const intel = seoHealth.intelligence;
      
      if (Array.isArray(intel.orphans)) {
        intel.orphans.forEach(slug => {
          warnings.push(`Conteúdo Órfão detectado (sem links internos): ${slug}`);
        });
      }

      if (Array.isArray(intel.patternWarnings)) {
        intel.patternWarnings.forEach(p => {
          warnings.push(`[PADRÃO IA] ${p}`);
        });
      }
    }

    // Alertas de Conectividade Específica
    const criticalOrphans = linkIntelligence.filter(l => l.isOrphan).slice(0, 5);
    criticalOrphans.forEach(o => {
      const bestOp = o.opportunities[0];
      if (bestOp) {
        warnings.push(`[Oportunidade Link] Vincular ${bestOp.targetSlug} -> ${o.slug} (${bestOp.reason})`);
      }
    });

    const highPriority = refreshRecommendations.filter(r => r.priority === "Alta").slice(0, 3);
    highPriority.forEach(r => {
      warnings.push(`[REFRESH RECOMENDADO] ${r.slug}: ${r.recommendations[0]}`);
    });

  } catch (err) {
    warnings.push(`Não foi possível calcular inteligência SEO/Refresh: ${err.message}`);
  }

  if (exists("services/seoSitemapService.js")) {
    try {
      const { generateSitemapXml, generateRobotsTxt } = require(filePath("services/seoSitemapService.js"));
      const xml = generateSitemapXml();
      const robots = generateRobotsTxt();

      if (!validateXml(xml)) failures.push("Sitemap gerado não passou na validação XML.");
      else passed.push("Sitemap XML válido.");

      if (!robots.includes("Sitemap:") || !robots.includes("/sitemap.xml")) {
        failures.push("Robots gerado não aponta para sitemap.xml.");
      } else {
        passed.push("Robots aponta para sitemap.xml.");
      }
    } catch (err) {
      failures.push(`Erro ao gerar sitemap/robots: ${err.message}`);
    }
  }

  ["views/home.ejs", "views/posts.ejs", "views/category.ejs", "views/post.ejs"].forEach((file) => {
    if (!exists(file)) failures.push(`${file} não existe.`);
    else passed.push(`${file} existe.`);
  });

  const report = {
    ok: failures.length === 0,
    passed,
    warnings,
    failures,
    categoryCount,
    seoHealth,
    refreshRecommendations,
    linkIntelligence,
    seoPatches,
    authorityMetrics,
    checkedAt: new Date().toISOString(),
    posts: posts.map(p => ({ slug: p.slug, title: p.title })) // Minimal data for reporting
  };

  // Fase 10: Autonomous Insight Integration
  try {
    const { generateAutonomousInsights } = require(filePath("services/insightDashboardService.js"));
    report.autonomousInsights = generateAutonomousInsights(report);
  } catch (err) {
    warnings.push(`Falha ao gerar insights autônomos: ${err.message}`);
  }

  fs.writeFileSync(filePath("data/guardian-report.json"), JSON.stringify(report, null, 2));

  return report;
}

if (require.main === module) {
  const report = check();

  console.log("\n========== AUTONOMOUS OPERATIONAL INTELLIGENCE CORE ==========");
  console.log(`Status do Sistema: ${report.ok ? "✅ ÍNTEGRO" : "❌ BLOQUEADO"}`);

  if (report.autonomousInsights) {
    const ai = report.autonomousInsights;
    console.log("\n🧠 DIAGNÓSTICO ESTRATÉGICO:");
    console.log(`- Score de Estabilidade: ${ai.health.stabilityScore}%`);
    console.log(`- Potencial de Impacto (ROI): ${ai.health.impactPotential}%`);
    console.log(`- Sustentabilidade de Receita: ${ai.health.sustainabilityIndex}%`);

    if (ai.priorities.length) {
      console.log("\n🔥 FILA DE AÇÃO EDITORIAL (ALTA PRIORIDADE):");
      ai.priorities.forEach(p => console.log(`   └─ [${p.impact}] ${p.action}: ${p.reason}`));
    }

    if (ai.diagnosis.length) {
      console.log("\n🔍 GARGALOS DETECTADOS:");
      ai.diagnosis.forEach(d => console.log(`   └─ ${d.issue}: ${d.detail}`));
    }
  }

  if (report.authorityMetrics) {
    console.log("\n🌐 SEMANTIC ECOSYSTEM STABILITY REPORT");
    console.log(`- Redução de Órfãos: ${report.authorityMetrics.global.orphanReduction}`);
    console.log(`- Eficiência de Fluxo (Knowledge Flow): ${Math.round(report.authorityMetrics.global.knowledgeFlowEfficiency * 100)}%`);
    console.log(`- Coesão Semântica Global: ${Math.round(report.authorityMetrics.global.semanticCohesionGlobal * 100)}%`);
    console.log(`- Reforço Inter-Cluster: ${report.authorityMetrics.global.crossClusterReinforcement}`);
    console.log(`- Score Médio de Cluster: ${report.authorityMetrics.global.averageClusterScore} pts`);
    
    if (report.semanticJourneys && report.semanticJourneys.length) {
      console.log("\n🗺️ JORNADAS SEMÂNTICAS ATIVAS:");
      report.semanticJourneys.forEach(j => {
        console.log(`   └─ ${j.name}: ${j.steps.join(" ➔ ")}`);
      });
    }

    if (report.authorityMetrics.semanticRisks && report.authorityMetrics.semanticRisks.length) {
      console.log("\n⚠️ RISCOS SEMÂNTICOS DETECTADOS:");
      report.authorityMetrics.semanticRisks.forEach(r => console.log(`   └─ ${r}`));
    }

    console.log("\n🚀 TRAFFIC ACQUISITION INTELLIGENCE");
    console.log(`- Score de Atração (CTR): ${report.authorityMetrics.global.trafficAttractionScore}%`);
    console.log(`- Competitividade (Frescor): ${Math.round(report.authorityMetrics.global.freshnessCompetitiveness * 100)}%`);
    console.log(`- Força de Descoberta (Discover): ${Math.round(report.authorityMetrics.global.discoverabilityStrength * 100)}%`);

    console.log("\n💰 MONETIZATION INTELLIGENCE");
    console.log(`- Alinhamento de Intenção: ${report.authorityMetrics.global.monetizationAlignment}%`);
    console.log(`- Score de Confiança (Trust): ${report.authorityMetrics.global.monetizationTrust}%`);
    console.log(`- Eficiência de Fluxo: ${Math.round(report.authorityMetrics.global.revenueFlowEfficiency * 100)}%`);

    if (report.authorityMetrics.monetization && report.authorityMetrics.monetization.saturationRisk > 0.1) {
      warnings.push(`[RISCO MONETIZAÇÃO] Saturação de Afiliados detectada em ${Math.round(report.authorityMetrics.monetization.saturationRisk * 100)}% dos posts.`);
    }

    const { recommendHeadlineUpgrade } = require(filePath("services/trafficIntelligenceService.js"));
    const upgrades = report.posts.map(p => ({ slug: p.slug, reco: recommendHeadlineUpgrade(p) })).filter(u => u.reco).slice(0, 3);
    if (upgrades.length) {
      console.log("\n--- Sugestões de Headline (Captura de Intent) ---");
      upgrades.forEach(u => console.log(`⚡ [${u.slug}] ${u.reco}`));
    }

    console.log("\n--- Saúde por Categoria ---");
    Object.keys(report.authorityMetrics.clusters).forEach(cat => {
      const c = report.authorityMetrics.clusters[cat];
      const icon = c.maturityLevel === "Dominante" ? "🔥" : c.maturityLevel === "Maduro" ? "👑" : c.maturityLevel === "Estruturado" ? "💎" : "🌱";
      console.log(`${icon} [${cat.toUpperCase()}]: ${c.score} pts | ${c.count} posts | ${c.maturityLevel}`);
      console.log(`   └─ Coesão: ${Math.round(c.semanticCohesion * 100)}% | Retenção: ${Math.round(c.authorityRetention * 100)}% | Crawl: ${Math.round(c.crawlEfficiency * 100)}%`);
      console.log(`   └─ Saturação: ${Math.round(c.saturationIndex * 100)}% | Freshness: ${Math.round(c.freshnessConfidence * 100)}%`);
      if (c.orphans > 0) console.log(`   └─ Órfãos: ${c.orphans} (${c.orphanRate})`);
    });
  }

  if (report.failures.length) {
    console.log("\nFalhas:");
    report.failures.forEach((item) => console.log("❌ " + item));
  }

  if (report.warnings.length) {
    console.log("\nAlertas:");
    report.warnings.forEach((item) => console.log("⚠️ " + item));
  }

  if (report.seoHealth) {
    console.log(`\nSEO Score Médio: ${report.seoHealth.averageScore}%`);
    
    if (report.seoHealth.evolution) {
      const evo = report.seoHealth.evolution;
      console.log(`🎯 Meta de Recuperação: ${evo.target}%`);
      console.log(`📈 Potencial com Quick-Wins: ${evo.projected}% (Gap: ${evo.gap}%)`);
    }

    console.log("\n🚀 ASSISTED EDITOR MODE: SEO RECOVERY ROADMAP");
    
    if (report.seoHealth.priorityPosts && report.seoHealth.priorityPosts.length) {
      console.log("--- Posts com maior potencial de ganho ---");
      const { suggestAnchorTexts } = require(filePath("services/seoIntelligenceService.js"));
      
      report.seoHealth.priorityPosts.slice(0, 5).forEach(p => {
        console.log(`[${p.score}% -> 100%] ${p.slug}`);
        p.improvements.slice(0, 2).forEach(imp => console.log(`   - ${imp}`));
        
        const anchors = suggestAnchorTexts(p);
        console.log(`   🔗 Âncoras sugeridas: "${anchors.join('", "')}"`);
      });
    }

    if (report.seoHealth.intelligence && report.seoHealth.intelligence.quickWinRoadmap) {
      const qws = report.seoHealth.intelligence.quickWinRoadmap;
      if (qws.length) {
        console.log("\n--- Quick-Wins sugeridos (Fáceis de aplicar) ---");
        qws.slice(0, 8).forEach(qw => {
          console.log(`⚡ [${qw.slug}] ${qw.msg} (+${qw.impact} pts)`);
        });
      }
    }

    if (report.seoPatches && report.seoPatches.length) {
      console.log("\n--- SEO RECOVERY PATCHES (Prontos para aprovação) ---");
      report.seoPatches.forEach(p => {
        console.log(`🛠️ [PATCH] ${p.slug}: Score ${p.currentScore}% ➔ ${p.projectedScore}% (Confiança: ${p.confidence})`);
        Object.keys(p.changes).forEach(key => {
          console.log(`   └─ Sugestão ${key}: ${String(p.changes[key]).substring(0, 60)}...`);
        });
      });
    }
  }

  console.log("\nCategorias:");
  console.log(report.categoryCount);

  process.exit(report.ok ? 0 : 1);
}

module.exports = { check };
