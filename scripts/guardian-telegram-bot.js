require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const {
  approve,
  rejectOrReview,
  getPendingProposal,
  formatProposal,
  proposalKeyboard,
  processRemindersAndExpirations
} = require("./proposal-manager");

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
  const token = process.env.GUARDIAN_TELEGRAM_BOT_TOKEN;
  const adminChatId = String(process.env.GUARDIAN_TELEGRAM_CHAT_ID || "");

  if (!token) {
    console.log("Guardian Telegram: GUARDIAN_TELEGRAM_BOT_TOKEN não configurado.");
    return null;
  }

  if (botInstance) return botInstance;

  botInstance = new TelegramBot(token, { polling: true });

  function isAdmin(msgOrQuery) {
    const chatId = msgOrQuery?.message?.chat?.id || msgOrQuery?.chat?.id;
    if (!adminChatId) return true;
    return String(chatId) === adminChatId;
  }

  botInstance.onText(/\/start|\/help/, (msg) => {
    if (!isAdmin(msg)) return;

    botInstance.sendMessage(msg.chat.id, `
Guardian Bot ativo.

Comandos:
propostas
guardian
ideia categoria | título | prioridade
sugestao area | feedback | urgencia

Você também pode aprovar ou rejeitar usando os botões abaixo de cada proposta.
    `.trim());
  });

  botInstance.on("callback_query", async (query) => {
    if (!isAdmin(query)) {
      return botInstance.answerCallbackQuery(query.id, {
        text: "Você não tem permissão para isso.",
        show_alert: true
      });
    }

    const data = String(query.data || "");
    const [action, proposalId] = data.split(":");

    try {
      if (action === "details") {
        const proposal = getPendingProposal(proposalId);

        if (!proposal) {
          return botInstance.answerCallbackQuery(query.id, {
            text: "Proposta não encontrada ou já resolvida.",
            show_alert: true
          });
        }

        await botInstance.sendMessage(
          query.message.chat.id,
          formatProposal(proposal),
          {
            parse_mode: "HTML",
            reply_markup: proposalKeyboard(proposal.id)
          }
        );

        return botInstance.answerCallbackQuery(query.id, {
          text: "Detalhes enviados."
        });
      }

      if (action === "approve") {
        const proposal = approve(proposalId, "telegram_button");

        await botInstance.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
          }
        ).catch(() => {});

        await botInstance.sendMessage(
          query.message.chat.id,
          `✅ Proposta ${proposal.id} aprovada pelo botão.\nStatus: ${proposal.status}`
        );

        return botInstance.answerCallbackQuery(query.id, {
          text: "Proposta aprovada."
        });
      }

      if (action === "reject") {
        const result = rejectOrReview(
          proposalId,
          "Rejeitada pelo botão do Telegram para reanálise.",
          "telegram_button"
        );

        await botInstance.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
          }
        ).catch(() => {});

        if (result.action === "review") {
          await botInstance.sendMessage(
            query.message.chat.id,
            `🔁 Proposta ${proposalId} voltou para análise com a mesma numeração.`
          );
        } else {
          await botInstance.sendMessage(
            query.message.chat.id,
            `❌ Proposta ${proposalId} rejeitada e arquivada.`
          );
        }

        return botInstance.answerCallbackQuery(query.id, {
          text: result.action === "review" ? "Voltou para análise." : "Rejeitada."
        });
      }

      return botInstance.answerCallbackQuery(query.id, {
        text: "Ação desconhecida.",
        show_alert: true
      });
    } catch (err) {
      await botInstance.answerCallbackQuery(query.id, {
        text: err.message,
        show_alert: true
      });

      return botInstance.sendMessage(
        query.message.chat.id,
        `Erro ao processar ação: ${err.message}`
      );
    }
  });

  botInstance.on("message", async (msg) => {
    if (!isAdmin(msg)) return;

    const text = String(msg.text || "").trim();
    if (!text || text.startsWith("/start") || text.startsWith("/help")) return;

    try {
      if (text === "propostas") {
        const data = readJson("data/pending-approvals.json", []);
        if (!data.length) return botInstance.sendMessage(msg.chat.id, "Nenhuma proposta pendente.");

        for (const proposal of data) {
          await botInstance.sendMessage(
            msg.chat.id,
            formatProposal(proposal),
            {
              parse_mode: "HTML",
              reply_markup: proposalKeyboard(proposal.id)
            }
          );
        }

        return;
      }

      if (text === "guardian") {
        const report = check();
        return botInstance.sendMessage(
          msg.chat.id,
          `Guardian: ${report.ok ? "✅ aprovado" : "❌ bloqueado"}\nFalhas: ${report.failures.length}\nAlertas: ${report.warnings.length}`
        );
      }

      if (text.startsWith("aprovar ")) {
        const id = text.split(" ")[1];
        const proposal = approve(id, "telegram_text");
        return botInstance.sendMessage(msg.chat.id, `✅ Proposta aprovada: ${proposal.id}`);
      }

      if (text.startsWith("rejeitar ")) {
        const parts = text.split(" ");
        const id = parts[1];
        const reason = parts.slice(2).join(" ") || "Rejeitada pelo Telegram.";
        const result = rejectOrReview(id, reason, "telegram_text");

        if (result.action === "review") {
          return botInstance.sendMessage(msg.chat.id, `🔁 Proposta ${id} voltou para análise.`);
        }

        return botInstance.sendMessage(msg.chat.id, `❌ Proposta rejeitada: ${id}`);
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

  console.log("Guardian Telegram Bot iniciado com botões.");
  return botInstance;
}

if (require.main === module) {
  startGuardianTelegramBot();
}

module.exports = { startGuardianTelegramBot };
