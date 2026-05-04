function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getTributosTempoReal() {
  const agora = new Date();

  const baseMensal = Number(process.env.TRIBUTOS_BASE_MENSAL || 222100000000);

  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1).getTime();
  const agoraMs = agora.getTime();

  const progresso = Math.min(Math.max((agoraMs - inicioMes) / (fimMes - inicioMes), 0), 1);
  const valor = baseMensal * progresso;

  return {
    valor,
    formatado: formatBRL(valor),
    baseMensal,
    mes: agora.getMonth() + 1,
    ano: agora.getFullYear(),
    fonte: "Estimativa com base mensal da Receita Federal",
    atualizadoEm: agora.toISOString()
  };
}

module.exports = { getTributosTempoReal };
