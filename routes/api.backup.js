const { getTributosTempoReal } = require("../services/tributosService");
const express = require("express");
const router = express.Router();

const axios = require("axios");

router.get("/dolar", async (req, res) => {
  try {
    const response = await axios.get("https://economia.awesomeapi.com.br/json/last/USD-BRL");
    const d = response.data.USDBRL;

    return res.json({
      valor: Number(d.bid),
      formatado: `R$ ${Number(d.bid).toFixed(2)}`,
      variacao: Number(d.varBid),
      percentual: Number(d.pctChange)
    });
  } catch (err) {
    return res.status(500).json({ erro: true });
  }
});



router.get("/dolar", async (req, res) => {
  try {
    const response = await axios.get("https://economia.awesomeapi.com.br/json/last/USD-BRL");
    const d = response.data.USDBRL;

    res.json({
      valor: Number(d.bid),
      formatado: `R$ ${Number(d.bid).toFixed(2)}`,
      variacao: Number(d.varBid),
      percentual: Number(d.pctChange)
    });
  } catch (err) {
    res.status(500).json({ erro: true });
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
