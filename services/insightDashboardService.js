/**
 * Serviço de Inteligência de Insights Autônomos.
 * O cérebro central que prioriza ações e diagnóstico estratégico.
 */

const { safeGet } = require("./runtimeValidationService");
const { sanitizeNumeric } = require("./realtimeIndicatorService");

/**
 * Agrega dados de todos os motores e gera insights priorizados.
 */
function generateAutonomousInsights(report) {
  const insights = {
    priorities: [],
    diagnosis: [],
    opportunities: [],
    health: {
      impactPotential: 0,
      stabilityScore: 0,
      sustainabilityIndex: 0,
      runtimeSafetyScore: 0
    }
  };

  if (!report) return insights;

  const auth = safeGet(report, "authorityMetrics", {});
  const seo = safeGet(report, "seoHealth", {});
  const monetization = safeGet(report, "monetization", {});
  const global = safeGet(auth, "global", {});
  const clusters = safeGet(auth, "clusters", {});

  // 1. Cálculo de Impact Potential (ROI de ações imediatas)
  const quickWinsCount = safeGet(seo, "intelligence.quickWinRoadmap", []).length;
  insights.health.impactPotential = sanitizeNumeric(quickWinsCount * 2);

  // 2. Identificação de Prioridades Máximas (Low effort / High impact)
  if (quickWinsCount > 0) {
    insights.priorities.push({
      action: "Executar Ciclo de SEO Patches",
      impact: "Alto",
      reason: `Existem ${quickWinsCount} melhorias rápidas que podem elevar o score global para ${safeGet(seo, "evolution.projected", 70)}%`
    });
  }

  // 3. Diagnóstico de Bottlenecks
  const weakClusters = Object.keys(clusters).filter(cat => clusters[cat].status === "Fraco" && clusters[cat].count > 0);
  if (weakClusters.length > 0) {
    insights.diagnosis.push({
      issue: "Gargalo de Autoridade",
      detail: `Clusters [${weakClusters.join(", ")}] possuem conteúdo mas autoridade não circula.`,
      fix: "Implementar interligação horizontal sugerida pelo Guardian."
    });
  }

  // 4. Oportunidades de Receita (Discover Readiness)
  const discoverStrength = safeGet(global, "discoverabilityStrength", 0);
  if (Number(discoverStrength) < 0.2) {
    insights.opportunities.push({
      type: "Google Discover",
      action: "Otimizar Headlines de alto potencial",
      benefit: "Captura de tráfego viral orgânico"
    });
  }

  // 5. Semantic Stability Score
  const cohesion = safeGet(global, "semanticCohesionGlobal", 0);
  const retention = safeGet(global, "averageRetention", 0);
  insights.health.stabilityScore = sanitizeNumeric(Math.round((Number(cohesion) + Number(retention)) * 50));

  // 6. Monetization Sustainability
  const trust = safeGet(global, "monetizationTrust", 0);
  const saturation = safeGet(monetization, "saturationRisk", 0);
  insights.health.sustainabilityIndex = sanitizeNumeric(Math.round(Number(trust) * (1 - Number(saturation))));

  // 7. Runtime Safety Score
  const failuresCount = safeGet(report, "failures", []).length;
  const warningsCount = safeGet(report, "warnings", []).length;
  insights.health.runtimeSafetyScore = sanitizeNumeric(Math.max(0, 100 - (failuresCount * 20) - (warningsCount * 2)));

  // 8. Performance & Healing Integration
  insights.health.performanceScore = safeGet(report, "global.performanceScore", 0);
  insights.health.healingEffectiveness = safeGet(report, "global.healingEffectiveness", 0);

  return insights;
}

module.exports = {
  generateAutonomousInsights
};
