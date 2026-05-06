require("dotenv").config();

const https = require("https");

function getMe(label, token) {
  return new Promise((resolve) => {
    if (!token) {
      console.log(`❌ ${label}: token ausente`);
      return resolve(false);
    }

    https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.ok) {
            console.log(`✅ ${label}: @${json.result.username} (${json.result.first_name})`);
            resolve(true);
          } else {
            console.log(`❌ ${label}: token inválido`, json.description);
            resolve(false);
          }
        } catch {
          console.log(`❌ ${label}: resposta inválida`);
          resolve(false);
        }
      });
    }).on("error", (err) => {
      console.log(`❌ ${label}: ${err.message}`);
      resolve(false);
    });
  });
}

(async () => {
  await getMe("AFFILIATE BOT", process.env.TELEGRAM_BOT_TOKEN);
  await getMe("GUARDIAN BOT", process.env.GUARDIAN_TELEGRAM_BOT_TOKEN);

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.GUARDIAN_TELEGRAM_BOT_TOKEN) {
    if (process.env.TELEGRAM_BOT_TOKEN === process.env.GUARDIAN_TELEGRAM_BOT_TOKEN) {
      console.log("❌ ERRO: os dois bots estão usando o mesmo token.");
      process.exit(1);
    }
  }

  console.log("✅ Diagnóstico concluído.");
})();
