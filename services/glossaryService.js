const GLOSSARY = {
  selic: {
    term: "Selic",
    meaning:
      "É a taxa básica de juros do Brasil. Ela influencia empréstimos, financiamentos, cartão, investimentos e o custo do dinheiro na economia."
  },
  ipca: {
    term: "IPCA",
    meaning:
      "É o índice oficial de inflação do Brasil, medido pelo IBGE. Ele mostra quanto os preços subiram para uma cesta ampla de produtos e serviços."
  },
  pis: {
    term: "PIS",
    meaning:
      "É uma contribuição paga por empresas para financiar benefícios sociais, como abono salarial e seguro-desemprego. Na prática, pode aparecer embutido no custo dos produtos e serviços."
  },
  cofins: {
    term: "Cofins",
    meaning:
      "É uma contribuição cobrada sobre o faturamento das empresas. Mesmo sendo paga pela empresa, parte desse custo pode chegar ao preço final para o consumidor."
  },
  inss: {
    term: "INSS",
    meaning:
      "É a contribuição para a Previdência Social. Ela ajuda a financiar aposentadorias, auxílios e benefícios previdenciários."
  },
  icms: {
    term: "ICMS",
    meaning:
      "É um imposto estadual cobrado sobre circulação de mercadorias e alguns serviços. Ele costuma estar embutido no preço de alimentos, energia, combustíveis e produtos em geral."
  },
  cdi: {
    term: "CDI",
    meaning:
      "É uma taxa usada como referência em muitos investimentos de renda fixa. Quando um CDB rende 100% do CDI, ele acompanha essa referência."
  },
  imposto_embutido: {
    term: "Imposto embutido",
    meaning:
      "É o imposto que você paga sem ver separado na nota de forma clara. Ele já vem dentro do preço final de produtos e serviços."
  },
  poder_de_compra: {
    term: "Poder de compra",
    meaning:
      "É o quanto seu dinheiro consegue comprar. Se os preços sobem mais rápido que sua renda, seu poder de compra cai."
  },
  renda_fixa: {
    term: "Renda fixa",
    meaning:
      "São investimentos com regras de rendimento mais previsíveis, como Tesouro Selic, CDB, LCI e LCA."
  }
};

function getGlossaryTerms(keys = []) {
  return keys
    .map((key) => GLOSSARY[key])
    .filter(Boolean);
}

module.exports = {
  GLOSSARY,
  getGlossaryTerms
};
