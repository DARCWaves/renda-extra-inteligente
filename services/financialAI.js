function numberFromBR(value) {
  if (!value) return 0;

  return Number(
    String(value)
      .replace("R$", "")
      .replace("%", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  ) || 0;
}

function analyzeFinancialScenario(data) {
  const selic = numberFromBR(data.selic);
  const inflationText = String(data.inflacao || "");
  const inflation = numberFromBR(inflationText.split("/")[0]);
  const dolar = numberFromBR(data.dolar);

  const alerts = [];
  const opportunities = [];
  const summary = [];

  if (selic >= 12) {
    alerts.push("Juros altos encarecem crédito, cartão, empréstimos e financiamentos.");
    opportunities.push("Renda fixa tende a ficar mais atrativa em cenários de juros altos.");
    summary.push("A Selic está elevada, então o dinheiro caro pesa no consumo e favorece investimentos conservadores.");
  } else if (selic >= 8) {
    alerts.push("Juros ainda exigem cautela com dívidas e parcelamentos longos.");
    opportunities.push("Ainda pode haver boas oportunidades em produtos atrelados à Selic.");
    summary.push("A Selic está em nível intermediário/alto, exigindo equilíbrio entre liquidez e crescimento.");
  } else {
    alerts.push("Juros menores podem estimular consumo, mas reduzem parte da rentabilidade conservadora.");
    opportunities.push("Pode ser hora de avaliar alternativas com maior potencial, respeitando o risco.");
    summary.push("A Selic está mais controlada, o que muda a dinâmica entre crédito e investimentos.");
  }

  if (inflation >= 0.6) {
    alerts.push("Inflação mensal pressionada reduz poder de compra no curto prazo.");
    opportunities.push("Compare preços e priorize compras essenciais com planejamento.");
  }

  if (dolar >= 5) {
    alerts.push("Dólar acima de R$ 5 pode pressionar importados, combustíveis e insumos.");
    opportunities.push("Negócios digitais e produtos com baixa dependência de importação podem ganhar vantagem.");
  }

  return {
    title: "Leitura inteligente do cenário",
    verdict:
      selic >= 12
        ? "Cenário defensivo"
        : selic >= 8
          ? "Cenário de cautela estratégica"
          : "Cenário de expansão controlada",
    summary: summary.join(" "),
    alerts,
    opportunities,
    actionPlan: [
      "Evite dívidas caras antes de buscar novos investimentos.",
      "Monte ou fortaleça uma reserva de emergência.",
      "Compare renda fixa, liquidez e prazo antes de aplicar.",
      "Busque renda extra com baixo custo inicial e risco controlado."
    ]
  };
}

module.exports = { analyzeFinancialScenario };
