const { OFFICIAL_CATEGORIES } = require("../../config/constants");
const { createReport } = require("../../config/reportSchema");

function performSeoChecks(posts, analyzeGlobalHealth, warnings, passed) {
  const startTime = Date.now();
  const moduleWarnings = [];

  const seoHealth = analyzeGlobalHealth(posts);
  const score = seoHealth.averageScore || 0;
  
  if (score < 70) {
    moduleWarnings.push(`Saúde Global do SEO está baixa: ${score}% (Ideal > 70%)`);
  } else {
    passed.push(`Saúde Global do SEO: ${score}%`);
  }

  if (seoHealth.priorityPosts) {
    seoHealth.priorityPosts.forEach(p => {
      if (p.score < 50) {
        moduleWarnings.push(`Post de baixa autoridade [${p.score}%]: ${p.slug}`);
      }
    });
  }

  // Preenche arrays globais por compatibilidade
  moduleWarnings.forEach(w => warnings.push(w));

  return createReport({
    service: "SEO Quality",
    category: "content",
    score,
    metrics: { averageScore: score, totalPosts: posts.length },
    warnings: moduleWarnings,
    recommendations: (seoHealth.priorityPosts || []).slice(0, 3).map(p => `Melhorar SEO de: ${p.slug}`),
    runtime: { executionTime: Date.now() - startTime }
  });
}

module.exports = {
  performSeoChecks
};
