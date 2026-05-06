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
      console.log(`Erro BCB: ${code} sem dados`);
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
ARRECADAÇÃO OFICIAL VIA BCB
==================================================
*/

async function fetchArrecadacao() {
  const fallbackBilhoes = 222.1;

  const codigo = Number(process.env.BCB_ARRECADACAO_CODE || 0);

  if (!codigo) {
    console.log("BCB_ARRECADACAO_CODE não configurado. Usando fallback.");
    return fallbackBilhoes;
  }

  const valor = await fetchBCB(codigo, fallbackBilhoes, 730);

  return Number.isFinite(valor) ? valor : fallbackBilhoes;
}

/*
==================================================
DADOS ECONÔMICOS (COM CACHE E FALLBACK)
==================================================
*/

let economicCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

/**
 * Retorna um objeto de dados econômicos seguro em caso de falha total.
 */
function getSafeDefaults() {
  return {
    dolar: "R$ 5,01",
    dolarOficial: "R$ 5,01",
    selic: "14,75%",
    inflacao: "0,88%",
    bolsoPopular: "2,51%",
    salarioMinimo: "R$ 1.621,00",
    arrecadacao: "R$ 222,1 bilhões",
    periodos: {
      dolar: "cotação fallback",
      dolarOficial: "cotação fallback",
      selic: "ao ano",
      inflacao: "último mês",
      bolsoPopular: "estimativa mensal",
      salarioMinimo: "valor mensal oficial",
      arrecadacao: "dado padrão"
    },
    raw: {
      dolar: 5.01,
      dolarOficial: 5.01,
      selic: 14.75,
      inflacao: 0.88,
      bolsoPopular: 2.51,
      salarioMinimo: 1621,
      arrecadacao: 222.1
    },
    stale: true
  };
}

async function getEconomicData() {
  const now = Date.now();

  // Se o cache for recente, retorna ele imediatamente
  if (economicCache && (now - lastCacheUpdate < CACHE_TTL)) {
    return economicCache;
  }

  try {
    const [selic, inflacao, dolarData, arrecadacao] = await Promise.all([
      fetchBCB(432, 14.75, 365),
      fetchBCB(433, 0.88, 365),
      fetchDolar(),
      fetchArrecadacao()
    ]);

    const salarioMinimo = 1621;
    const bolsoPopular = Number((inflacao * 2.85).toFixed(2));

    const result = {
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
        arrecadacao: process.env.BCB_ARRECADACAO_CODE
          ? "último dado oficial disponível no BCB"
          : "valor padrão até configurar código SGS"
      },

      raw: {
        dolar: dolarData.atual,
        dolarOficial: dolarData.oficial,
        selic,
        inflacao,
        bolsoPopular,
        salarioMinimo,
        arrecadacao
      },
      stale: false
    };

    economicCache = result;
    lastCacheUpdate = now;

    return result;
  } catch (err) {
    console.error("⚠️ Erro ao atualizar indicadores (usando fallback):", err.message);
    
    // Se falhar mas tivermos cache antigo, usamos o cache antigo (stale)
    if (economicCache) {
      console.log("ℹ️ Utilizando dados do cache anterior (stale)");
      return { ...economicCache, stale: true };
    }

    // Se falhar e não tivermos cache nenhum (primeiro boot), usamos defaults seguros
    console.log("ℹ️ Utilizando valores padrão (defaults)");
    return getSafeDefaults();
  }
}

module.exports = {
  getEconomicData
};
