require("dotenv").config();

// Carrega app e o boot do motor de conteúdo
const { app, bootAutoContentEngine } = require("./app");
const cron = require("node-cron");
const { runAutoPost } = require("./autoContent");

/*
==================================================
VALIDAÇÃO DE AMBIENTE
==================================================
*/

function validateEnv() {
  const required = ["PANEL_SECRET"];
  const missing = required.filter(key => !process.env[required]);

  if (missing.length > 0) {
    console.error(`❌ ERRO CRÍTICO: Variáveis de ambiente ausentes: ${missing.join(", ")}`);
    // Em produção, falhar o boot se variáveis críticas sumirem
    if (process.env.NODE_ENV === "production") process.exit(1);
  }

  if (!process.env.BASE_URL && !process.env.SITE_URL) {
    console.warn("⚠️ AVISO: BASE_URL não configurada. O sitemap e links absolutos podem falhar.");
  }
}

/*
==================================================
CONFIGURAÇÃO DE CRONS (CENTRALIZADO)
==================================================
*/

function startCrons() {
  if (process.env.AUTO_POSTS === "true") {
    cron.schedule("*/15 * * * *", () => {
      console.log("🤖 [Cron] Gerando conteúdo via templates...");
      Promise.resolve(runAutoPost()).catch((err) => {
        console.error("Erro ao gerar post automático (template):", err.message);
      });
    });
    console.log("✅ Crons de conteúdo agendados.");
  }
}

const PORT = process.env.PORT || 3000;
let serverInstance = null;

/*
==================================================
INICIAR BOT TELEGRAM
==================================================
*/

function startBotSafely() {
  try {
    if (process.env.ENABLE_TELEGRAM_BOT === "false") {
      console.log("🤖 Bot Telegram desativado por ENV.");
      return;
    }

    const { startTelegramBot } = require("./bot");
    if (typeof startTelegramBot === "function") {
      startTelegramBot();
    }
  } catch (err) {
    console.log("⚠️ Bot Telegram não iniciado:", err.message);
  }
}

/*
==================================================
INICIAR SERVIDOR
==================================================
*/

function startServer() {
  serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
    
    // Inicia tarefas de fundo APÓS o servidor estar pronto
    // Isso garante que o Render receba o sinal de "online" rápido.
    setImmediate(() => {
      console.log("🔧 Iniciando tarefas de fundo...");
      startBotSafely();
      startCrons();
      bootAutoContentEngine();
    });
  });
}

/*
==================================================
GRACEFUL SHUTDOWN (SEGURANÇA RENDER)
==================================================
*/

function handleShutdown(signal) {
  console.log(`\n👋 Recebido ${signal}. Encerrando graciosamente...`);
  
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("🛑 Servidor HTTP encerrado.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Força encerramento após 10s se travar
  setTimeout(() => {
    console.error("❌ Shutdown forçado após timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

/*
==================================================
TRATAMENTO DE ERROS GLOBAIS
==================================================
*/

process.on("uncaughtException", (err) => {
  console.error("🔥 Erro não tratado:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 Promise rejeitada:", reason);
});

/*
==================================================
BOOT
==================================================
*/

validateEnv();
startServer();
