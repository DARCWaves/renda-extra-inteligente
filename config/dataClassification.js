/**
 * Classificação de Dados e Regras de Persistência.
 * Define quais arquivos são permanentes, logs ou relatórios temporários.
 */

const DATA_CATEGORIES = {
  CONTENT_DATABASE: "Bancos de dados de conteúdo (Posts, Pilares).",
  CONFIGURATION: "Arquivos de configuração e regras de negócio.",
  TRANSACTIONAL_DATABASE: "Dados de transação (Links, Cliques).",
  RUNTIME_LOG: "Registros de eventos em tempo real e falhas.",
  TEMPORARY_REPORT: "Saídas de análise e diagnósticos.",
  PATCH_QUEUE: "Filas de melhorias pendentes de aprovação.",
  BACKUP_ARTIFACT: "Cópias de segurança e snapshots temporários."
};

const DATA_CLASSIFICATION = {
  "posts.json": {
    category: "CONTENT_DATABASE",
    shouldCommit: true,
    shouldBackup: true,
    risk: "Crítico",
    owner: "postService"
  },
  "pillars.json": {
    category: "CONTENT_DATABASE",
    shouldCommit: true,
    shouldBackup: true,
    risk: "Crítico",
    owner: "pillarService"
  },
  "site-rules.json": {
    category: "CONFIGURATION",
    shouldCommit: true,
    shouldBackup: true,
    risk: "Médio",
    owner: "guardian"
  },
  "affiliates.json": {
    category: "TRANSACTIONAL_DATABASE",
    shouldCommit: true,
    shouldBackup: true,
    risk: "Alto",
    owner: "affiliateService"
  },
  "analytics.json": {
    category: "RUNTIME_LOG",
    shouldCommit: false,
    shouldBackup: false,
    shouldIgnore: true,
    risk: "Baixo",
    owner: "analyticsService"
  },
  "runtime-failures.json": {
    category: "RUNTIME_LOG",
    shouldCommit: false,
    shouldBackup: false,
    shouldIgnore: true,
    risk: "Baixo",
    owner: "runtimeValidationService"
  },
  "guardian-report.json": {
    category: "TEMPORARY_REPORT",
    shouldCommit: false,
    shouldBackup: false,
    shouldIgnore: true,
    risk: "Baixo",
    owner: "guardian"
  },
  "seo-patches.json": {
    category: "PATCH_QUEUE",
    shouldCommit: false,
    shouldBackup: true,
    shouldIgnore: true,
    risk: "Baixo",
    owner: "seoRefactorService"
  },
  "patch-history.json": {
    category: "RUNTIME_LOG",
    shouldCommit: false,
    shouldBackup: true,
    shouldIgnore: true,
    risk: "Baixo",
    owner: "patchApplicationService"
  }
};

module.exports = {
  DATA_CATEGORIES,
  DATA_CLASSIFICATION
};
