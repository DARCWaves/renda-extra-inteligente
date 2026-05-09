const { createReport } = require("../../config/reportSchema");

function performMonetizationChecks(monetization, warnings, passed) {
  const startTime = Date.now();
  const moduleWarnings = [];

  if (!monetization) return createReport({ service: "Monetization Health", status: "warning" });

  if (monetization.saturationRisk > 0.15) {
    moduleWarnings.push(`[RISCO MONETIZAÇÃO] Saturação de Afiliados detectada em ${Math.round(monetization.saturationRisk * 100)}% dos posts.`);
  }

  const score = monetization.globalTrust || 0;
  if (score > 60) {
    passed.push(`Score de Confiança de Monetização: ${score}%`);
  }

  moduleWarnings.forEach(w => warnings.push(w));

  return createReport({
    service: "Monetization Health",
    category: "revenue",
    score,
    metrics: { saturationRisk: monetization.saturationRisk },
    warnings: moduleWarnings,
    runtime: { executionTime: Date.now() - startTime }
  });
}

module.exports = {
  performMonetizationChecks
};
