/**
 * Serviço de Inteligência de Aquisição de Tráfego.
 * Analisa Intenção de Busca, CTR e Discoverability.
 */

const INTENT_MARKERS = {
  informational: ["como", "o que", "por que", "guia", "manual", "aprenda", "diferença"],
  transactional: ["melhor", "onde", "comprar", "oferta", "investir", "vender", "renda"],
  navigational: ["site", "portal", "acesso", "entrar", "login"]
};

const PSYCHOLOGY_MARKERS = {
  curiosity: ["segredo", "erro", "vazamento", "silencioso", "escondido", "revelado"],
  benefit: ["mais", "ganhar", "lucro", "rápido", "simples", "fácil", "liberdade"],
  urgency: ["hoje", "agora", "imediatamente", "antes que", "prazo"]
};

/**
 * Analisa a intenção de busca de um post.
 */
function analyzeIntent(title) {
  const lowerTitle = title.toLowerCase();
  let intent = "informational"; // Default
  
  if (INTENT_MARKERS.transactional.some(m => lowerTitle.includes(m))) intent = "transactional";
  else if (INTENT_MARKERS.navigational.some(m => lowerTitle.includes(m))) intent = "navigational";

  return intent;
}

/**
 * Calcula o potencial de CTR (0-100) baseado em gatilhos psicológicos.
 */
function calculateHeadlineScore(title) {
  const lowerTitle = title.toLowerCase();
  let score = 40; // Base score

  // Verifica gatilhos
  Object.keys(PSYCHOLOGY_MARKERS).forEach(cat => {
    if (PSYCHOLOGY_MARKERS[cat].some(m => lowerTitle.includes(m))) {
      score += 20;
    }
  });

  // Tamanho ideal para CTR no Google (50-65 chars)
  if (title.length >= 50 && title.length <= 65) score += 10;
  
  return Math.min(100, score);
}

/**
 * Identifica se o conteúdo tem potencial para Google Discover.
 */
function isDiscoverReady(post) {
  const hasStrongHeadline = calculateHeadlineScore(post.title) > 70;
  const hasImage = !!post.imagePrompt;
  const isFresh = new Date(post.updatedAt || post.createdAt) > new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  
  return hasStrongHeadline && hasImage && isFresh;
}

/**
 * Sugere melhorias de headline.
 */
function recommendHeadlineUpgrade(post) {
  const score = calculateHeadlineScore(post.title);
  if (score >= 80) return null;

  const intent = analyzeIntent(post.title);
  
  if (intent === "informational" && !post.title.toLowerCase().startsWith("como")) {
    return `Adicionar 'Como' ou 'Passo a Passo' ao início para intenção educacional.`;
  }
  
  if (score < 60) {
    return `Incluir um gatilho de benefício (ex: 'Lucro', 'Simples') ou curiosidade.`;
  }

  return "Ajustar tamanho para 55 caracteres.";
}

/**
 * Analisa a competitividade de frescor.
 */
function analyzeFreshnessCompetitiveness(posts) {
  const now = Date.now();
  const freshCount = posts.filter(p => (now - new Date(p.updatedAt || p.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000)).length;
  return (freshCount / Math.max(1, posts.length)).toFixed(2);
}

module.exports = {
  analyzeIntent,
  calculateHeadlineScore,
  isDiscoverReady,
  recommendHeadlineUpgrade,
  analyzeFreshnessCompetitiveness
};
