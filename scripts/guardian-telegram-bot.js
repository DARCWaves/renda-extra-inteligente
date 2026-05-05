require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const { approve, reject, processRemindersAndExpirations } = require("./proposal-manager");
const { check } = require("./site-guardian");

let botInstance = null;

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function startGuardianTelegramBot() {
  const token = process.env.GUARDIAN_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = String(process.env.GUARDIAN_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "");

  if (!token) {
    console.log("Guardian Telegram: token não configurado.");
    return null;
  }

  if (botInstance) return botInstance;

  botInstance = new TelegramBot(token, { polling: true });

  function isAdmin(msg) {
    if (!adminChatId) return true;
    return String(msg.chat.id) === adminChatId;
  }

  botInstance.onText(/\/start|\/help/, (msg) => {
    if (!isAdmin(msg)) return;

    botInstance.sendMessage(msg.chat.id, `
Guardian Bot ativo.

Comandos:
propostas
aprovar change-0001
rejeitar change-0001 motivo
guardian
ideia categoria | título | prioridade
sugestao area | feedback | urgencia
    `.trim());
  });

  botInstance.on("message", async (msg) => {
    if (!isAdmin(msg)) return;

    const text = String(msg.text || "").trim();
    if (!text || text.startsWith("/start") || text.startsWith("/help")) return;

    try {
      if (text === "propostas") {
        const data = readJson("data/pending-approvals.json", []);
        if (!data.length) return botInstance.sendMessage(msg.chat.id, "Nenhuma proposta pendente.");

        return botInstance.sendMessage(
          msg.chat.id,
          data.map(p => `${p.id} — ${p.title}\nStatus: ${p.status}\nUrgência: ${p.urgency}`).join("\n\n")
        );
      }

      if (text.startsWith("aprovar ")) {
        const id = text.split(" ")[1];
        const proposal = approve(id);
        return botInstance.sendMessage(msg.chat.id, `✅ Proposta aprovada: ${proposal.id}`);
      }

      if (text.startsWith("rejeitar ")) {
        const parts = text.split(" ");
        const id = parts[1];
        const reason = parts.slice(2).join(" ") || "Rejeitada pelo dono.";
        const proposal = reject(id, reason);
        return botInstance.sendMessage(msg.chat.id, `❌ Proposta rejeitada: ${proposal.id}`);
      }

      if (text === "guardian") {
        const report = check();
        return botInstance.sendMessage(
          msg.chat.id,
          `Guardian: ${report.ok ? "✅ aprovado" : "❌ bloqueado"}\nFalhas: ${report.failures.length}\nAlertas: ${report.warnings.length}`
        );
      }

      if (text.startsWith("ideia ")) {
        const body = text.replace(/^ideia\s+/i, "");
        const [category, title, priority] = body.split("|").map(x => String(x || "").trim());

        const ideas = readJson("data/content-ideas.json", []);
        ideas.push({
          category: category || "financas",
          title: title || body,
          priority: priority || "media",
          status: "new",
          createdAt: new Date().toISOString(),
          source: "telegram"
        });
        writeJson("data/content-ideas.json", ideas);

        return botInstance.sendMessage(msg.chat.id, "✅ Ideia registrada.");
      }

      if (text.startsWith("sugestao ") || text.startsWith("sugestão ")) {
        const body = text.replace(/^sugest(a|ã)o\s+/i, "");
        const [area, feedback, urgency] = body.split("|").map(x => String(x || "").trim());

        const suggestions = readJson("data/admin-suggestions.json", []);
        suggestions.push({
          area: area || "site",
          feedback: feedback || body,
          urgency: urgency || "medium",
          status: "new",
          createdAt: new Date().toISOString(),
          source: "telegram"
        });
        writeJson("data/admin-suggestions.json", suggestions);

        return botInstance.sendMessage(msg.chat.id, "✅ Sugestão registrada.");
      }
    } catch (err) {
      return botInstance.sendMessage(msg.chat.id, `Erro: ${err.message}`);
    }
  });

  setInterval(() => {
    processRemindersAndExpirations();
  }, 15 * 60 * 1000);

  console.log("Guardian Telegram Bot iniciado.");
  return botInstance;
}

if (require.main === module) {
  startGuardianTelegramBot();
}

module.exports = { startGuardianTelegramBot };
