/**
 * Serviço de Aplicação de Patches (Surgical injection).
 * Aplica melhorias de SEO de forma segura e controlada.
 */

const { readJson, writeJson } = require("./storageAdapter");
const fs = require("fs");
const path = require("path");

const POSTS_FILE = "posts";
const PATCHES_FILE = "seo-patches";
const HISTORY_FILE = "patch-history";

/**
 * Aplica um patch específico a um post.
 * @param {Object} post - Objeto do post original.
 * @param {Object} patch - Objeto do patch.
 * @returns {Object} - Post atualizado.
 */
function applyPatchToPost(post, patch) {
  const updated = { ...post };
  const changes = patch.changes || {};

  // 1. Metadados (Substituição simples)
  if (changes.title) updated.title = changes.title;
  if (changes.seoTitle) updated.seoTitle = changes.seoTitle;
  if (changes.seoDescription) {
    updated.seoDescription = changes.seoDescription;
    updated.description = changes.seoDescription; // Sincroniza
  }

  let newContent = post.content || "";

  // 2. Diversificação de Conclusão (Substituição de padrão repetitivo)
  if (changes.conclusion) {
    const pattern = /Como diz Provérbios 21:5, os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza\./i;
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, changes.conclusion.trim());
    } else {
      // Se não achar o padrão, apenas anexa ao final
      newContent += "\n\n" + changes.conclusion.trim();
    }
  }

  // 3. Injeção de CTA
  if (changes.ctaSnippet) {
    // Verifica se já não existe um CTA similar para evitar duplicidade
    if (!newContent.includes("Ação prática")) {
      newContent += "\n\n" + changes.ctaSnippet.trim();
    }
  }

  updated.content = newContent;
  updated.updatedAt = new Date().toISOString();
  updated.appliedPatch = true;

  return updated;
}

/**
 * Executa um ciclo de aplicação de patches.
 * @param {number} limit - Limite de patches a aplicar.
 * @returns {Object} - Resultado do ciclo.
 */
async function runPatchCycle(limit = 1) {
  const patchData = readJson(PATCHES_FILE, { patches: [] });
  const posts = readJson(POSTS_FILE, []);
  
  if (!patchData.patches || patchData.patches.length === 0) {
    return { ok: false, message: "Nenhum patch pendente encontrado." };
  }

  const toApply = patchData.patches.slice(0, limit);
  const results = [];
  
  const updatedPosts = posts.map(post => {
    const patch = toApply.find(p => p.slug === post.slug);
    if (patch) {
      const updated = applyPatchToPost(post, patch);
      results.push({
        slug: post.slug,
        oldScore: patch.currentScore,
        newScore: patch.projectedScore,
        fields: Object.keys(patch.changes)
      });
      return updated;
    }
    return post;
  });

  // Salva histórico
  const history = readJson(HISTORY_FILE, []);
  history.push({
    timestamp: new Date().toISOString(),
    cycleLimit: limit,
    applied: results
  });

  // Atualiza arquivos
  writeJson(POSTS_FILE, updatedPosts);
  writeJson(HISTORY_FILE, history);

  // Remove patches aplicados da fila
  const remainingPatches = patchData.patches.filter(p => !toApply.some(a => a.slug === p.slug));
  writeJson(PATCHES_FILE, { ...patchData, patches: remainingPatches });

  return {
    ok: true,
    appliedCount: results.length,
    results
  };
}

module.exports = {
  applyPatchToPost,
  runPatchCycle
};
