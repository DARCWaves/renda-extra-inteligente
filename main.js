require("dotenv").config();

// Carrega app e o boot do motor de conteúdo
const { app, bootAutoContentEngine } = require("./app");

const cron = require("node-cron");
const { runAutoPost } = require("./autoContent");

/*
==================================================
CONFIGURAÇÃO DE CRONS (CENTRALIZADO)
==================================================
*/

// Cron para posts baseados em templates (Rápido e estável)
if (process.env.AUTO_POSTS === "true") {
  cron.schedule("*/15 * * * *", () => {
    console.log("🤖 [Cron] Gerando conteúdo via templates...");
    Promise.resolve(runAutoPost()).catch((err) => {
      console.error("Erro ao gerar post automático (template):", err.message);
    });
  });
}

// Inicia o motor de conteúdo IA (GPT) se configurado
// Agora centralizado em main.js para evitar duplicação no boot do app.js
bootAutoContentEngine();

const PORT = process.env.PORT || 3000;

/*
==================================================
PROTEÇÃO CONTRA DUPLICAÇÃO
==================================================
*/

let serverStarted = false;

/*
==================================================
INICIAR BOT TELEGRAM
==================================================
*/

function startBotSafely() {
  try {
    // Se estiver no Render, podemos querer rodar o bot apenas no worker
    // mas se o usuário habilitar explicitamente no web, permitimos aqui.
    if (process.env.ENABLE_TELEGRAM_BOT === "false") {
      console.log("🤖 Bot Telegram desativado por ENV.");
      return;
    }

    const { startTelegramBot } = require("./bot");

    if (typeof startTelegramBot !== "function") {
      console.log("⚠️ startTelegramBot não encontrado em bot.js");
      return;
    }

    startTelegramBot();
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
  if (serverStarted) {
    console.log("⚠️ Servidor já foi iniciado.");
    return;
  }

  serverStarted = true;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Seu serviço está online na porta ${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Base URL: ${process.env.BASE_URL || process.env.SITE_URL || "localhost"}`);
  });
}

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

startBotSafely();
startServer();
