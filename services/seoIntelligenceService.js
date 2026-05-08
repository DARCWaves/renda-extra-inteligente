/**
 * Serviço de Inteligência SEO (Determinístico).
 * Avalia a qualidade técnica e autoridade do conteúdo.
 */

const OFFICIAL_CATEGORIES = ["financas", "renda-extra", "programacao", "investimentos", "economia", "trabalho"];

/**
 * Calcula o score de SEO e o potencial de recuperação de um post.
 */
function scorePost(post) {
  let score = 0;
  const improvements = [];
  const quickWins = [];

  const title = post.seoTitle || post.title || "";
  const description = post.seoDescription || post.description || "";
  const content = post.content || "";
  const slug = post.slug || "";

  // 1. Metadados (20 pts)
  if (title.length >= 45 && title.length <= 75) {
    score += 10;
  } else {
    const msg = "Título fora do tamanho ideal (45-75 caracteres)";
    improvements.push(msg);
    quickWins.push({ type: "metadata", msg: "Ajustar título para SEO", impact: 10 });
  }

  if (description.length >= 110 && description.length <= 170) {
    score += 10;
  } else {
    const msg = "Meta descrição fora do tamanho ideal (110-170 caracteres)";
    improvements.push(msg);
    quickWins.push({ type: "metadata", msg: "Ajustar meta descrição", impact: 10 });
  }

  // 2. Estrutura de Conteúdo (30 pts)
  const hasH2 = /##\s|<h2>/i.test(content);
  const hasH3 = /###\s|<h3>/i.test(content);
  if (hasH2 && hasH3) {
    score += 15;
  } else {
    improvements.push("Estrutura pobre: faltam subtítulos H2 ou H3");
  }

  const words = content.split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;
  if (wordCount > 350) {
    score += 15;
  } else {
    improvements.push("Conteúdo curto demais (Thin Content)");
  }

  // 3. Sinais de Autoridade e UX (30 pts)
  const hasCTA = /clique|acesse|veja|conheça|confira|saiba mais|aprenda/i.test(content);
  if (hasCTA) {
    score += 10;
  } else {
    improvements.push("Falta um Call to Action (CTA) claro");
    quickWins.push({ type: "ux", msg: "Adicionar frase de ação (CTA)", impact: 10 });
  }

  const isSlugClean = !/-\d{10,}/.test(slug);
  if (isSlugClean) {
    score += 10;
  } else {
    improvements.push("Slug não amigável (contém ID numérico longo)");
    quickWins.push({ type: "slug", msg: "Simplificar URL (remover timestamp)", impact: 10 });
  }

  const hasKeywords = (post.seoKeywords && post.seoKeywords.length > 10) || (Array.isArray(post.keywords) && post.keywords.length > 2);
  if (hasKeywords) {
    score += 10;
  } else {
    improvements.push("Keywords de SEO não configuradas");
  }

  // 4. Integridade Semântica (20 pts)
  if (OFFICIAL_CATEGORIES.includes(post.category)) {
    score += 10;
  } else {
    improvements.push("Categoria não oficial ou inválida");
  }

  const hasDisclosure = /afiliado|transparência|comissão|recomendação/i.test(content);
  if (hasDisclosure) {
    score += 10;
  } else {
    improvements.push("Falta menção à transparência editorial/afiliados");
    quickWins.push({ type: "eeat", msg: "Adicionar disclosure de afiliados", impact: 10 });
  }

  return {
    score,
    improvements,
    quickWins,
    recoveryPotential: 100 - score,
    slug,
    title: post.title,
    wordCount
  };
}

/**
 * Projeta a evolução do score com base em melhorias sugeridas.
 */
function projectScoreEvolution(currentAvg, quickWinsTotal, postsCount) {
  const possibleBoost = Math.round(quickWinsTotal / postsCount);
  return {
    current: currentAvg,
    target: 65,
    projected: Math.min(100, currentAvg + possibleBoost),
    gap: Math.max(0, 65 - currentAvg)
  };
}

/**
 * Avalia a saúde global do site e detecta padrões.
 */
function analyzeGlobalHealth(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return { averageScore: 0, criticalPosts: [], intelligence: {} };

  const scores = posts.map(scorePost);
  const averageScore = Math.round(scores.reduce((acc, p) => acc + p.score, 0) / scores.length);

  const intelligence = {
    orphans: [],
    patternWarnings: [],
    categoryBalance: {},
    quickWinRoadmap: []
  };

  // 1. Orphan Detection
  const allContent = posts.map(p => p.content).join(" ");
  posts.forEach(p => {
    if (p.slug && !allContent.includes(p.slug)) {
      intelligence.orphans.push(p.slug);
    }
  });

  // 2. AI Pattern Matching
  const intros = new Map();
  const outros = new Map();
  posts.forEach(p => {
    const text = (p.content || "").trim();
    if (text.length < 100) return;
    const prefix = text.substring(0, 80).toLowerCase();
    const suffix = text.substring(text.length - 80).toLowerCase();
    intros.set(prefix, (intros.get(prefix) || 0) + 1);
    outros.set(suffix, (outros.get(suffix) || 0) + 1);
  });

  intros.forEach((count, pattern) => {
    if (count > 2) intelligence.patternWarnings.push(`IA usando introdução repetida (${count}x): "${pattern.substring(0, 30)}..."`);
  });
  outros.forEach((count, pattern) => {
    if (count > 2) intelligence.patternWarnings.push(`IA usando conclusão repetida (${count}x): "...${pattern.substring(pattern.length - 30)}"`);
  });

  // 3. Category Balance
  OFFICIAL_CATEGORIES.forEach(cat => {
    const count = posts.filter(p => p.category === cat).length;
    const percentage = ((count / posts.length) * 100).toFixed(1);
    intelligence.categoryBalance[cat] = { count, percentage: `${percentage}%` };
    if (posts.length > 20 && percentage < 5) {
      intelligence.patternWarnings.push(`[AUTORIDADE] Nicho sub-representado: ${cat} (${percentage}%)`);
    }
  });

  // 4. Quick-Win Roadmap (Soma de impactos possíveis)
  let totalPossibleBoost = 0;
  scores.forEach(s => {
    s.quickWins.forEach(qw => {
      totalPossibleBoost += qw.impact;
      intelligence.quickWinRoadmap.push({ slug: s.slug, ...qw });
    });
  });

  const evolution = projectScoreEvolution(averageScore, totalPossibleBoost, posts.length);

  // Ordena posts por potencial de recuperação (os mais fáceis de consertar primeiro)
  const priorityPosts = scores
    .filter(p => p.score < 75)
    .sort((a, b) => b.recoveryPotential - a.recoveryPotential)
    .slice(0, 10);

  return {
    averageScore,
    totalPosts: posts.length,
    priorityPosts,
    intelligence,
    evolution
  };
}

/**
 * Sugere variações de texto de âncora para evitar repetição.
 */
function suggestAnchorTexts(post) {
  const title = post.title || "";
  const variations = [title];
  
  if (title.toLowerCase().includes("como")) {
    variations.push(title.replace(/como/i, "Guia sobre"));
  }
  
  const keywords = Array.isArray(post.keywords) ? post.keywords : [];
  if (keywords.length > 0) {
    variations.push(keywords.slice(0, 3).join(" "));
  }

  return variations.slice(0, 3);
}

module.exports = {
  scorePost,
  analyzeGlobalHealth,
  suggestAnchorTexts
};
