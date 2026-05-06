require("dotenv").config();

const { startAffiliateBot } = require("./scripts/affiliate-telegram-bot");

if (process.env.ENABLE_AFFILIATE_TELEGRAM === "true") {
  startAffiliateBot();
} else {
  console.log("Affiliate Bot não iniciado. Defina ENABLE_AFFILIATE_TELEGRAM=true para ativar.");
}
