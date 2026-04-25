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
DATAS
==================================================
*/

function formatDateBR(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y}`;
}

function getRecentDateRange(daysBack = 90) {
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
BANCO CENTRAL
==================================================
*/

async function fetchBCB(code, fallback, daysBack = 90) {
  try {
    const range = getRecentDateRange(daysBack);

    const response = await axios.get(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados`,
      {
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
      }
    );

    if (!Array.isArray(response.data) || response.data.length === 0) {
      console.log(`Erro BCB: ${code} Sem dados`);
      return fallback;
    }

    const lastItem = response.data[response.data.length - 1];
    const value = Number(String(lastItem.valor).replace(",", "."));

    return Number.isFinite(value) ? value : fallback;
  } catch (err) {
    console.log(`Erro BCB: ${code} ${err.message}`);
    return fallback;
  }
}

/*
==================================================
DÓLAR EM TEMPO REAL + OFICIAL
==================================================
*/

async function fetchDolar() {
  let dolarAtual = 5.01;
  let dolarOficial = 5.01;

  try {
    const realtime = await axios.get(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL",
      { timeout: 8000 }
    );

    const value = Number(realtime.data?.USDBRL?.bid);

    if (Number.isFinite(value)) {
      dolarAtual = value;
    }
  } catch (err) {
    console.log("Erro dólar tempo real:", err.message);
  }

  try {
    dolarOficial = await fetchBCB(1, dolarAtual, 30);
  } catch (err) {
    dolarOficial = dolarAtual;
  }

  return {
    atual: dolarAtual,
    oficial: dolarOficial
  };
}

/*
==================================================
DADOS ECONÔMICOS
==================================================
*/

async function getEconomicData() {
  const [selic, inflacao, dolarData] = await Promise.all([
    fetchBCB(432, 14.75, 365),
    fetchBCB(433, 0.88, 365),
    fetchDolar()
  ]);

  const salarioMinimo = 1621;
  const arrecadacao = 222.1;
  const bolsoPopular = Number((inflacao * 2.85).toFixed(2));

  return {
    dolar: formatCurrency(dolarData.atual),
    dolarOficial: formatCurrency(dolarData.oficial),
    selic: formatPercent(selic),
    inflacao: formatPercent(inflacao),
    bolsoPopular: formatPercent(bolsoPopular),
    salarioMinimo: formatCurrency(salarioMinimo),
    arrecadacao: formatBillions(arrecadacao),

    periodos: {
      dolar: "cotação em tempo real",
      dolarOficial: "cotação oficial BCB",
      selic: "ao ano",
      inflacao: "último mês",
      bolsoPopular: "estimativa mensal",
      salarioMinimo: "valor mensal oficial",
      arrecadacao: "valor mensal informado"
    },

    raw: {
      dolar: dolarData.atual,
      dolarOficial: dolarData.oficial,
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
