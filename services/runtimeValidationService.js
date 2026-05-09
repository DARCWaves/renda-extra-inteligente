/**
 * Serviço de Inteligência de Validação em Tempo de Execução (Runtime Failure Intelligence).
 * Focado em prevenir erros HTTP 500, TypeError e ReferenceError.
 */

/**
 * Garante que um objeto seja acessado de forma segura, retornando um fallback se necessário.
 * @param {Object} obj - O objeto alvo.
 * @param {string} path - O caminho da propriedade (ex: 'global.metrics.score').
 * @param {any} fallback - Valor padrão se o caminho for inválido.
 */
function safeGet(obj, path, fallback = null) {
  if (!obj || typeof obj !== "object") return fallback;
  
  try {
    const parts = path.split(".");
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== "object") {
        return fallback;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Valida a integridade de uma estrutura de dados (Schema simplificado).
 * @param {Object} data - O dado a ser validado.
 * @param {string[]} requiredKeys - Chaves obrigatórias.
 */
function validateSchema(data, requiredKeys = []) {
  if (!data || typeof data !== "object") return false;
  return requiredKeys.every(key => Object.prototype.hasOwnProperty.call(data, key));
}

/**
 * Captura e classifica erros de execução para o Guardian.
 */
function classifyRuntimeError(err) {
  const type = err.name || "Error";
  const message = err.message || "Unknown error";
  
  const classification = {
    type,
    message,
    severity: "Média",
    recommendation: "Revisar lógica de nulidade (null-guards)."
  };

  if (type === "TypeError") {
    classification.severity = "Alta";
    classification.recommendation = "Implementar encadeamento opcional (?.) ou safeGet.";
  } else if (type === "ReferenceError") {
    classification.severity = "Crítica";
    classification.recommendation = "Verificar importações de serviços e variáveis locais.";
  } else if (type === "SyntaxError") {
    classification.severity = "Bloqueante";
    classification.recommendation = "Corrigir erro de sintaxe antes do deploy.";
  }

  return classification;
}

const { readJson, updateJson } = require("./storageAdapter");

/**
 * Registra uma falha de execução para o sistema Plan B.
 */
function logRuntimeFailure(route, err) {
  const errorId = `RT-${Date.now().toString(36).toUpperCase()}`;
  const entry = {
    id: errorId,
    timestamp: new Date().toISOString(),
    route,
    type: err.name || "UnknownError",
    message: err.message,
    severity: err.name === "TypeError" || err.name === "ReferenceError" ? "Alta" : "Média"
  };

  updateJson("runtime-failures", (data) => {
    const list = Array.isArray(data) ? data : [];
    list.push(entry);
    return list.slice(-50); // Mantém apenas os últimos 50
  }, []);

  console.error(`[PLAN-B ACTIVE] ${errorId} em ${route}: ${entry.message}`);
  
  return errorId;
}

/**
 * Retorna as falhas de runtime recentes.
 */
function getRuntimeFailures() {
  return readJson("runtime-failures", []);
}

module.exports = {
  safeGet,
  validateSchema,
  classifyRuntimeError,
  logRuntimeFailure,
  getRuntimeFailures
};
