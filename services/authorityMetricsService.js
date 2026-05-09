/**
 * Serviço de Métricas de Autoridade e Saúde de Cluster.
 * Analisa a conectividade semântica e distribuição de autoridade.
 */

const { 
  analyzeConnectivity, 
  generateSemanticPathways, 
  mapSemanticJourneys 
} = require("./internalLinkingService");

const { OFFICIAL_CATEGORIES } = require("../config/constants");
const { sanitizeNumeric, sanitizeObject } = require("./realtimeIndicatorService");
const { analyzeFreshnessCompetitiveness, calculateHeadlineScore, isDiscoverReady } = require("./trafficIntelligenceService");
const { calculateRevenueEfficiency } = require("./monetizationIntelligenceService");
const { evaluatePerformanceHealth } = require("./performanceEngine");
const { calculateHealingMetrics, syncFailureQueue } = require("./selfHealingEngine");

/**
 * Calcula métricas detalhadas para cada categoria/cluster.
 * @param {Array} posts - Lista de posts.
 * @param {Array} pillars - Lista de pilares.
 * @returns {Object} - Relatório de evolução de autoridade.
 */
function calculateAuthorityMetrics(posts, pillars) {
  const connectivity = analyzeConnectivity(posts, pillars);
  
  const clusterMetrics = {};
  let totalOrphans = 0;
  let crossClusterLinks = 0;

  OFFICIAL_CATEGORIES.forEach(cat => {
    const clusterPosts = posts.filter(p => p.category === cat);
    const count = clusterPosts.length;
    
    if (count === 0) {
      clusterMetrics[cat] = { score: 0, orphans: 0, status: "Vazio", maturityLevel: "Emergente" };
      return;
    }

    let clusterInLinks = 0;
    let clusterOrphans = 0;
    let clusterInternalConnectivity = 0;
    let totalOutLinksFromCluster = 0;

    clusterPosts.forEach(post => {
      const conn = connectivity[post.slug] || { inLinks: 0, outLinks: 0, sources: [] };
      clusterInLinks += conn.inLinks;
      totalOutLinksFromCluster += conn.outLinks;

      if (conn.inLinks === 0) {
        clusterOrphans++;
        totalOrphans++;
      }

      // Verifica se linka para outros posts da mesma categoria (Autoridade Retida)
      const sources = conn.sources || [];
      sources.forEach(s => {
        const sourceSlug = s.replace("pillar:", "");
        const sourcePost = posts.find(p => p.slug === sourceSlug) || pillars.find(p => p.slug === sourceSlug);
        
        if (sourcePost && sourcePost.category === cat) {
          clusterInternalConnectivity++;
        } else if (sourcePost) {
          crossClusterLinks++;
        }
      });
    });

    const hasPillar = pillars.some(p => p.category === cat);
    const pathways = generateSemanticPathways(posts, cat);
    
    // Novas Métricas de Ecossistema (Fase 7)
    const density = clusterInLinks / count;
    const pilarBonus = hasPillar ? 30 : 0;
    const strengthScore = Math.min(100, Math.round((density * 20) + (count * 2) + pilarBonus));
    
    clusterMetrics[cat] = {
      count,
      score: strengthScore,
      orphans: clusterOrphans,
      orphanRate: ((clusterOrphans / count) * 100).toFixed(1) + "%",
      internalLinks: clusterInternalConnectivity,
      hasPillar,
      maturityLevel: getMaturity(count, strengthScore, hasPillar),
      saturationIndex: (count / 50).toFixed(2),
      freshnessConfidence: calculateFreshness(clusterPosts),
      authorityRetention: totalOutLinksFromCluster > 0 ? (clusterInternalConnectivity / totalOutLinksFromCluster).toFixed(2) : 0,
      crawlEfficiency: ((count - clusterOrphans) / count).toFixed(2),
      semanticCohesion: (clusterInternalConnectivity / Math.max(1, clusterInLinks)).toFixed(2)
    };
  });

  const semanticJourneys = mapSemanticJourneys(posts, pillars);

  // Sincroniza fila de falhas antes do reporte
  syncFailureQueue();

  const discoverReadyCount = posts.filter(isDiscoverReady).length;
  const avgHeadlineScore = Math.round(posts.reduce((acc, p) => acc + calculateHeadlineScore(p.title), 0) / posts.length);
  const monetization = calculateRevenueEfficiency(posts);
  const performance = evaluatePerformanceHealth(posts, pillars, connectivity);
  const healing = calculateHealingMetrics();

  const report = {
    global: {
      orphanReduction: posts.length > 0 ? ((1 - (totalOrphans / posts.length)) * 100).toFixed(1) + "%" : "0%",
      averageClusterScore: sanitizeNumeric(Math.round(Object.values(clusterMetrics).reduce((acc, c) => acc + c.score, 0) / OFFICIAL_CATEGORIES.length)),
      knowledgeFlowEfficiency: sanitizeNumeric((crossClusterLinks / Math.max(1, posts.length)).toFixed(2), { max: 1 }),
      semanticCohesionGlobal: sanitizeNumeric((Object.values(clusterMetrics).reduce((acc, c) => acc + Number(c.semanticCohesion || 0), 0) / OFFICIAL_CATEGORIES.length).toFixed(2), { max: 1 }),
      crossClusterReinforcement: sanitizeNumeric((crossClusterLinks / 10).toFixed(2), { max: 10 }),
      trafficAttractionScore: sanitizeNumeric(avgHeadlineScore),
      freshnessCompetitiveness: sanitizeNumeric(analyzeFreshnessCompetitiveness(posts), { max: 1 }),
      discoverabilityStrength: sanitizeNumeric((discoverReadyCount / posts.length).toFixed(2), { max: 1 }),
      monetizationAlignment: sanitizeNumeric(monetization.globalAlignment),
      monetizationTrust: sanitizeNumeric(monetization.globalTrust),
      revenueFlowEfficiency: sanitizeNumeric((1 - monetization.saturationRisk).toFixed(2), { max: 1 }),
      performanceScore: performance.score,
      healingEffectiveness: healing.effectivenessScore,
      searchDominance: Math.round(Number(performance.metrics.crawlEfficiency) * 100)
    },
    clusters: clusterMetrics,
    semanticJourneys,
    semanticRisks: detectSemanticRisks(posts, pillars, clusterMetrics),
    growthOpportunities: detectGrowthOpportunities(posts, clusterMetrics),
    monetization: sanitizeObject(monetization, ["globalAlignment", "globalTrust", "saturationRisk"]),
    performance,
    healing
  };

  return report;
}

function getMaturity(count, score, hasPillar) {
  if (count > 40) return "Saturado";
  if (score > 85 && count > 20) return "Dominante";
  if (hasPillar && score > 60) return "Maduro";
  if (hasPillar || count > 10) return "Estruturado";
  return "Emergente";
}

/**
 * Calcula a confiança de frescor do cluster.
 */
function calculateFreshness(posts) {
  if (!posts.length) return 0;
  const now = Date.now();
  const avgAge = posts.reduce((acc, p) => {
    const age = now - new Date(p.updatedAt || p.createdAt || 0).getTime();
    return acc + age;
  }, 0) / posts.length;
  
  const sixMonths = 180 * 24 * 60 * 60 * 1000;
  return Math.max(0, (1 - (avgAge / (sixMonths * 2))).toFixed(2));
}

/**
 * Detecta oportunidades de crescimento baseado em momentum semântico.
 */
function detectGrowthOpportunities(posts, metrics) {
  const opportunities = [];
  Object.keys(metrics).forEach(cat => {
    const m = metrics[cat];
    if (m.maturityLevel === "Estruturado" && m.freshnessConfidence > 0.9 && m.authorityRetention > 0.5) {
      opportunities.push(`Momento de Expansão: Cluster "${cat}" está estável e retendo autoridade. Hora de subir para "Maduro".`);
    }
  });
  return opportunities;
}

/**
 * Detecta riscos de canibalização e sobreposição semântica.
 */
function detectSemanticRisks(posts, pillars, metrics) {
  const risks = [];
  
  // 1. Sobreposição de Títulos em Posts
  const titles = posts.map(p => p.title.toLowerCase());
  const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (duplicates.length > 0) {
    risks.push(`Canibalização Crítica: ${duplicates.length} títulos idênticos detectados.`);
  }

  // 2. Risco de Saturação e Concentração
  Object.keys(metrics).forEach(cat => {
    const m = metrics[cat];
    if (m.maturityLevel === "Saturado") {
      risks.push(`Saturação Detectada: Cluster "${cat}" precisa de sub-clusters para não diluir autoridade.`);
    }
    if (m.count > 0 && m.authorityRetention < 0.2 && m.maturityLevel !== "Emergente") {
      risks.push(`Vazamento de Autoridade: Cluster "${cat}" envia links para fora mas não se fortalece internamente.`);
    }
    if (m.score > 80 && !m.hasPillar) {
      risks.push(`Concentração sem Hub: Cluster "${cat}" é forte mas não possui um Pilar Mestre para ancorar a autoridade.`);
    }
  });

  return risks;
}

module.exports = {
  calculateAuthorityMetrics
};
