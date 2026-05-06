require("dotenv").config();

const { check } = require("./site-guardian");
const { runAgent } = require("./site-agent");
const { processRemindersAndExpirations, sendTelegram } = require("./proposal-manager");
const { startGuardianTelegramBot } = require("./guardian-telegram-bot");

function minutes(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

const GUARDIAN_INTERVAL = minutes(process.env.GUARDIAN_CHECK_INTERVAL_MINUTES, 60);
const AGENT_INTERVAL = minutes(process.env.GUARDIAN_AGENT_INTERVAL_MINUTES, 180);
const REMINDER_INTERVAL = minutes(process.env.GUARDIAN_REMINDER_INTERVAL_MINUTES, 15);

function safeRun(name, fn) {
  try {
    console.log(`\n[${new Date().toISOString()}] Rodando: ${name}`);
    const result = fn();
    console.log(`[${new Date().toISOString()}] Finalizado: ${name}`);
    return result;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erro em ${name}:`, err.message);
    sendTelegram(`❌ Erro no Guardian Worker em ${name}: ${err.message}`);
    return null;
  }
}

function boot() {
  console.log("=======================================");
  console.log("Guardian Worker iniciado");
  console.log(`Guardian check: ${GUARDIAN_INTERVAL} min`);
  console.log(`Agent: ${AGENT_INTERVAL} min`);
  console.log(`Reminders: ${REMINDER_INTERVAL} min`);
  console.log("=======================================");

  if (process.env.ENABLE_GUARDIAN_TELEGRAM !== "false") {
    startGuardianTelegramBot();
  }

  safeRun("guardian", check);
  safeRun("agent", runAgent);
  safeRun("reminders", processRemindersAndExpirations);

  setInterval(() => safeRun("guardian", check), GUARDIAN_INTERVAL * 60 * 1000);
  setInterval(() => safeRun("agent", runAgent), AGENT_INTERVAL * 60 * 1000);
  setInterval(() => safeRun("reminders", processRemindersAndExpirations), REMINDER_INTERVAL * 60 * 1000);
}

boot();
