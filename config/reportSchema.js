/**
 * Schema de Relatório de Inteligência Padronizado.
 * Define o contrato de comunicação entre motores, guardian e dashboards.
 */

/**
 * Normaliza o status de um serviço.
 */
function normalizeStatus(score, criticalIssues = []) {
  if (criticalIssues.length > 0) return "critical";
  if (score < 70) return "warning";
  return "healthy";
}

/**
 * Garante que o score esteja entre 0 e 100.
 */
function clampScore(score) {
  return Math.min(100, Math.max(0, Math.round(score || 0)));
}

/**
 * Cria um objeto de relatório padronizado.
 */
function createReport({
  service,
  category = "general",
  score = 0,
  confidence = 1,
  metrics = {},
  warnings = [],
  criticalIssues = [],
  recommendations = [],
  metadata = {},
  runtime = {}
}) {
  return {
    service: String(service || "Unknown Service"),
    status: normalizeStatus(score, criticalIssues),
    category,
    score: clampScore(score),
    confidence: Number(confidence || 1),
    timestamp: Date.now(),
    metrics,
    warnings,
    criticalIssues,
    recommendations,
    metadata,
    runtime: {
      executionTime: runtime.executionTime || 0,
      recovered: !!runtime.recovered,
      fallbackUsed: !!runtime.fallbackUsed
    }
  };
}

module.exports = {
  createReport,
  normalizeStatus,
  clampScore
};
