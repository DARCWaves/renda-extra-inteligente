/**
 * Serviço de Inteligência de Reciclagem (Refresh Intelligence).
 * Identifica conteúdos que precisam de atualização ou melhoria técnica.
 */

const { scorePost } = require("./seoIntelligenceService");

/**
 * Analisa os posts e gera recomendações de atualização.
 * @param {Array} posts - Lista de posts do sistema.
 * @returns {Array} - Lista de recomendações.
 */
function getRefreshRecommendations(posts) {
  if (!Array.isArray(posts)) return [];

  const now = new Date();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  return posts.map(post => {
    const recommendations = [];
    const analysis = scorePost(post);
    const createdAt = new Date(post.createdAt || 0);
    const updatedAt = new Date(post.updatedAt || post.createdAt || 0);
    const ageInMs = now - updatedAt;
    
    const wordCount = (post.content || "").split(/\s+/).length;

    // 1. Critério de Obsolecência Temporal
    if (ageInMs > SIX_MONTHS_MS) {
      recommendations.push("Conteúdo com mais de 6 meses sem atualização.");
    }

    // 2. Critério de Sensibilidade Econômica (Categorias voláteis)
    if (["economia", "investimentos"].includes(post.category) && ageInMs > THIRTY_DAYS_MS) {
      recommendations.push("Verificar se dados econômicos (Selic/Dólar) citados ainda são atuais.");
    }

    // 3. Critério de SEO Baixo (herdado do score)
    if (analysis.score < 60) {
      recommendations.push(...analysis.improvements);
    }

    // 4. Critério de Thin Content
    if (wordCount < 300) {
      recommendations.push("Expandir conteúdo: texto muito curto para rankeamento competitivo.");
    }

    // 5. Critério de Engajamento/UX (Ausência de links internos detectada por padrão de texto)
    const internalLinks = (post.content.match(/href=["']\/(post|categoria)/g) || []).length;
    if (internalLinks === 0) {
      recommendations.push("Adicionar links internos para outros conteúdos do site.");
    }

    return {
      slug: post.slug,
      title: post.title,
      category: post.category,
      priority: recommendations.length > 3 ? "Alta" : "Média",
      recommendations: [...new Set(recommendations)] // Remove duplicatas
    };
  }).filter(item => item.recommendations.length > 0);
}

module.exports = {
  getRefreshRecommendations
};
