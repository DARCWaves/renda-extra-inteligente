const { generateAutoPost } = require("./autoPostService");

const TOPICS = [
  "renda extra",
  "organização financeira",
  "investimentos para iniciantes",
  "controle de gastos",
  "reserva de emergência",
  "Selic alta",
  "inflação no bolso",
  "salário mínimo",
  "dólar alto",
  "educação financeira"
];

let isRunning = false;
let intervalRef = null;

// Escolhe um tema aleatório
function pickTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

// Gera um post com segurança (não quebra o servidor)
function safeGeneratePost() {
  try {
    const topic = pickTopic();
    const post = generateAutoPost(topic);

    console.log("🧠 Post automático criado:", post.title);
  } catch (err) {
    console.error("❌ Erro ao gerar post automático:", err.message);
  }
}

// Inicia o worker
function startContentWorker() {
  if (isRunning) {
    console.log("⚠️ Worker já está rodando, ignorando nova inicialização");
    return;
  }

  isRunning = true;

  const interval = Number(process.env.AUTO_POST_INTERVAL_MS) || 30 * 60 * 1000; // 30 min padrão

  console.log("🤖 Worker de conteúdo iniciado");
  console.log("⏱ Intervalo:", interval / 1000, "segundos");

  // 🔥 Delay inicial (ESSENCIAL para não travar o site)
  setTimeout(() => {
    console.log("🚀 Gerando primeiro post automático...");
    safeGeneratePost();
  }, 10000); // 10 segundos depois que o servidor sobe

  // 🔁 Loop contínuo
  intervalRef = setInterval(() => {
    safeGeneratePost();
  }, interval);
}

// Para o worker (caso precise no futuro)
function stopContentWorker() {
  if (!isRunning) return;

  clearInterval(intervalRef);
  isRunning = false;

  console.log("🛑 Worker de conteúdo parado");
}

module.exports = {
  startContentWorker,
  stopContentWorker
};
