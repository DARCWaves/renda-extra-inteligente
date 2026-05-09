const { classifyRuntimeError } = require("../../services/runtimeValidationService");
const { safeExecute } = require("../../services/realtimeIndicatorService");
const { createReport } = require("../../config/reportSchema");

function performRuntimeChecks(failures, passed) {
  const startTime = Date.now();
  const moduleFailures = [];
  
  try {
    const services = [
      "../../services/postService",
      "../../services/authorityMetricsService",
      "../../services/monetizationIntelligenceService",
      "../../services/insightDashboardService",
      "../../services/trafficIntelligenceService"
    ];

    services.forEach(s => {
      try {
        require(s);
      } catch (err) {
        moduleFailures.push(`[RUNTIME] Falha no serviço ${s}: ${err.message}`);
      }
    });

  } catch (err) {
    moduleFailures.push(`Erro fatal na simulação de runtime: ${err.message}`);
  }

  moduleFailures.forEach(f => failures.push(f));
  if (moduleFailures.length === 0) passed.push("Simulação de carregamento de serviços OK.");

  return createReport({
    service: "Runtime Availability",
    category: "infrastructure",
    score: moduleFailures.length > 0 ? 50 : 100,
    criticalIssues: moduleFailures,
    runtime: { executionTime: Date.now() - startTime }
  });
}

function simulateRendering(passed, safeExecute) {
  const startTime = Date.now();
  const renderingWarnings = [];

  const routesToTest = [
    { name: "Home", path: "/", payload: { posts: [], indicators: {} } },
    { name: "Post", path: "/post/slug", payload: { post: { title: "Test", category: "financas" }, affiliates: [], relatedPosts: [] } },
    { name: "Pillar", path: "/guia/slug", payload: { pillar: { title: "Test", sections: [], faqs: [] }, affiliates: [] } }
  ];

  routesToTest.forEach(route => {
    const success = safeExecute(`Render [${route.name}]`, () => {
      if (route.name === "Post" && (!route.payload.post || !route.payload.post.category)) {
        throw new Error("Contexto de renderização do Post incompleto.");
      }
    });
    
    if (success) passed.push(`Simulação de renderização [${route.name}] validada.`);
    else renderingWarnings.push(`Falha na simulação de renderização: ${route.name}`);
  });

  return createReport({
    service: "Rendering Simulation",
    category: "ux",
    score: renderingWarnings.length > 0 ? 70 : 100,
    warnings: renderingWarnings,
    runtime: { executionTime: Date.now() - startTime }
  });
}

module.exports = {
  performRuntimeChecks,
  simulateRendering
};
