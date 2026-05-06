const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const APPROVALS = path.join(ROOT, "data", "pending-approvals.json");
const HISTORY = path.join(ROOT, "data", "decision-history.json");
const RULES = path.join(ROOT, "data", "site-rules.json");

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

function now() {
  return new Date();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function nextId() {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const total = approvals.length + history.length + 1;
  return `change-${String(total).padStart(4, "0")}`;
}

function getUrgencyRule(urgency) {
  const rules = readJson(RULES, {});
  return rules.urgencyRules?.[urgency] || rules.urgencyRules?.low || {};
}

function calculateExpiration(urgency) {
  const rule = getUrgencyRule(urgency);
  if (rule.expires === false) return null;
  return addDays(now(), Number(rule.expiresAfterDays || 2)).toISOString();
}

function sendTelegram(text) {
  const token = process.env.GUARDIAN_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.GUARDIAN_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("Telegram não configurado:");
    console.log(text);
    return;
  }

  const body = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  });

  const req = https.request(
    {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    (res) => res.on("data", () => {})
  );

  req.on("error", (err) => console.error("Erro Telegram:", err.message));
  req.write(body);
  req.end();
}

function formatProposal(proposal) {
  return `
📌 <b>${proposal.id}</b>
<b>${proposal.title}</b>

Status: ${proposal.status}
Urgência: ${proposal.urgency}
Risco: ${proposal.riskLevel}

O que mudou:
${(proposal.whatChanged || []).map(x => "• " + x).join("\n") || "• Não informado"}

Por que mudou:
${(proposal.whyChanged || []).map(x => "• " + x).join("\n") || "• Não informado"}

Benefícios:
${(proposal.benefits || []).map(x => "• " + x).join("\n") || "• Não informado"}

Riscos:
${(proposal.risks || []).map(x => "• " + x).join("\n") || "• Não informado"}

Impacto financeiro:
• AdSense: ${proposal.financialImpact?.adsense || "não informado"}
• Afiliado: ${proposal.financialImpact?.affiliate || "não informado"}
• SEO: ${proposal.financialImpact?.seo || "não informado"}
• Tráfego: ${proposal.financialImpact?.traffic || "não informado"}
• Retenção: ${proposal.financialImpact?.retention || "não informado"}

Arquivos:
${(proposal.filesChanged || []).map(x => "• " + x).join("\n") || "• Nenhum arquivo informado"}

Comandos:
aprovar ${proposal.id}
rejeitar ${proposal.id}
`.trim();
}

function createProposal(input) {
  const urgency = input.urgency || "low";
  const createdAt = now().toISOString();

  const proposal = {
    id: nextId(),
    status: "pending",
    urgency,
    riskLevel: input.riskLevel || urgency,
    type: input.type || "general",
    title: input.title || "Proposta sem título",
    summary: input.summary || "",
    whatChanged: input.whatChanged || [],
    whyChanged: input.whyChanged || [],
    benefits: input.benefits || [],
    risks: input.risks || [],
    financialImpact: input.financialImpact || {
      adsense: "não informado",
      affiliate: "não informado",
      seo: "não informado",
      traffic: "não informado",
      retention: "não informado"
    },
    seoImpact: input.seoImpact || {
      before: "não informado",
      after: "não informado"
    },
    technicalImpact: input.technicalImpact || [],
    filesChanged: input.filesChanged || [],
    requiresExplicitApproval: true,
    canAutoApply: false,
    canAutoReject: urgency !== "critical" && urgency !== "high",
    reviewCount: 0,
    remindersSent: 0,
    lastReminderAt: null,
    createdAt,
    expiresAt: calculateExpiration(urgency),
    createdBy: "site-agent"
  };

  const approvals = readJson(APPROVALS, []);
  approvals.push(proposal);
  writeJson(APPROVALS, approvals);

  sendTelegram(`🆕 Nova proposta criada.\n\n${formatProposal(proposal)}`);

  return proposal;
}

function processRemindersAndExpirations() {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const current = now();

  let changed = false;

  for (const proposal of approvals) {
    if (proposal.status !== "pending") continue;

    const rule = getUrgencyRule(proposal.urgency);
    const reminderEveryHours = Number(rule.reminderEveryHours || 24);
    const lastReminder = proposal.lastReminderAt ? new Date(proposal.lastReminderAt) : null;

    if (!lastReminder || current >= addHours(lastReminder, reminderEveryHours)) {
      sendTelegram(`⚠️ Você ainda não viu a proposta ${proposal.id}.\n\n${formatProposal(proposal)}`);
      proposal.lastReminderAt = current.toISOString();
      proposal.remindersSent = Number(proposal.remindersSent || 0) + 1;
      changed = true;
    }

    if (proposal.expiresAt && current > new Date(proposal.expiresAt)) {
      if (proposal.urgency === "low" && Number(proposal.reviewCount || 0) < 1) {
        proposal.reviewCount = Number(proposal.reviewCount || 0) + 1;
        proposal.expiresAt = calculateExpiration("low");
        proposal.title = proposal.title.includes("(revisada)") ? proposal.title : `${proposal.title} (revisada)`;
        proposal.whyChanged.push("A proposta passou de 2 dias sem resposta e voltou para análise automática.");
        proposal.risks.push("Se não for avaliada novamente, será reprovada automaticamente no próximo vencimento.");
        sendTelegram(`🔁 A proposta ${proposal.id} voltou para análise.\n\n${formatProposal(proposal)}`);
        changed = true;
      } else if (proposal.urgency === "medium" || proposal.urgency === "low") {
        proposal.status = "auto_rejected";
        proposal.resolvedAt = current.toISOString();
        proposal.resolutionReason = "Expiração automática conforme regra de urgência.";
        history.push(proposal);
        changed = true;
      } else if (proposal.urgency === "high") {
        proposal.status = "needs_review";
        proposal.resolutionReason = "Expirou após 7 dias e voltou para análise.";
        changed = true;
      }
    }
  }

  const pending = approvals.filter(p => !["auto_rejected", "rejected", "approved", "applied"].includes(p.status));
  const resolved = approvals.filter(p => ["auto_rejected", "rejected", "approved", "applied"].includes(p.status));

  if (changed) {
    writeJson(APPROVALS, pending);
    writeJson(HISTORY, history.concat(resolved));
  }

  return { pending: pending.length, resolved: resolved.length };
}

function approve(idValue) {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const index = approvals.findIndex(p => p.id === idValue);

  if (index === -1) throw new Error("Proposta não encontrada.");

  const proposal = approvals[index];
  proposal.status = "approved";
  proposal.approvedAt = now().toISOString();

  approvals.splice(index, 1);
  history.push(proposal);

  writeJson(APPROVALS, approvals);
  writeJson(HISTORY, history);

  sendTelegram(`✅ Proposta aprovada: ${proposal.id}`);

  return proposal;
}

function reject(idValue, reason = "Rejeitada pelo dono do site.") {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const index = approvals.findIndex(p => p.id === idValue);

  if (index === -1) throw new Error("Proposta não encontrada.");

  const proposal = approvals[index];
  proposal.status = "rejected";
  proposal.rejectedAt = now().toISOString();
  proposal.rejectionReason = reason;

  approvals.splice(index, 1);
  history.push(proposal);

  writeJson(APPROVALS, approvals);
  writeJson(HISTORY, history);

  sendTelegram(`❌ Proposta rejeitada: ${proposal.id}\nMotivo: ${reason}`);

  return proposal;
}

if (require.main === module) {
  const action = process.argv[2];
  const value = process.argv[3];

  try {
    if (action === "tick") {
      console.log(processRemindersAndExpirations());
    } else if (action === "list") {
      console.log(JSON.stringify(readJson(APPROVALS, []), null, 2));
    } else if (action === "approve") {
      console.log(approve(value));
    } else if (action === "reject") {
      console.log(reject(value, process.argv.slice(4).join(" ") || undefined));
    } else {
      console.log("Uso:");
      console.log("node scripts/proposal-manager.js tick");
      console.log("node scripts/proposal-manager.js list");
      console.log("node scripts/proposal-manager.js approve change-0001");
      console.log("node scripts/proposal-manager.js reject change-0001 motivo");
    }
  } catch (err) {
    console.error("❌", err.message);
    process.exit(1);
  }
}

module.exports = {
  createProposal,
  processRemindersAndExpirations,
  approve,
  reject,
  formatProposal,
  sendTelegram
};
