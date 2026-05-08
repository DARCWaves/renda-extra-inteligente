/**
 * Serviço de Gerenciamento de Páginas Pilar.
 * Abstrai a persistência e recuperação de guias de autoridade.
 */

const { readJson, exists } = require("./storageAdapter");

const PILLARS_FILE = "pillars";

/**
 * Recupera todos os pilares.
 */
function getAllPillars() {
  return readJson(PILLARS_FILE, []).map(p => ({
    ...p,
    type: p.type || "master", // master ou subcluster
    parentPillar: p.parentPillar || null
  }));
}

/**
 * Busca um pilar pelo slug.
 */
function getPillarBySlug(slug) {
  const pillars = getAllPillars();
  return pillars.find(p => p.slug === slug) || null;
}

/**
 * Retorna os sub-clusters de um pilar mestre.
 */
function getSubClusters(parentSlug) {
  return getAllPillars().filter(p => p.parentPillar === parentSlug);
}

/**
 * Verifica risco de canibalização semântica (slugs ou títulos muito parecidos).
 */
function detectCannibalization(newPillar, existingPillars) {
  const clean = (txt) => String(txt).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const newTitle = clean(newPillar.title);
  
  return existingPillars.some(p => {
    if (p.slug === newPillar.slug) return false;
    const existingTitle = clean(p.title);
    // Se 70% das palavras do título coincidem, há risco
    const words1 = newTitle.split(" ");
    const words2 = existingTitle.split(" ");
    const matches = words1.filter(w => w.length > 3 && words2.includes(w)).length;
    return matches / Math.max(words1.length, words2.length) > 0.7;
  });
}

module.exports = {
  getAllPillars,
  getPillarBySlug,
  getSubClusters,
  detectCannibalization
};
