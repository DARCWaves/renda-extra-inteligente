const express = require("express");
const axios = require("axios");
const { getTributosTempoReal } = require("../services/tributosService");

const router = express.Router();

router.get("/dolar", async (req, res) => {
  try {
    const response = await axios.get("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      timeout: 8000
    });

    const d = response.data.USDBRL;

    return res.json({
      ok: true,
      valor: Number(d.bid),
      formatado: `R$ ${Number(d.bid).toFixed(2)}`,
      variacao: Number(d.varBid),
      percentual: Number(d.pctChange),
      atualizadoEm: d.create_date
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

router.get("/tributos", (req, res) => {
  try {
    return res.json({
      ok: true,
      data: getTributosTempoReal()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

module.exports = router;
