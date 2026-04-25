require("dotenv").config();

const app = require("./app");
const { startContentWorker } = require("./services/contentWorker");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);

  if (process.env.AUTO_POSTS !== "false") {
    startContentWorker();
  }
});
