const fs = require("fs");
const path = require("path");

function composeFinalReport(report, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  console.log("\n========== AUTONOMOUS OPERATIONAL INTELLIGENCE CORE ==========");
  console.log(`Status do Sistema: ${report.ok ? "✅ ÍNTEGRO" : "❌ BLOQUEADO"}`);

  if (report.serviceHealth) {
    console.log("\n🏥 SERVICE HEALTH STATUS:");
    Object.keys(report.serviceHealth).forEach(s => {
      const h = report.serviceHealth[s];
      const icon = h.status === "Saudável" ? "🟢" : h.status === "Instável" ? "🟡" : "🔴";
      console.log(`   └─ ${icon} [${s}]: ${h.status} (${h.reliability})`);
    });
  }

  if (report.recoveryLog && report.recoveryLog.length > 0) {
    console.log("\n🛡️ RECOVERY HISTORY (Self-Healing Events):");
    report.recoveryLog.slice(-5).forEach(log => {
      console.log(`   └─ [${log.type}] ${log.message}`);
    });
  }

  if (report.runtimeAnomalies && report.runtimeAnomalies.length > 0) {
    console.log("\n🚨 RUNTIME ANOMALIES (Plan B Fallback):");
    report.runtimeAnomalies.forEach(anomaly => {
      console.log(`   └─ [${anomaly.id}] ${anomaly.route}: ${anomaly.type}`);
    });
  }

  if (report.autonomousInsights) {
    const ai = report.autonomousInsights;
    console.log("\n🧠 DIAGNÓSTICO ESTRATÉGICO:");
    console.log(`- Potencial de Impacto (ROI): ${ai.health.impactPotential}%`);
    console.log(`- Sustentabilidade de Receita: ${ai.health.sustainabilityIndex}%`);
    console.log(`- Segurança de Runtime: ${ai.health.runtimeSafetyScore}%`);

    if (ai.priorities.length) {
      console.log("\n🔥 FILA DE AÇÃO EDITORIAL (ALTA PRIORIDADE):");
      ai.priorities.forEach(p => console.log(`   └─ [${p.impact}] ${p.action}: ${p.reason}`));
    }
  }

  if (report.authorityMetrics) {
    console.log("\n⚡ PERFORMANCE & SEARCH DOMINANCE");
    console.log(`- Performance Score: ${report.authorityMetrics.global.performanceScore}%`);
    console.log(`- Search Dominance: ${report.authorityMetrics.global.searchDominance}%`);
    
    console.log("\n🌐 SEMANTIC ECOSYSTEM STABILITY REPORT");
    console.log(`- Redução de Órfãos: ${report.authorityMetrics.global.orphanReduction}`);
    console.log(`- Coesão Semântica: ${Math.round(report.authorityMetrics.global.semanticCohesionGlobal * 100)}%`);
    
    console.log("\n--- Saúde por Categoria ---");
    Object.keys(report.authorityMetrics.clusters).forEach(cat => {
      const c = report.authorityMetrics.clusters[cat];
      const icon = c.maturityLevel === "Dominante" ? "🔥" : c.maturityLevel === "Maduro" ? "👑" : c.maturityLevel === "Estruturado" ? "💎" : "🌱";
      console.log(`${icon} [${cat.toUpperCase()}]: ${c.score} pts | ${c.maturityLevel}`);
    });
  }

  if (report.failures.length) {
    console.log("\n❌ FALHAS CRÍTICAS (REQUEREM AÇÃO):");
    report.failures.forEach(f => console.log(`   └─ ${f}`));
  }

  if (report.warnings.length) {
    console.log("\n⚠️ ALERTAS OPERACIONAIS:");
    report.warnings.slice(0, 5).forEach(w => console.log(`   └─ ${w}`));
    if (report.warnings.length > 5) console.log(`   ... e mais ${report.warnings.length - 5} avisos.`);
  }
}

module.exports = {
  composeFinalReport
};
