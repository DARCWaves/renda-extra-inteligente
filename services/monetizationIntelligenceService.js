/**
 * Serviço de Inteligência de Monetização Contextual.
 * Alinha ofertas com a intenção do usuário e a jornada semântica.
 */

const { analyzeIntent } = require("./trafficIntelligenceService");

/**
 * Avalia a qualidade do contexto de monetização de um post.
 */
function evaluateMonetizationContext(post) {
  const intent = analyzeIntent(post.title || "");
  const content = post.content || "";
  const wordCount = content.split(/\s+/).filter(w => w.length > 1).length;
  
  // Detecção de links de afiliados (padrão /out/)
  const affiliateLinks = (content.match(/\/out\//g) || []).length;
  const density = wordCount > 0 ? (affiliateLinks / wordCount) : 0;
  
  // Regras de Ouro de Monetização (Phase 9)
  const isSaturated = density > (1 / 150); // Mais de 1 link por 150 palavras
  const hasDisclosure = /afiliado|transparência|comissão|recomendação/i.test(content);
  
  // Alinhamento de Oferta (Score 0-100)
  // Se for Informacional, a oferta deve ser sutil. Se for Transacional, pode ser mais direta.
  let alignmentScore = 70; // Base
  if (intent === "transactional" && affiliateLinks > 0) alignmentScore += 30;
  if (intent === "informational" && affiliateLinks > 2) alignmentScore -= 40;
  if (intent === "informational" && affiliateLinks === 0) alignmentScore = 100; // Informacional puro é seguro

  // Trust Preservation Score
  const trustScore = hasDisclosure && !isSaturated ? 100 : hasDisclosure ? 70 : isSaturated ? 20 : 50;

  return {
    slug: post.slug,
    intent,
    affiliateLinks,
    density: density.toFixed(4),
    isSaturated,
    hasDisclosure,
    alignmentScore,
    trustScore
  };
}

/**
 * Calcula a eficiência de fluxo de receita (Revenue Flow) global.
 */
function calculateRevenueEfficiency(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return { globalAlignment: 0, globalTrust: 0, saturationRisk: 0, revenueOpportunityDensity: 0, evaluations: [] };
  }

  const evaluations = posts.map(evaluateMonetizationContext);
  
  const avgAlignment = Math.round(evaluations.reduce((acc, e) => acc + (e.alignmentScore || 0), 0) / evaluations.length);
  const avgTrust = Math.round(evaluations.reduce((acc, e) => acc + (e.trustScore || 0), 0) / evaluations.length);
  const saturatedCount = evaluations.filter(e => e.isSaturated).length;

  return {
    globalAlignment: avgAlignment,
    globalTrust: avgTrust,
    saturationRisk: (saturatedCount / evaluations.length).toFixed(2),
    revenueOpportunityDensity: (evaluations.filter(e => e.intent === "transactional" && !e.isSaturated).length / evaluations.length).toFixed(2),
    evaluations
  };
}

module.exports = {
  evaluateMonetizationContext,
  calculateRevenueEfficiency
};
