/**
 * Real-Time Indicator Engine & Self-Healing Layer.
 * Responsável por validar, sanitizar e recuperar métricas e serviços em tempo real.
 */

const RECOVERY_LOG = [];
const STABILITY_MEMORY = new Map();

/**
 * Wrapper de Execução Segura para Serviços (Safe Service Execution).
 * Isola falhas de módulos individuais e garante continuidade do sistema.
 * @param {string} moduleName - Nome do serviço (ex: 'SEO', 'Monetização').
 * @param {function} fn - Função a ser executada.
 * @param {any} fallback - Retorno em caso de erro.
 */
function safeExecute(moduleName, fn, fallback = null) {
  try {
    const result = fn();
    trackStability(moduleName, true);
    return result;
  } catch (err) {
    const errorInfo = {
      name: err.name,
      message: err.message,
      stack: err.stack ? err.stack.split('\n').slice(0, 2).join(' ') : ''
    };
    
    logRecovery(`Service Crash [${moduleName}]`, `${errorInfo.name}: ${errorInfo.message}`);
    trackStability(moduleName, false);
    
    return fallback;
  }
}

/**
 * Monitora a estabilidade recorrente de um módulo.
 */
function trackStability(moduleName, success) {
  const stats = STABILITY_MEMORY.get(moduleName) || { success: 0, fail: 0, lastFail: null };
  if (success) {
    stats.success++;
  } else {
    stats.fail++;
    stats.lastFail = new Date().toISOString();
  }
  STABILITY_MEMORY.set(moduleName, stats);
}

/**
 * Retorna o status de saúde de todos os serviços.
 */
function getServiceHealthStatus() {
  const health = {};
  STABILITY_MEMORY.forEach((stats, name) => {
    const total = stats.success + stats.fail;
    const rate = total > 0 ? (stats.success / total) : 1;
    health[name] = {
      status: rate > 0.9 ? "Saudável" : rate > 0.5 ? "Instável" : "Crítico",
      reliability: (rate * 100).toFixed(1) + "%",
      failures: stats.fail,
      lastFailure: stats.lastFail
    };
  });
  return health;
}

/**
 * Valida se um valor é um número válido e dentro do range esperado.
 */
function sanitizeNumeric(value, { min = 0, max = 100, fallback = 0 } = {}) {
  let num = parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) {
    logRecovery("Numeric Failure", `Valor inválido (${value}). Usando fallback: ${fallback}`);
    return fallback;
  }

  const clamped = Math.min(max, Math.max(min, num));
  if (clamped !== num) {
    logRecovery("Numeric Clamping", `Valor ${num} ajustado para ${clamped}.`);
  }

  return clamped;
}

/**
 * Valida se um objeto existe e possui as chaves necessárias.
 */
function sanitizeObject(obj, requiredKeys = [], fallback = {}) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    logRecovery("Object Failure", "Estrutura inválida. Usando fallback.");
    return fallback;
  }

  const missingKeys = requiredKeys.filter(key => !(key in obj));
  if (missingKeys.length > 0) {
    logRecovery("Object Inconsistency", `Chaves ausentes: ${missingKeys.join(", ")}.`);
  }

  return obj;
}

/**
 * Valida se um valor é um array funcional.
 */
function sanitizeArray(arr, fallback = []) {
  if (!Array.isArray(arr)) {
    logRecovery("Array Failure", "Array inválido. Usando fallback.");
    return fallback;
  }
  return arr;
}

/**
 * Registra ações de auto-recuperação.
 */
function logRecovery(type, message) {
  const entry = { timestamp: new Date().toISOString(), type, message };
  RECOVERY_LOG.push(entry);
  console.warn(`[SELF-HEALING] ${type}: ${message}`);
}

/**
 * Retorna o log de recuperações recentes.
 */
function getRecoveryLog() {
  return RECOVERY_LOG.slice(-20);
}

module.exports = {
  safeExecute,
  getServiceHealthStatus,
  sanitizeNumeric,
  sanitizeObject,
  sanitizeArray,
  getRecoveryLog
};
