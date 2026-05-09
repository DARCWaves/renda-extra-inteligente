/**
 * Real Self-Healing Engine.
 * Detecta falhas, identifica causas raízes e recomenda correções permanentes.
 */

const { getRecoveryLog } = require("./realtimeIndicatorService");
const { getRuntimeFailures } = require("./runtimeValidationService");
const { readJson, updateJson } = require("./storageAdapter");

const FAILURE_QUEUE_KEY = "failure-resolution-queue";

/**
 * Classifica uma falha e gera um plano de correção.
 */
function classifyAndPlanFix(failure) {
  const { route, type, message, id } = failure;
  
  let rootCause = "Inconsistência de dados ou acesso a propriedade indefinida.";
  let recommendation = "Adicionar null-guards e usar safeGet para acesso a propriedades aninhadas.";
  let urgency = "Média";

  if (type === "TypeError") {
    urgency = "Alta";
    recommendation = "Implementar optional chaining (?.) ou safeGet nas propriedades afetadas.";
  } else if (type === "ReferenceError") {
    urgency = "Crítica";
    rootCause = "Variável ou serviço não definido no escopo.";
    recommendation = "Verificar importações de serviços e declaração de variáveis locais.";
  } else if (message.includes("EJS") || message.includes("render")) {
    urgency = "Alta";
    rootCause = "Erro de renderização EJS. Variável faltando no contexto.";
    recommendation = "Garantir que todos os objetos necessários sejam passados para res.render().";
  }

  return {
    id,
    timestamp: failure.timestamp,
    route,
    type,
    message,
    rootCause,
    recommendation,
    urgency,
    status: "open"
  };
}

/**
 * Sincroniza falhas de runtime com a fila permanente de resolução.
 */
function syncFailureQueue() {
  const runtimeFailures = getRuntimeFailures();
  
  updateJson(FAILURE_QUEUE_KEY, (existingQueue) => {
    const queue = Array.isArray(existingQueue) ? existingQueue : [];
    
    runtimeFailures.forEach(fail => {
      if (!queue.some(q => q.id === fail.id)) {
        queue.push(classifyAndPlanFix(fail));
      }
    });

    return queue.slice(-100);
  }, []);
}

/**
 * Calcula a eficácia do Self-Healing.
 */
function calculateHealingMetrics() {
  const recoveryLog = getRecoveryLog();
  const queue = readJson(FAILURE_QUEUE_KEY, []);
  
  const totalPrevented = recoveryLog.length;
  const openIssues = queue.filter(q => q.status === "open").length;
  const recurringIssues = queue.filter(q => q.status === "recurring").length;

  return {
    preventedCrashes: totalPrevented,
    openIssues,
    recurringIssues,
    effectivenessScore: Math.max(0, 100 - (openIssues * 5) - (recurringIssues * 15)),
    queue
  };
}

module.exports = {
  syncFailureQueue,
  calculateHealingMetrics
};
