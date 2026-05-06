require("dotenv").config();

const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const {
  approve,
  rejectOrReview,
  getPendingProposal,
  formatProposal,
  proposalKeyboard,
  processRemindersAndExpirations
} = require("./proposal-manager");

const { check } = require("./site-guardian");

const TOKEN = process.env.GUARDIAN_TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.GUARDIAN_TELEGRAM_CHAT_ID || "");

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

function isAdminFromMessage(msg) {
  if (!ADMIN_CHAT_ID) return true;
  return String(msg.chat.id) === ADMIN_CHAT_ID;
}

function isAdminFromQuery(query) {
  if (!ADMIN_CHAT_ID) return true;
  return String(query.message.chat.id) === ADMIN_CHAT_ID;
}

async function startGuardianBot() {
  if (!TOKEN) {
    console.log("Guardian Bot: GUARDIAN_TELEGRAM_BOT_TOKEN não configurado.");
    return;
  }

  const bot = new TelegramBot(TOKEN, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });

  bot.on("polling_error", (err) => {
    console.error("Guardian Bot polling_error:", err.message);
  });

  bot.onText(/\/start|start|START/i, (msg) => {
    if (!isAdminFromMessage(msg)) return;

    bot.sendMessage(
      msg.chat.id,
      "✅ Guardian ativo.\n\nComandos:\npropostas\nguardian\nideia categoria | título | prioridade\nsugestao area | feedback | urgencia\n\nAs propostas também terão botões de aprovar/rejeitar."
    );
  });

  bot.on("callback_query", async (query) => {
    if (!isAdminFromQuery(query)) {
      return bot.answerCallbackQuery(query.id, {
        text: "Sem permissão.",
        show_alert: true
      });
    }

    const data = String(query.data || "");
    const [action, proposalId] = data.split(":");

    try {
      if (action === "details") {
        const proposal = getPendingProposal(proposalId);
        if (!proposal) {
          return bot.answerCallbackQuery(query.id, {
            text: "Proposta já resolvida ou não encontrada.",
            show_alert: true
          });
        }

        await bot.sendMessage(query.message.chat.id, formatProposal(proposal), {
          parse_mode: "HTML",
          reply_markup: proposalKeyboard(proposal.id)
        });

        return bot.answerCallbackQuery(query.id, { text: "Detalhes enviados." });
      }

      if (action === "approve") {
        const proposal = approve(proposalId, "telegram_button");

        await bot.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
          }
        ).catch(() => {});

        await bot.sendMessage(query.message.chat.id, `✅ ${proposal.id} aprovada.\nStatus: ${proposal.status}`);
        return bot.answerCallbackQuery(query.id, { text: "Aprovada." });
      }

      if (action === "reject") {
        const result = rejectOrReview(proposalId, "Rejeitada pelo botão do Telegram.", "telegram_button");

        await bot.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
          }
        ).catch(() => {});

        if (result.action === "review") {
          await bot.sendMessage(query.message.chat.id, `🔁 ${proposalId} voltou para análise com a mesma numeração.`);
        } else {
          await bot.sendMessage(query.message.chat.id, `❌ ${proposalId} rejeitada e arquivada.`);
        }

        return bot.answerCallbackQuery(query.id, { text: "Processado." });
      }
    } catch (err) {
      await bot.answerCallbackQuery(query.id, {
        text: err.message,
        show_alert: true
      });
      return bot.sendMessage(query.message.chat.id, `Erro: ${err.message}`);
    }
  });

  bot.on("message", async (msg) => {
    if (!isAdminFromMessage(msg)) return;

    const text = String(msg.text || "").trim();
    if (!text || /^\/start$|^start$|^START$/i.test(text)) return;

    try {
      if (text === "propostas") {
        const data = readJson("data/pending-approvals.json", []);

        if (!data.length) {
          return bot.sendMessage(msg.chat.id, "Nenhuma proposta pendente.");
        }

        for (const proposal of data) {
          await bot.sendMessage(msg.chat.id, formatProposal(proposal), {
            parse_mode: "HTML",
            reply_markup: proposalKeyboard(proposal.id)
          });
        }

        return;
      }

      if (text === "guardian") {
        const report = check();

        return bot.sendMessage(
          msg.chat.id,
          `Guardian: ${report.ok ? "✅ aprovado" : "❌ bloqueado"}\nFalhas: ${report.failures.length}\nAlertas: ${report.warnings.length}`
        );
      }

      if (text.startsWith("aprovar ")) {
        const id = text.split(" ")[1];
        const proposal = approve(id, "telegram_text");
        return bot.sendMessage(msg.chat.id, `✅ Proposta aprovada: ${proposal.id}`);
      }

      if (text.startsWith("rejeitar ")) {
        const parts = text.split(" ");
        const id = parts[1];
        const reason = parts.slice(2).join(" ") || "Rejeitada pelo Telegram.";
        const result = rejectOrReview(id, reason, "telegram_text");

        if (result.action === "review") return bot.sendMessage(msg.chat.id, `🔁 ${id} voltou para análise.`);
        return bot.sendMessage(msg.chat.id, `❌ ${id} rejeitada.`);
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

        return bot.sendMessage(msg.chat.id, "✅ Ideia registrada.");
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

        return bot.sendMessage(msg.chat.id, "✅ Sugestão registrada.");
      }

      return bot.sendMessage(msg.chat.id, "Comando não reconhecido. Envie: propostas, guardian, ideia ou sugestao.");
    } catch (err) {
      return bot.sendMessage(msg.chat.id, `Erro: ${err.message}`);
    }
  });

  setInterval(() => {
    processRemindersAndExpirations();
  }, 15 * 60 * 1000);

  console.log("✅ Guardian Telegram Bot iniciado.");
}

if (require.main === module) {
  startGuardianBot();
}

module.exports = { startGuardianBot };
