/**
 * Performance & Search Dominance Engine.
 * Analyzes route rendering costs and Core Web Vitals risks.
 */

const { sanitizeNumeric } = require("./realtimeIndicatorService");

/**
 * Evaluates performance risks based on content structure and connectivity.
 */
function evaluatePerformanceHealth(posts, pillars, connectivity = {}) {
  const risks = [];
  let score = 100;

  // 1. JSON Size Risk
  const postsCount = posts.length;
  if (postsCount > 300) {
    risks.push(`Tamanho do Banco (JSON): ${postsCount} posts. Risco de latência em IO síncrono.`);
    score -= 10;
  }

  // 2. Core Web Vitals: LCP & CLS Risks
  const heavyPosts = posts.filter(p => (p.content || "").length > 10000);
  if (heavyPosts.length > 0) {
    risks.push(`Páginas Pesadas (LCP): ${heavyPosts.length} artigos muito longos sem paginação.`);
    score -= 5;
  }

  // 3. Search Dominance: Crawl Efficiency
  const postsWithLinks = posts.filter(p => {
    const conn = connectivity[p.slug];
    return conn && conn.inLinks > 0;
  }).length;
  
  const crawlEfficiency = postsCount > 0 ? postsWithLinks / postsCount : 0;
  if (crawlEfficiency < 0.5) {
    risks.push(`Inatividades de Rastreio: Crawl Efficiency abaixo de 50% (${Math.round(crawlEfficiency * 100)}%).`);
    score -= 15;
  }

  return {
    score: sanitizeNumeric(score),
    risks,
    metrics: {
      totalPosts: postsCount,
      heavyContentRatio: (heavyPosts.length / Math.max(1, postsCount)).toFixed(2),
      crawlEfficiency: crawlEfficiency.toFixed(2)
    }
  };
}

module.exports = {
  evaluatePerformanceHealth
};
