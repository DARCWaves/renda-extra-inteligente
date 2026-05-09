const { createReport } = require("../../config/reportSchema");

function performPerformanceChecks(performance, warnings, passed) {
  const startTime = Date.now();
  const moduleWarnings = [];

  if (!performance) return createReport({ service: "Performance", status: "warning" });

  if (performance.score < 80) {
    moduleWarnings.push(`Performance do site abaixo do ideal: ${performance.score}%`);
  }

  if (performance.risks && performance.risks.length > 0) {
    performance.risks.forEach(risk => moduleWarnings.push(`[PERFORMANCE] ${risk}`));
  }

  if (performance.score >= 80) {
    passed.push(`Performance Score saudável: ${performance.score}%`);
  }

  moduleWarnings.forEach(w => warnings.push(w));

  return createReport({
    service: "System Performance",
    category: "infrastructure",
    score: performance.score,
    metrics: performance.metrics,
    warnings: moduleWarnings,
    runtime: { executionTime: Date.now() - startTime }
  });
}

module.exports = {
  performPerformanceChecks
};
