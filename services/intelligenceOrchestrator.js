/**
 * Intelligence Orchestrator.
 * Orquestrador central de motores de inteligência e diagnóstico.
 * Coordena execução, evita leituras duplicadas e normaliza saídas.
 */

const { readJson } = require("./storageAdapter");
const { safeExecute } = require("./realtimeIndicatorService");
const { createReport } = require("../config/reportSchema");

// Motores de Inteligência
const seoService = require("./seoIntelligenceService");
const linkService = require("./internalLinkingService");
const authService = require("./authorityMetricsService");
const trafficService = require("./trafficIntelligenceService");
const monetizationService = require("./monetizationIntelligenceService");
const performanceService = require("./performanceEngine");
const refreshService = require("./contentRefreshService");

/**
 * Carrega o contexto compartilhado para todos os motores.
 */
function loadSharedContext() {
  return {
    posts: readJson("posts", []),
    pillars: readJson("pillars", []),
    affiliates: readJson("affiliates", []),
    analytics: readJson("analytics", {}),
    failures: readJson("runtime-failures", [])
  };
}

/**
 * Executa a orquestração completa da inteligência.
 * @returns {Object} Relatório unificado e orquestrado.
 */
function orchestrateIntelligence() {
  const startTime = Date.now();
  const context = loadSharedContext();
  const results = {};

  // 1. SEO Intelligence
  results.seo = safeExecute("Orchestrator [SEO]", () => {
    return seoService.analyzeGlobalHealth(context.posts);
  }, { averageScore: 0 });

  // 2. Internal Linking
  results.connectivity = safeExecute("Orchestrator [Linking]", () => {
    return linkService.analyzeConnectivity(context.posts, context.pillars);
  }, {});

  // 3. Authority Metrics
  results.authority = safeExecute("Orchestrator [Authority]", () => {
    return authService.calculateAuthorityMetrics(context.posts, context.pillars);
  }, {});

  // 4. Traffic & Intent
  results.traffic = safeExecute("Orchestrator [Traffic]", () => {
    return {
      freshness: trafficService.analyzeFreshnessCompetitiveness(context.posts),
      discoverReady: context.posts.filter(trafficService.isDiscoverReady).length,
      averageHeadlineScore: Math.round(context.posts.reduce((acc, p) => acc + trafficService.calculateHeadlineScore(p.title), 0) / Math.max(1, context.posts.length))
    };
  }, { averageHeadlineScore: 0 });

  // 5. Monetization
  results.monetization = safeExecute("Orchestrator [Monetization]", () => {
    return monetizationService.calculateRevenueEfficiency(context.posts);
  }, {});

  // 6. Performance
  results.performance = safeExecute("Orchestrator [Performance]", () => {
    return performanceService.evaluatePerformanceHealth(context.posts, context.pillars, results.connectivity);
  }, { score: 0 });

  // 7. Refresh Recommendations
  results.refresh = safeExecute("Orchestrator [Refresh]", () => {
    return refreshService.getRefreshRecommendations(context.posts);
  }, []);

  const globalScore = Math.round(
    ((results.seo.averageScore || 0) + 
     (results.authority.global?.averageClusterScore || 0) + 
     (results.performance.score || 0)) / 3
  );

  return createReport({
    service: "Intelligence Orchestrator",
    category: "orchestration",
    score: globalScore,
    metrics: {
      totalPosts: context.posts.length,
      totalPillars: context.pillars.length,
      knowledgeFlow: results.authority.global?.knowledgeFlowEfficiency,
      orphanReduction: results.authority.global?.orphanReduction
    },
    metadata: {
      raw: results,
      contextKeys: Object.keys(context)
    },
    runtime: {
      executionTime: Date.now() - startTime,
      recovered: false
    }
  });
}

module.exports = {
  orchestrateIntelligence,
  loadSharedContext
};
