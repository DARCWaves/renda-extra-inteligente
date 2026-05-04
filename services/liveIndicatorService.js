const axios = require("axios");

function formatBRL(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Carregando...";

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Carregando...";

  return `${number.toFixed(2).replace(".", ",")}%`;
}

async function fetchDollarBRL() {
  try {
    const response = await axios.get("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      timeout: 8000
    });

    const bid = response?.data?.USDBRL?.bid;

    if (!bid) return null;

    return {
      nome: "Dólar",
      slug: "dolar",
      valor: formatBRL(bid),
      periodo: "Cotação comercial atualizada automaticamente",
      raw: Number(bid)
    };
  } catch {
    return null;
  }
}

function calculateTributos2026() {
  const start = new Date("2026-01-01T00:00:00-03:00").getTime();
  const now = Date.now();

  const yearlyProjection = 3900000000000;
  const yearMs = new Date("2027-01-01T00:00:00-03:00").getTime() - start;
  const elapsed = Math.max(0, now - start);

  const estimated = yearlyProjection * (elapsed / yearMs);

  return {
    nome: "Arrecadação de tributos",
    slug: "tributos",
    valor: formatCompactBRL(estimated),
    periodo: "Estimativa anual de 2026 atualizada automaticamente",
    raw: estimated
  };
}

function formatCompactBRL(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "Carregando...";

  if (number >= 1000000000000) {
    return `R$ ${(number / 1000000000000).toFixed(2).replace(".", ",")} trilhões`;
  }

  if (number >= 1000000000) {
    return `R$ ${(number / 1000000000).toFixed(1).replace(".", ",")} bilhões`;
  }

  if (number >= 1000000) {
    return `R$ ${(number / 1000000).toFixed(1).replace(".", ",")} milhões`;
  }

  return formatBRL(number);
}

function calculateBolsoPopular2026(baseInflation) {
  const official = Number(baseInflation || 0.88);
  const bolsoPopular = Math.max(official * 2.85, official + 1.35);

  return {
    nome: "Índice do Bolso Popular",
    slug: "bolso-popular",
    valor: formatPercent(bolsoPopular),
    periodo: "Estimativa de inflação real popular em 2026",
    raw: bolsoPopular
  };
}

async function buildLiveIndicators(existingIndicators) {
  const resumo = Array.isArray(existingIndicators?.resumo)
    ? existingIndicators.resumo.slice()
    : [];

  const dollar = await fetchDollarBRL();
  const tributos = calculateTributos2026();

  const officialInflationItem = resumo.find(item => item.slug === "inflacao");
  const officialInflationRaw = String(officialInflationItem?.valor || "")
    .replace("%", "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const bolsoPopular = calculateBolsoPopular2026(Number(officialInflationRaw || 0.88));

  function upsert(item) {
    const index = resumo.findIndex(current => current.slug === item.slug);

    if (index >= 0) {
      resumo[index] = {
        ...resumo[index],
        ...item
      };
    } else {
      resumo.push(item);
    }
  }

  if (dollar) upsert(dollar);
  upsert(tributos);
  upsert(bolsoPopular);

  return {
    ...existingIndicators,
    resumo,
    updatedAt: new Date().toISOString(),
    updatedAtLabel: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

module.exports = {
  buildLiveIndicators
};
