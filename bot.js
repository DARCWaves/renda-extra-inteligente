require("dotenv").config();

const { startAffiliateBot } = require("./scripts/affiliate-telegram-bot");

/**
 * Inicia o bot de afiliados se configurado.
 * Centralizado para evitar múltiplas instâncias.
 */
function startTelegramBot() {
  if (process.env.ENABLE_AFFILIATE_TELEGRAM === "true" || process.env.ENABLE_TELEGRAM_BOT === "true") {
    console.log("🤖 Iniciando Affiliate Bot...");
    startAffiliateBot();
  } else {
    console.log("🤖 Affiliate Bot desativado (ENABLE_AFFILIATE_TELEGRAM=false).");
  }
}

module.exports = { startTelegramBot };
