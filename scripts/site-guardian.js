/**
 * Autonomous Operational & Runtime Intelligence Core.
 * Orquestrador modular de validações e diagnósticos.
 */

const { 
  performStructuralChecks, 
  readJson, 
  filePath, 
  exists 
} = require("./guardian/structuralChecks");

const { 
  performRuntimeChecks, 
  simulateRendering 
} = require("./guardian/runtimeChecks");

const { performSeoChecks } = require("./guardian/seoChecks");
const { performAuthorityChecks } = require("./guardian/authorityChecks");
const { performMonetizationChecks } = require("./guardian/monetizationChecks");
const { performPerformanceChecks } = require("./guardian/performanceChecks");
const { composeFinalReport } = require("./guardian/reportComposer");

const { safeGet, classifyRuntimeError } = require("../services/runtimeValidationService");
const { OFFICIAL_CATEGORIES } = require("../config/constants");

const { safeExecute, getServiceHealthStatus, getRecoveryLog } = require("../services/realtimeIndicatorService");
const { orchestrateIntelligence } = require("../services/intelligenceOrchestrator");

const { generateAutonomousInsights } = require("../services/insightDashboardService");
const { getRuntimeFailures } = require("../services/runtimeValidationService");

// Motores de Inteligência (Centralizados para orquestração futura)
const seoService = require("../services/seoIntelligenceService");
const refreshService = require("../services/contentRefreshService");
const linkService = require("../services/internalLinkingService");
const refactorService = require("../services/seoRefactorService");
const authService = require("../services/authorityMetricsService");
const pillarService = require("../services/pillarService");

/**
 * Scanner de Integridade de Dados.
 */
function validateDataIntegrity() {
  const files = ["posts.json", "analytics.json", "pillars.json", "affiliates.json"];
  const issues = [];
  
  files.forEach(file => {
    try {
      const data = readJson(`data/${file}`, null);
      if (data === null && file !== "analytics.json") issues.push(`Arquivo corrompido ou ausente: ${file}`);
      else if (file === "posts.json" && !Array.isArray(data)) issues.push(`Estrutura inválida em posts.json (esperado Array)`);
    } catch (err) {
      issues.push(`Erro crítico de leitura em ${file}: ${err.message}`);
    }
  });

  return issues;
}

function check() {
  const failures = [];
  const warnings = [];
  const passed = [];

  const structuralModule = require("./guardian/structuralChecks");
  const appCode = structuralModule.read("app.js", "");

  /*
  ==================================================
  PHASE 10.1: RUNTIME & INTEGRITY PRE-CHECK
  ==================================================
  */
  
  const integrityIssues = validateDataIntegrity();
  if (integrityIssues.length > 0) {
    integrityIssues.forEach(issue => failures.push(`[INTEGRIDADE] ${issue}`));
  } else {
    passed.push("Integridade de dados JSON validada.");
  }

  const runtimeReport = performRuntimeChecks(failures, passed);

  /*
  ==================================================
  SISTEMA E INFRAESTRUTURA
  ==================================================
  */

  const structReport = performStructuralChecks(failures, passed, appCode);

  const syncIoRegex = /fs\.read|fs\.write|fs\.exists/g;
  if ((appCode.match(syncIoRegex) || []).length > 5) {
    warnings.push("app.js usa muitas operações de IO síncronas diretamente. Considere usar StorageAdapter.");
  }

  /*
  ==================================================
  INTEGRIDADE DE DADOS (POSTS)
  ==================================================
  */

  const posts = structuralModule.readJson("data/posts.json", []);
  const categoryCount = {};
  const slugs = new Set();

  if (Array.isArray(posts)) {
    posts.forEach((post, index) => {
      const id = post.slug || `index ${index}`;
      
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

      const cat = String(post.category || "sem-categoria");
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    if (posts.length >= 10) {
      OFFICIAL_CATEGORIES.forEach((cat) => {
        if (!categoryCount[cat]) failures.push(`Categoria oficial sem conteúdo: ${cat}.`);
      });
    }
  }

  /*
  ==================================================
  SEO, AUTORIDADE E MOMENTUM (SELF-HEALING WRAPPER)
  ==================================================
  */

  let seoHealth = null;
  let refreshRecommendations = [];
  let linkIntelligence = [];
  let seoPatches = [];
  let authorityMetrics = null;

  let seoReport, authReport, monetizationReport, perfReport;

  seoReport = performSeoChecks(posts, seoService.analyzeGlobalHealth, warnings, passed);
  seoHealth = seoReport.metadata; // Preserva objeto original para dashboard

  refreshRecommendations = safeExecute("Content Refresh", () => refreshService.getRefreshRecommendations(posts), []);
  
  const pillars = safeExecute("Pillar Service", () => pillarService.getAllPillars(), []);
  const connectivity = safeExecute("Connectivity Analyzer", () => linkService.analyzeConnectivity(posts, pillars), {});
  linkIntelligence = safeExecute("Internal Linking", () => linkService.generateLinkingOpportunities(posts, connectivity), []);
  
  authorityMetrics = safeExecute("Authority Metrics", () => authService.calculateAuthorityMetrics(posts, pillars), {});
  authReport = performAuthorityChecks(authorityMetrics, warnings, passed);

  seoPatches = safeExecute("SEO Refactor", () => refactorService.generateSeoPatches(posts, 5), []);
  if (seoPatches.length > 0) refactorService.savePatches(seoPatches);

  monetizationReport = performMonetizationChecks(authorityMetrics.monetization, warnings, passed);
  perfReport = performPerformanceChecks(authorityMetrics.performance, warnings, passed);

  // Alertas de Conectividade Específica
  if (Array.isArray(linkIntelligence)) {
    linkIntelligence.filter(l => l.isOrphan).slice(0, 3).forEach(o => {
      const bestOp = o.opportunities ? o.opportunities[0] : null;
      if (bestOp) warnings.push(`[Oportunidade Link] Vincular ${bestOp.targetSlug} -> ${o.slug}`);
    });
  }

  /*
  ==================================================
  PHASE 11.2: ROUTE RENDERING SIMULATION (EJS)
  ==================================================
  */

  const renderReport = simulateRendering(passed, safeExecute);

  /*
  ==================================================
  ESTRUTURA FINAL DO RELATÓRIO (BI)
  ==================================================
  */

  const moduleReports = {
    structural: structReport,
    runtime: runtimeReport,
    rendering: renderReport,
    seo: seoReport,
    authority: authReport,
    monetization: monetizationReport,
    performance: perfReport
  };

  const globalScore = Math.round(
    Object.values(moduleReports).reduce((acc, r) => acc + (r ? (r.score || 0) : 0), 0) / 
    simulateRendering(passed, safeExecute);

    let orchestratedResult = null;
    if (process.env.USE_ORCHESTRATOR === "true") {
      orchestratedResult = safeExecute("Full Orchestration", () => orchestrateIntelligence(), null);
      if (orchestratedResult) passed.push("Orquestração de inteligência centralizada concluída.");
    }

    const report = {
      ok: failures.length === 0,
      globalScore,
      orchestrated: orchestratedResult,
      passed,
      warnings,
      failures,
      categoryCount,
      moduleReports,
      seoHealth,
      refreshRecommendations,
      linkIntelligence,
      seoPatches,
      authorityMetrics,
      serviceHealth: getServiceHealthStatus(),
      recoveryLog: getRecoveryLog(),
      checkedAt: new Date().toISOString(),
      posts: posts.map(p => ({ slug: p.slug, title: p.title }))
    };
  };

  // Fase 10: Autonomous Insight Integration
  try {
    const { generateAutonomousInsights } = require("../services/insightDashboardService");
    const { getRuntimeFailures } = require("../services/runtimeValidationService");
    
    report.autonomousInsights = generateAutonomousInsights(report);
    report.runtimeAnomalies = getRuntimeFailures();
  } catch (err) {
    const errorInfo = classifyRuntimeError(err);
    warnings.push(`Falha ao gerar insights autônomos: ${errorInfo.message}`);
  }

  composeFinalReport(report, structuralModule.filePath("data/guardian-report.json"));

  return report;
}

if (require.main === module) {
  check();
}

module.exports = { check };
