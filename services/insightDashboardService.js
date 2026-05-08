/**
 * Serviço de Inteligência de Insights Autônomos.
 * O cérebro central que prioriza ações e diagnóstico estratégico.
 */

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
      sustainabilityIndex: 0
    }
  };

  if (!report || !report.authorityMetrics) return insights;

  const auth = report.authorityMetrics;
  const seo = report.seoHealth;
  const monetization = report.monetization;

  // 1. Cálculo de Impact Potential (ROI de ações imediatas)
  const quickWinsCount = seo.intelligence ? (seo.intelligence.quickWinRoadmap || []).length : 0;
  insights.health.impactPotential = Math.min(100, quickWinsCount * 2);

  // 2. Identificação de Prioridades Máximas (Low effort / High impact)
  if (quickWinsCount > 0) {
    insights.priorities.push({
      action: "Executar Ciclo de SEO Patches",
      impact: "Alto",
      reason: `Existem ${quickWinsCount} melhorias rápidas que podem elevar o score global para ${seo.evolution ? seo.evolution.projected : '70'}%`
    });
  }

  // 3. Diagnóstico de Bottlenecks
  const weakClusters = Object.keys(auth.clusters).filter(cat => auth.clusters[cat].status === "Fraco" && auth.clusters[cat].count > 0);
  if (weakClusters.length > 0) {
    insights.diagnosis.push({
      issue: "Gargalo de Autoridade",
      detail: `Clusters [${weakClusters.join(", ")}] possuem conteúdo mas autoridade não circula.`,
      fix: "Implementar interligação horizontal sugerida pelo Guardian."
    });
  }

  // 4. Oportunidades de Receita (Discover Readiness)
  const discoverStrength = auth.global.discoverabilityStrength;
  if (Number(discoverStrength) < 0.2) {
    insights.opportunities.push({
      type: "Google Discover",
      action: "Otimizar Headlines de alto potencial",
      benefit: "Captura de tráfego viral orgânico"
    });
  }

  // 5. Semantic Stability Score
  const cohesion = auth.global.semanticCohesionGlobal;
  const retention = auth.global.averageRetention;
  insights.health.stabilityScore = Math.round((Number(cohesion) + Number(retention)) * 50);

  // 6. Monetization Sustainability
  const trust = auth.global.monetizationTrust;
  const saturation = monetization.saturationRisk;
  insights.health.sustainabilityIndex = Math.round(Number(trust) * (1 - Number(saturation)));

  return insights;
}

module.exports = {
  generateAutonomousInsights
};
