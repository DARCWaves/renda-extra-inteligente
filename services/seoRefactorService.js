/**
 * Motor de Refatoração SEO (Sugestões).
 * Gera patches seguros para melhoria de conteúdo legado.
 */

const { scorePost } = require("./seoIntelligenceService");
const { readJson, writeJson } = require("./storageAdapter");

/**
 * Gera sugestões de melhoria para os posts com menor score.
 * @param {Array} posts - Lista de posts.
 * @param {number} limit - Máximo de posts para analisar por ciclo.
 * @returns {Array} - Lista de patches sugeridos.
 */
function generateSeoPatches(posts, limit = 5) {
  if (!Array.isArray(posts)) return [];

  // Seleciona os piores posts que ainda não foram refatorados ou que precisam de atenção
  const candidates = posts
    .map(p => ({ ...p, analysis: scorePost(p) }))
    .filter(p => p.analysis.score < 65)
    .sort((a, b) => a.analysis.score - b.analysis.score)
    .slice(0, limit);

  const patches = candidates.map(post => {
    const patch = {
      slug: post.slug,
      currentScore: post.analysis.score,
      projectedScore: 0,
      changes: {}
    };

    const analysis = post.analysis;
    let scoreBoost = 0;

    // 1. Sugestão de Título
    if (post.title.length < 40) {
      patch.changes.title = `${post.title}: Guia Prático e Simples`;
      scoreBoost += 10;
    }

    // 2. Sugestão de Meta Descrição
    if (!post.seoDescription || post.seoDescription.length < 100) {
      patch.changes.seoDescription = `${post.description || post.title}. Aprenda o passo a passo para aplicar isso hoje mesmo e melhorar sua vida financeira.`;
      scoreBoost += 10;
    }

    // 3. Diversificação de Conclusão (AI Footprint Reduction)
    const conclusionRegex = /pressa excessiva leva à pobreza/i;
    if (conclusionRegex.test(post.content)) {
      const categoryConclusions = {
        economia: "\n\nConclusão: Entender o cenário macroeconômico é a chave para proteger seu poder de compra e antecipar movimentos que afetam seu bolso.",
        investimentos: "\n\nConclusão: O tempo e a disciplina são seus maiores aliados nos investimentos. Comece pequeno, mas comece com estratégia e visão de longo prazo.",
        trabalho: "\n\nConclusão: Valorizar suas habilidades e buscar eficiência no que você já faz é o caminho mais curto para novas oportunidades de renda.",
        financas: "\n\nConclusão: A liberdade financeira começa com a clareza dos seus números. Cada centavo economizado hoje é um passo rumo à sua tranquilidade amanhã.",
        programacao: "\n\nConclusão: Programação não é sobre decorar comandos, mas sobre resolver problemas. Continue praticando a lógica e os resultados virão com o tempo."
      };

      patch.changes.conclusion = categoryConclusions[post.category] || "\n\nConclusão: O segredo da evolução financeira não é a velocidade, mas a direção correta e a consistência das suas ações diárias.";
      scoreBoost += 5;
    }

    // 4. Estrutura H2/H3 (Informativo para o Editor)
    if (!/##\s|<h2>/i.test(post.content)) {
      patch.changes.structureNote = "Adicionar subtítulos (H2/H3) para melhorar a escaneabilidade.";
      scoreBoost += 15;
    }

    // 5. CTA e Disclosure
    if (!/clique|acesse|saiba mais/i.test(post.content)) {
      const ctaVariations = [
        "\n\n**Ação prática:** Escolha uma das estratégias acima e comece a aplicar hoje mesmo.",
        "\n\n**Próximo passo:** Revise seu plano atual e ajuste um detalhe com base no que aprendeu aqui.",
        "\n\n**Desafio de hoje:** Identifique um ponto de melhoria no seu processo e mude agora.",
        "\n\n**Foco total:** O conhecimento só gera valor quando vira ação. Qual será sua primeira mudança?",
        "\n\n**Evolução constante:** Não espere o momento perfeito. Aplique o que é possível hoje e melhore no caminho."
      ];
      patch.changes.ctaSnippet = ctaVariations[Math.floor(Math.random() * ctaVariations.length)];
      scoreBoost += 10;
    }

    patch.projectedScore = Math.min(100, post.analysis.score + scoreBoost);
    patch.confidence = scoreBoost > 20 ? "Alta" : "Média";

    return patch;
  });

  return patches;
}

/**
 * Salva os patches gerados para revisão.
 */
function savePatches(patches) {
  return writeJson("seo-patches", {
    generatedAt: new Date().toISOString(),
    count: patches.length,
    patches
  });
}

module.exports = {
  generateSeoPatches,
  savePatches
};
