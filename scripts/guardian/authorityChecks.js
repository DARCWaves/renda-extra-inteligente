const { createReport } = require("../../config/reportSchema");

function performAuthorityChecks(authorityMetrics, warnings, passed) {
  const startTime = Date.now();
  const moduleWarnings = [];

  if (!authorityMetrics || !authorityMetrics.clusters) {
    return createReport({ service: "Authority Metrics", status: "warning", warnings: ["Métricas não disponíveis"] });
  }

  Object.keys(authorityMetrics.clusters).forEach(cat => {
    const cluster = authorityMetrics.clusters[cat];
    if (cluster.status === "Fraco" && cluster.count > 0) {
      moduleWarnings.push(`[AUTORIDADE FRACA] Cluster "${cat}" tem baixa conectividade (${cluster.score} pts).`);
    }
  });

  const orphanReduction = Number((authorityMetrics.global.orphanReduction || "0%").replace('%', ''));
  if (orphanReduction > 30) {
    passed.push(`Redução de Órfãos saudável: ${authorityMetrics.global.orphanReduction}`);
  }

  moduleWarnings.forEach(w => warnings.push(w));

  return createReport({
    service: "Topical Authority",
    category: "content",
    score: authorityMetrics.global.averageClusterScore || 0,
    metrics: { 
      orphanReduction: authorityMetrics.global.orphanReduction,
      globalCrawlEfficiency: authorityMetrics.global.globalCrawlEfficiency
    },
    warnings: moduleWarnings,
    runtime: { executionTime: Date.now() - startTime }
  });
}

module.exports = {
  performAuthorityChecks
};
