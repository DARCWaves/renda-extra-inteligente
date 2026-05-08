/**
 * Serviço de Inteligência de Linkagem Interna.
 * Mapeia a conectividade entre posts e sugere oportunidades contextuais.
 */

/**
 * Analisa a malha de links entre os posts.
 * @param {Array} posts - Lista de posts.
 * @returns {Object} - Mapa de conectividade e estatísticas.
 */
function analyzeConnectivity(posts, pillars = []) {
  const connectivity = {};
  const allContent = posts.map(p => ({
    slug: p.slug,
    content: (p.content || "").toLowerCase(),
    category: p.category
  }));

  const pillarContents = pillars.map(p => ({
    slug: p.slug,
    content: (p.content || "").toLowerCase() + (p.sections || []).map(s => s.content).join(" ")
  }));

  // Inicializa mapa
  posts.forEach(p => {
    connectivity[p.slug] = { inLinks: 0, outLinks: 0, sources: [] };
  });

  // Conta links entre posts
  allContent.forEach(source => {
    allContent.forEach(target => {
      if (source.slug === target.slug) return;

      if (source.content.includes(target.slug)) {
        connectivity[target.slug].inLinks++;
        connectivity[target.slug].sources.push(source.slug);
        connectivity[source.slug].outLinks++;
      }
    });
  });

  // Conta links vindos de Pilares
  pillarContents.forEach(pillar => {
    posts.forEach(target => {
      if (pillar.content.includes(target.slug)) {
        connectivity[target.slug].inLinks++;
        connectivity[target.slug].sources.push(`pillar:${pillar.slug}`);
      }
    });
  });

  return connectivity;
}

/**
 * Gera recomendações de linkagem baseadas em afinidade e citações.
 */
function generateLinkingOpportunities(posts, connectivity) {
  const suggestions = [];

  posts.forEach(post => {
    const postSuggestions = [];
    const contentLower = (post.content || "").toLowerCase();

    // Filtra candidatos (mesma categoria ou nichos irmãos)
    const candidates = posts.filter(p => {
      if (p.slug === post.slug) return false;
      
      // Regra 1: Mesma categoria (Alta Afinidade)
      if (p.category === post.category) return true;

      // Regra 2: Relacionamento Finanças/Economia
      const siblings = {
        "financas": "economia",
        "economia": "financas",
        "investimentos": "financas"
      };
      if (siblings[post.category] === p.category) return true;

      return false;
    });

    candidates.forEach(candidate => {
      if (postSuggestions.length >= 3) return;

      // Verifica se o post atual JÁ linka para o candidato
      if (contentLower.includes(candidate.slug)) return;

      // Heurística de Confiança: O título do candidato ou parte dele aparece no texto?
      const cleanTitle = candidate.title.toLowerCase().replace(/[^\w\s]/g, "");
      const titleWords = cleanTitle.split(" ").filter(w => w.length > 4);
      
      // Se encontrar 2 palavras-chave do título do candidato no post atual
      const matches = titleWords.filter(word => contentLower.includes(word)).length;

      if (matches >= 2) {
        postSuggestions.push({
          targetSlug: candidate.slug,
          targetTitle: candidate.title,
          reason: candidate.category === post.category ? `Reforço Horizontal (${matches} keywords)` : `Ponte Semântica (${matches} keywords)`,
          type: candidate.category === post.category ? "horizontal" : "semantic-bridge"
        });
      }
    });

    if (postSuggestions.length > 0 || connectivity[post.slug].inLinks === 0) {
      suggestions.push({
        slug: post.slug,
        title: post.title,
        category: post.category,
        inLinks: connectivity[post.slug].inLinks,
        outLinks: connectivity[post.slug].outLinks,
        isOrphan: connectivity[post.slug].inLinks === 0,
        leakageRisk: connectivity[post.slug].outLinks > 2 && connectivity[post.slug].inLinks === 0,
        opportunities: postSuggestions
      });
    }
  });

  return suggestions;
}

/**
 * Mapeia jornadas semânticas globais (Cross-Cluster Journeys).
 */
function mapSemanticJourneys(posts, pillars) {
  const journeys = [];
  
  // Jornada 1: Renda Extra -> Organização -> Investimento
  const rendaExtra = posts.find(p => p.category === "renda-extra" && p.appliedPatch);
  const organizacao = posts.find(p => p.category === "financas" && p.slug.includes("organizacao"));
  const investimento = pillars.find(p => p.category === "financas");

  if (rendaExtra && organizacao && investimento) {
    journeys.push({
      name: "Fluxo de Prosperidade",
      steps: [rendaExtra.slug, organizacao.slug, `pillar:${investimento.slug}`],
      status: "active"
    });
  }

  return journeys;
}

/**
 * Mapeia caminhos semânticos (Next Steps) dentro de um cluster.
 */
function generateSemanticPathways(posts, category) {
  const clusterPosts = posts.filter(p => p.category === category);
  if (clusterPosts.length < 2) return [];

  // Ordena por data para criar fluxo temporal/educativo
  const sorted = clusterPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const pathways = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    pathways.push({
      from: sorted[i].slug,
      to: sorted[i+1].slug,
      type: "step-by-step",
      anchor: `Próximo passo: ${sorted[i+1].title}`
    });
  }

  return pathways;
}

module.exports = {
  analyzeConnectivity,
  generateLinkingOpportunities,
  generateSemanticPathways,
  mapSemanticJourneys
};
