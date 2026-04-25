const axios = require("axios");

/*
==================================================
FORMATAÇÃO
==================================================
*/

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatPercent(value) {
  return Number(value).toFixed(2).replace(".", ",") + "%";
}

function formatBillions(value) {
  return "R$ " + Number(value).toFixed(1).replace(".", ",") + " bilhões";
}

/*
==================================================
DATAS PARA API BCB
==================================================
*/

function formatDateBR(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
}

function getRecentDateRange(daysBack = 60) {
  const end = new Date();
  const start = new Date();

  start.setDate(start.getDate() - daysBack);

  return {
    dataInicial: formatDateBR(start),
    dataFinal: formatDateBR(end)
  };
}

/*
==================================================
BUSCA BCB SEGURA
==================================================
*/

async function fetchBCB(code, fallback, daysBack = 90) {
  try {
    const range = getRecentDateRange(daysBack);

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados`;

    const response = await axios.get(url, {
      params: {
        formato: "json",
        dataInicial: range.dataInicial,
        dataFinal: range.dataFinal
      },
      headers: {
        Accept: "application/json",
        "User-Agent": "RendaExtraInteligente/1.0"
      },
      timeout: 8000
    });

    if (!Array.isArray(response.data) || response.data.length === 0) {
      console.log(`Erro BCB: ${code} Sem dados`);
      return fallback;
    }

    const lastItem = response.data[response.data.length - 1];
    const value = Number(String(lastItem.valor).replace(",", "."));

    if (!Number.isFinite(value)) {
      return fallback;
    }

    return value;
  } catch (err) {
    console.log(`Erro BCB: ${code} ${err.message}`);
    return fallback;
  }
}

/*
==================================================
DADOS ECONÔMICOS
==================================================
*/

async function getEconomicData() {
  const selic = await fetchBCB(432, 14.75, 365);
  const inflacao = await fetchBCB(433, 0.88, 365);
  const dolar = await fetchBCB(1, 5.01, 30);

  const salarioMinimo = 1621;
  const arrecadacao = 222.1;

  const bolsoPopular = Number((inflacao * 2.85).toFixed(2));

  return {
    dolar: formatCurrency(dolar),
    selic: formatPercent(selic),
    inflacao: formatPercent(inflacao),
    bolsoPopular: formatPercent(bolsoPopular),
    salarioMinimo: formatCurrency(salarioMinimo),
    arrecadacao: formatBillions(arrecadacao),

    periodos: {
      dolar: "cotação atual",
      selic: "ao ano",
      inflacao: "último mês",
      bolsoPopular: "estimativa mensal",
      salarioMinimo: "valor mensal oficial",
      arrecadacao: "valor mensal informado"
    },

    raw: {
      dolar,
      selic,
      inflacao,
      bolsoPopular,
      salarioMinimo,
      arrecadacao
    }
  };
}

module.exports = {
  getEconomicData
};
