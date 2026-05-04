
function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// Base real aproximada (últimos dados públicos Receita)
const BASE_MENSAL = 222.1 * 1000000000; // R$ 222,1 bilhões

function getTributosTempoReal() {
  const agora = new Date();

  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).getTime();
  const agoraMs = agora.getTime();

  const progresso = (agoraMs - inicioMes) / (fimMes - inicioMes);

  const estimado = BASE_MENSAL * progresso;

  return {
    valor: estimado,
    formatado: formatBRL(estimado),
    mensalBase: BASE_MENSAL,
    fonte: "Base Receita Federal + estimativa proporcional",
    atualizadoEm: agora.toISOString()
  };
}

module.exports = { getTributosTempoReal };

