const { updateJson } = require("./storageAdapter");

/**
 * Serviço de Analytics Interno e Privativo.
 * Armazena apenas contadores agregados por dia.
 * Sem cookies, sem IPs, sem rastreio individual.
 */

const FILE_KEY = "analytics";

/**
 * Registra um evento de forma agregada.
 * @param {string} type - Tipo do evento (view, click, internal)
 * @param {string} id - Identificador do recurso (slug do post, id do afiliado)
 */
function trackEvent(type, id) {
  if (!type || !id) return;

  const today = new Date().toISOString().split("T")[0];

  // Executa update atômico para evitar race conditions
  updateJson(FILE_KEY, (data) => {
    const analytics = data || {};
    
    if (!analytics[today]) {
      analytics[today] = { views: {}, clicks: {}, internal: {} };
    }

    const dayData = analytics[today];
    const category = type === "view" ? "views" : type === "click" ? "clicks" : "internal";

    if (!dayData[category]) dayData[category] = {};
    
    dayData[category][id] = (dayData[category][id] || 0) + 1;

    return analytics;
  }, {});
}

/**
 * Middleware para rastrear visualizações de página no servidor.
 */
function analyticsMiddleware(req, res, next) {
  try {
    const url = req.path;

    if (url.startsWith("/post/")) {
      const slug = url.replace("/post/", "");
      trackEvent("view", slug);
    } else if (url.startsWith("/categoria/")) {
      const category = url.replace("/categoria/", "");
      trackEvent("view", `cat:${category}`);
    } else if (url === "/") {
      trackEvent("view", "home");
    }
  } catch (err) {
    console.error("⚠️ [Analytics] Falha silenciosa no middleware:", err.message);
  }
  next();
}

module.exports = {
  trackEvent,
  analyticsMiddleware
};
