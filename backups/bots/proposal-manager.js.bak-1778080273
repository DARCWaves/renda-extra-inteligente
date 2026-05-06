const fs = require("fs");
const path = require("path");
const https = require("https");
const childProcess = require("child_process");

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

function sendTelegram(text, keyboard = null) {
  const token = process.env.GUARDIAN_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.GUARDIAN_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("⚠️ Telegram Guardian não configurado.");
    console.log(text);
    return;
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };

  if (keyboard) payload.reply_markup = keyboard;

  const body = JSON.stringify(payload);

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

  req.on("error", (err) => console.error("Erro Telegram Guardian:", err.message));
  req.write(body);
  req.end();
}

function proposalKeyboard(id) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Aprovar", callback_data: `approve:${id}` },
        { text: "❌ Rejeitar / Reanalisar", callback_data: `reject:${id}` }
      ],
      [
        { text: "📋 Ver detalhes", callback_data: `details:${id}` }
      ]
    ]
  };
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
    patches: input.patches || [],
    requiresExplicitApproval: true,
    canAutoApply: false,
    canAutoReject: urgency !== "critical" && urgency !== "high",
    reviewCount: 0,
    maxReviewCycles: urgency === "low" ? 1 : 1,
    remindersSent: 0,
    lastReminderAt: null,
    createdAt,
    expiresAt: calculateExpiration(urgency),
    createdBy: "site-agent"
  };

  const approvals = readJson(APPROVALS, []);
  approvals.push(proposal);
  writeJson(APPROVALS, approvals);

  sendTelegram(`🆕 Nova proposta criada.\n\n${formatProposal(proposal)}`, proposalKeyboard(proposal.id));

  return proposal;
}

function getPendingProposal(idValue) {
  const approvals = readJson(APPROVALS, []);
  return approvals.find(p => p.id === idValue) || null;
}

function runGuardian() {
  try {
    childProcess.execSync("node scripts/site-guardian.js", {
      cwd: ROOT,
      stdio: "pipe"
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: String(err.stderr || err.message || err)
    };
  }
}

function applyPatchesIfAny(proposal) {
  if (!Array.isArray(proposal.patches) || proposal.patches.length === 0) {
    return {
      applied: false,
      message: "A proposta não possui patches automáticos. Ela foi aprovada e registrada para execução manual/assistida."
    };
  }

  const backups = [];

  try {
    for (const patch of proposal.patches) {
      const target = path.join(ROOT, patch.file);
      const backup = path.join(ROOT, "backups", "guardian", `${proposal.id}-${patch.file.replace(/[\\/]/g, "_")}.bak`);

      fs.mkdirSync(path.dirname(backup), { recursive: true });

      if (fs.existsSync(target)) {
        fs.copyFileSync(target, backup);
        backups.push({ target, backup });
      }

      if (patch.action === "write") {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, patch.content || "", "utf8");
      }
    }

    const guardian = runGuardian();

    if (!guardian.ok) {
      for (const item of backups) {
        if (fs.existsSync(item.backup)) {
          fs.copyFileSync(item.backup, item.target);
        }
      }

      return {
        applied: false,
        rollback: true,
        message: "A mudança foi bloqueada pelo Guardian. Rollback aplicado."
      };
    }

    return {
      applied: true,
      message: "Mudança aplicada e aprovada pelo Guardian."
    };
  } catch (err) {
    for (const item of backups) {
      if (fs.existsSync(item.backup)) {
        fs.copyFileSync(item.backup, item.target);
      }
    }

    return {
      applied: false,
      rollback: true,
      message: `Erro ao aplicar patches. Rollback aplicado. Detalhe: ${err.message}`
    };
  }
}

function approve(idValue, source = "manual") {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const index = approvals.findIndex(p => p.id === idValue);

  if (index === -1) throw new Error("Proposta não encontrada ou já resolvida.");

  const proposal = approvals[index];
  const applyResult = applyPatchesIfAny(proposal);

  proposal.status = applyResult.applied ? "applied" : "approved";
  proposal.approvedAt = now().toISOString();
  proposal.resolvedAt = now().toISOString();
  proposal.approvalSource = source;
  proposal.applyResult = applyResult;

  approvals.splice(index, 1);
  history.push(proposal);

  writeJson(APPROVALS, approvals);
  writeJson(HISTORY, history);

  sendTelegram(`✅ Proposta ${proposal.id} aprovada.\n\n${applyResult.message}`);

  return proposal;
}

function rejectOrReview(idValue, reason = "Rejeitada pelo dono do site.", source = "manual") {
  const approvals = readJson(APPROVALS, []);
  const history = readJson(HISTORY, []);
  const index = approvals.findIndex(p => p.id === idValue);

  if (index === -1) throw new Error("Proposta não encontrada ou já resolvida.");

  const proposal = approvals[index];
  const reviewCount = Number(proposal.reviewCount || 0);
  const maxReviewCycles = Number(proposal.maxReviewCycles || 1);

  if (proposal.urgency === "critical" || reviewCount < maxReviewCycles) {
    proposal.status = "pending";
    proposal.reviewCount = reviewCount + 1;
    proposal.lastReviewedAt = now().toISOString();
    proposal.rejectionSource = source;
    proposal.reviewReason = reason;
    proposal.expiresAt = proposal.urgency === "critical" ? null : calculateExpiration(proposal.urgency);
    proposal.whyChanged = Array.isArray(proposal.whyChanged) ? proposal.whyChanged : [];
    proposal.risks = Array.isArray(proposal.risks) ? proposal.risks : [];

    proposal.whyChanged.push("O dono rejeitou a proposta. Ela voltou para reanálise antes de ser descartada.");
    proposal.risks.push("Se a proposta continuar relevante, será reenviada para aprovação com a mesma numeração.");

    approvals[index] = proposal;
    writeJson(APPROVALS, approvals);

    sendTelegram(
      `🔁 Proposta ${proposal.id} voltou para análise com a mesma numeração.\n\nMotivo: ${reason}\n\n${formatProposal(proposal)}`,
      proposalKeyboard(proposal.id)
    );

    return {
      action: "review",
      proposal
    };
  }

  proposal.status = "rejected";
  proposal.rejectedAt = now().toISOString();
  proposal.resolvedAt = now().toISOString();
  proposal.rejectionReason = reason;
  proposal.rejectionSource = source;

  approvals.splice(index, 1);
  history.push(proposal);

  writeJson(APPROVALS, approvals);
  writeJson(HISTORY, history);

  sendTelegram(`❌ Proposta ${proposal.id} rejeitada e arquivada.\n\nMotivo: ${reason}`);

  return {
    action: "rejected",
    proposal
  };
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
      sendTelegram(`⚠️ Você ainda não viu a proposta ${proposal.id}.\n\n${formatProposal(proposal)}`, proposalKeyboard(proposal.id));
      proposal.lastReminderAt = current.toISOString();
      proposal.remindersSent = Number(proposal.remindersSent || 0) + 1;
      changed = true;
    }

    if (proposal.expiresAt && current > new Date(proposal.expiresAt)) {
      if (proposal.urgency === "low" && Number(proposal.reviewCount || 0) < 1) {
        proposal.reviewCount = Number(proposal.reviewCount || 0) + 1;
        proposal.expiresAt = calculateExpiration("low");
        proposal.whyChanged.push("A proposta passou de 2 dias sem resposta e voltou para análise automática.");
        proposal.risks.push("Se não for avaliada novamente, será reprovada automaticamente no próximo vencimento.");
        sendTelegram(`🔁 A proposta ${proposal.id} voltou para análise.\n\n${formatProposal(proposal)}`, proposalKeyboard(proposal.id));
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

if (require.main === module) {
  const action = process.argv[2];
  const value = process.argv[3];

  try {
    if (action === "tick") {
      console.log(processRemindersAndExpirations());
    } else if (action === "list") {
      console.log(JSON.stringify(readJson(APPROVALS, []), null, 2));
    } else if (action === "approve") {
      console.log(approve(value, "cli"));
    } else if (action === "reject") {
      console.log(rejectOrReview(value, process.argv.slice(4).join(" ") || undefined, "cli"));
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
  rejectOrReview,
  getPendingProposal,
  formatProposal,
  proposalKeyboard,
  sendTelegram
};
