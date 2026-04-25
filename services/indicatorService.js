const { getEconomicData } = require("./economicService");
const { analyzeFinancialScenario } = require("./financialAI");
const { getGlossaryTerms } = require("./glossaryService");

function getRaw(data, key, fallback) {
  return data && data.raw && typeof data.raw[key] === "number"
    ? data.raw[key]
    : fallback;
}

async function getIndicators() {
  const economicData = await getEconomicData();
  const iaFinanceira = analyzeFinancialScenario(economicData);

  const rawDolar = getRaw(economicData, "dolar", 5.01);
  const rawSelic = getRaw(economicData, "selic", 14.75);
  const rawInflacao = getRaw(economicData, "inflacao", 0.88);
  const rawBolsoPopular = getRaw(economicData, "bolsoPopular", 2.51);
  const rawSalarioMinimo = getRaw(economicData, "salarioMinimo", 1621);
  const rawArrecadacao = getRaw(economicData, "arrecadacao", 222.1);

  return {
    resumo: [
      {
        nome: "Dólar",
        valor: economicData.dolar,
        periodo: "cotação atual",
        slug: "dolar"
      },
      {
        nome: "Taxa Selic",
        valor: economicData.selic,
        periodo: "ao ano",
        slug: "selic"
      },
      {
        nome: "Inflação oficial",
        valor: economicData.inflacao,
        periodo: "último mês",
        slug: "inflacao"
      },
      {
        nome: "Índice do Bolso Popular",
        valor: economicData.bolsoPopular,
        periodo: "estimativa mensal",
        slug: "bolso-popular"
      },
      {
        nome: "Salário mínimo",
        valor: economicData.salarioMinimo,
        periodo: "valor mensal oficial",
        slug: "salario-minimo"
      },
      {
        nome: "Arrecadação de tributos",
        valor: economicData.arrecadacao,
        periodo: "valor mensal informado",
        slug: "tributos"
      }
    ],

    iaFinanceira,

    detalhes: {
      dolar: {
        slug: "dolar",
        titulo: "Cotação do Dólar",
        valor: economicData.dolar,
        periodo: "cotação atual",
        seoTitle: "Dólar hoje: cotação, inflação e impacto no bolso",
        seoDescription:
          "Entenda como o dólar afeta combustíveis, alimentos, eletrônicos, importações e o custo de vida no Brasil.",

        resumoCurto:
          "O dólar influencia muito mais do que viagem internacional. Ele mexe com combustível, comida, produtos importados e até com o preço de itens básicos.",

        explicacao:
          "O dólar é a moeda mais usada no comércio internacional. Quando o real perde força contra o dólar, importar fica mais caro. Isso afeta empresas, indústrias, produtores e consumidores. Mesmo quem nunca comprou dólar sente o impacto, porque muitos produtos vendidos no Brasil dependem de insumos, máquinas, combustíveis ou matérias-primas com preço ligado ao mercado internacional.",

        comoCalcula:
          "A cotação do dólar muda conforme oferta e demanda. Quando muita gente quer comprar dólar, ele tende a subir. Quando entra mais dólar no país, ele pode cair. Juros, risco político, comércio exterior, inflação, decisões do Banco Central e cenário internacional também influenciam esse preço.",

        impactoBolso:
          "Quando o dólar sobe, o custo de vida pode aumentar. Combustíveis, eletrônicos, trigo, fertilizantes, remédios e produtos importados podem ficar mais caros. No fim, o consumidor paga a conta no mercado, no transporte e em compras do dia a dia.",

        impactoPais:
          "Para o país, dólar alto pode ajudar exportadores, mas também pressiona a inflação. Empresas que dependem de importação sofrem mais, e isso pode reduzir margem, aumentar preços e frear investimentos.",

        tabela: [
          ["Área afetada", "Impacto", "Explicação simples"],
          ["Combustíveis", "Alto", "Petróleo e derivados têm ligação com preços internacionais."],
          ["Alimentos", "Médio/Alto", "Trigo, fertilizantes e insumos podem encarecer."],
          ["Eletrônicos", "Alto", "Muitos aparelhos ou peças são importados."],
          ["Viagens", "Alto", "Passagens, hospedagem e compras fora ficam mais caras."]
        ],

        chart: {
          type: "bar",
          labels: ["Cotação atual", "Referência baixa", "Referência alta"],
          values: [rawDolar, 4.5, 5.5],
          suffix: "R$"
        },

        glossario: getGlossaryTerms([
          "poder_de_compra",
          "imposto_embutido",
          "icms"
        ]),

        relacionados: [
          { titulo: "Inflação oficial", url: "/indicador/inflacao" },
          { titulo: "Índice do Bolso Popular", url: "/indicador/bolso-popular" },
          { titulo: "Investimentos", url: "/categoria/investimentos" }
        ]
      },

      selic: {
        slug: "selic",
        titulo: "Taxa Selic",
        valor: economicData.selic,
        periodo: "ao ano",
        seoTitle: "Taxa Selic hoje: juros, crédito, dívidas e investimentos",
        seoDescription:
          "Entenda o que é a Selic, como ela é definida e como afeta cartão, empréstimos, financiamentos, renda fixa e consumo.",

        resumoCurto:
          "A Selic é o preço do dinheiro no Brasil. Quando ela sobe, pegar dinheiro emprestado fica mais caro. Quando ela cai, o crédito tende a ficar mais barato.",

        explicacao:
          "A Selic é a taxa básica de juros da economia brasileira. Ela serve como referência para bancos, empréstimos, financiamentos, cartão de crédito e investimentos de renda fixa. Em termos simples: ela ajuda a definir se o dinheiro está caro ou barato no país.",

        comoCalcula:
          "A Selic é definida pelo Copom, o Comitê de Política Monetária do Banco Central. O Copom analisa inflação, atividade econômica, expectativas do mercado, câmbio e risco fiscal para decidir se aumenta, reduz ou mantém a taxa.",

        impactoBolso:
          "Selic alta encarece crédito, financiamento, empréstimo, cartão e parcelamentos. Para quem deve, dói. Para quem tem reserva e investe com segurança, pode aumentar o rendimento de produtos como Tesouro Selic, CDBs e fundos de renda fixa.",

        impactoPais:
          "No país, Selic alta reduz consumo e freia a economia. Empresas investem menos, famílias compram menos e o crédito fica travado. Por outro lado, pode ajudar a controlar a inflação.",

        tabela: [
          ["Área afetada", "Impacto", "Explicação simples"],
          ["Empréstimos", "Ficam mais caros", "O banco cobra mais para emprestar dinheiro."],
          ["Financiamentos", "Parcelas maiores", "Casa, carro e crédito longo ficam mais pesados."],
          ["Investimentos", "Renda fixa melhora", "Produtos ligados à Selic/CDI podem render mais."],
          ["Consumo", "Tende a cair", "Famílias evitam compras parceladas."]
        ],

        chart: {
          type: "bar",
          labels: ["Selic atual", "Juro moderado", "Juro alto"],
          values: [rawSelic, 8, 13],
          suffix: "%"
        },

        glossario: getGlossaryTerms([
          "selic",
          "cdi",
          "renda_fixa",
          "poder_de_compra"
        ]),

        relacionados: [
          { titulo: "Investimentos", url: "/categoria/investimentos" },
          { titulo: "Inflação oficial", url: "/indicador/inflacao" },
          { titulo: "Dólar", url: "/indicador/dolar" }
        ]
      },

      inflacao: {
        slug: "inflacao",
        titulo: "Inflação oficial (IPCA)",
        valor: economicData.inflacao,
        periodo: "último mês",
        seoTitle: "Inflação hoje: IPCA, custo de vida e poder de compra",
        seoDescription:
          "Entenda o que é IPCA, como a inflação é calculada e por que ela reduz o poder de compra das famílias.",

        resumoCurto:
          "Inflação é quando os preços sobem e o dinheiro compra menos. O problema é que a inflação oficial nem sempre mostra a dor real de quem ganha pouco.",

        explicacao:
          "A inflação mede o aumento dos preços ao longo do tempo. No Brasil, o IPCA é o principal índice oficial. Ele acompanha uma cesta ampla de produtos e serviços, como alimentação, transporte, habitação, saúde, educação e despesas pessoais.",

        comoCalcula:
          "O IPCA é calculado pelo IBGE a partir da variação de preços de produtos e serviços consumidos pelas famílias. Cada grupo tem um peso. Alimentação, transporte e habitação costumam pesar bastante no orçamento. A média final mostra quanto os preços subiram no período.",

        impactoBolso:
          "Quando a inflação sobe, seu salário perde força. Você pode receber o mesmo valor, mas comprar menos comida, pagar mais caro no transporte, gastar mais com energia e sentir que o dinheiro acaba antes do mês terminar.",

        impactoPais:
          "No país, inflação alta reduz consumo, aumenta insegurança, pressiona juros e dificulta o planejamento de empresas e famílias. Ela funciona como um imposto invisível, principalmente para quem ganha menos.",

        tabela: [
          ["Grupo", "Peso para baixa renda", "Explicação simples"],
          ["Alimentação", "Muito alto", "Mercado pesa todos os meses."],
          ["Transporte", "Alto", "Afeta trabalho e rotina."],
          ["Habitação", "Alto", "Aluguel, luz, gás e água apertam o orçamento."],
          ["Lazer", "Baixo/Médio", "Normalmente é o primeiro corte quando falta dinheiro."]
        ],

        chart: {
          type: "doughnut",
          labels: ["Alimentação", "Transporte", "Habitação", "Outros"],
          values: [35, 25, 25, 15],
          suffix: "%"
        },

        glossario: getGlossaryTerms([
          "ipca",
          "poder_de_compra",
          "imposto_embutido"
        ]),

        relacionados: [
          { titulo: "Índice do Bolso Popular", url: "/indicador/bolso-popular" },
          { titulo: "Salário mínimo", url: "/indicador/salario-minimo" },
          { titulo: "Renda extra", url: "/categoria/renda-extra" }
        ]
      },

      "bolso-popular": {
        slug: "bolso-popular",
        titulo: "Índice do Bolso Popular",
        valor: economicData.bolsoPopular,
        periodo: "estimativa mensal",
        seoTitle:
          "Índice do Bolso Popular: inflação real para quem ganha de 1 a 5 salários mínimos",
        seoDescription:
          "Entenda por que quem ganha de 1 a 5 salários mínimos pode sentir uma inflação maior que a inflação oficial.",

        resumoCurto:
          "Esse índice mostra a inflação sentida por quem vive do básico: comida, aluguel, transporte, luz, gás e mercado.",

        explicacao:
          "O Índice do Bolso Popular é uma leitura prática do custo de vida para pessoas que ganham entre 1 e 5 salários mínimos. Ele existe porque a inflação oficial é uma média ampla, mas quem ganha menos gasta proporcionalmente mais com itens essenciais.",

        comoCalcula:
          "Ele usa a inflação oficial como base e aplica uma pressão maior para itens essenciais, como comida, transporte, aluguel, energia e gás. Não é um índice oficial do governo; é uma estimativa educativa para mostrar a diferença entre a inflação média e a inflação sentida por famílias de menor renda.",

        impactoBolso:
          "Se o Bolso Popular fica acima do IPCA, isso indica que a vida real está mais cara para quem depende do salário para pagar o básico. É por isso que muita gente vê a inflação oficial e pensa: 'não é isso que eu sinto no mercado'.",

        impactoPais:
          "Quando a inflação pesa mais para a base da população, o consumo cai, o endividamento aumenta e a desigualdade financeira fica mais forte.",

        tabela: [
          ["Item essencial", "Peso no bolso", "Explicação simples"],
          ["Comida", "Muito alto", "É gasto obrigatório e recorrente."],
          ["Aluguel", "Muito alto", "Compromete grande parte da renda."],
          ["Transporte", "Alto", "Afeta trabalho e deslocamento."],
          ["Energia e gás", "Alto", "Não dá para simplesmente cortar."],
          ["Lazer", "Baixo", "Costuma ser sacrificado primeiro."]
        ],

        chart: {
          type: "bar",
          labels: ["IPCA oficial", "Bolso popular", "Diferença sentida"],
          values: [
            rawInflacao,
            rawBolsoPopular,
            Math.max(rawBolsoPopular - rawInflacao, 0)
          ],
          suffix: "%"
        },

        glossario: getGlossaryTerms([
          "ipca",
          "poder_de_compra",
          "imposto_embutido",
          "icms"
        ]),

        relacionados: [
          { titulo: "Inflação oficial", url: "/indicador/inflacao" },
          { titulo: "Salário mínimo", url: "/indicador/salario-minimo" },
          { titulo: "Organização financeira", url: "/posts" }
        ]
      },

      "salario-minimo": {
        slug: "salario-minimo",
        titulo: "Salário mínimo",
        valor: economicData.salarioMinimo,
        periodo: "valor mensal oficial",
        seoTitle:
          "Salário mínimo hoje: valor oficial, poder de compra e custo de vida",
        seoDescription:
          "Veja o valor do salário mínimo, entenda seu impacto no bolso e por que ele pode comprar menos com o tempo.",

        resumoCurto:
          "O salário mínimo é o piso oficial, mas o que importa de verdade é quanto ele compra no mercado, no aluguel, na luz e no transporte.",

        explicacao:
          "O salário mínimo é o valor oficial definido como base mínima de remuneração. Ele serve como referência para trabalhadores, benefícios, aposentadorias e políticas públicas. Mas olhar só o valor nominal é perigoso: o que importa é o poder de compra.",

        comoCalcula:
          "O reajuste do salário mínimo considera regras definidas pelo governo, normalmente envolvendo inflação e crescimento econômico. Na prática, mesmo com reajuste, o trabalhador pode perder poder de compra se alimentos, aluguel, energia e transporte subirem mais rápido.",

        impactoBolso:
          "O impacto é direto: se o salário sobe menos que o custo de vida, a pessoa trabalha o mesmo tanto e compra menos. Essa é a dor central de milhões de brasileiros.",

        impactoPais:
          "No país, o salário mínimo influencia consumo, previdência, benefícios sociais e custo das empresas. Quando sobe, pode aliviar famílias, mas também gera impacto fiscal e trabalhista.",

        tabela: [
          ["Item", "Valor/Peso", "Explicação simples"],
          ["Valor oficial", economicData.salarioMinimo, "Referência mensal definida oficialmente."],
          ["Gastos essenciais", "Alto", "Comida, aluguel, energia e transporte pesam muito."],
          ["Impostos embutidos", "Relevante", "Parte do consumo tem tributos no preço final."],
          ["Poder de compra", "Variável", "Depende dos preços e do custo de vida."]
        ],

        chart: {
          type: "bar",
          labels: ["Valor oficial", "Gastos essenciais", "Margem livre estimada"],
          values: [
            rawSalarioMinimo,
            rawSalarioMinimo * 0.75,
            rawSalarioMinimo * 0.25
          ],
          suffix: "R$"
        },

        glossario: getGlossaryTerms([
          "inss",
          "imposto_embutido",
          "poder_de_compra",
          "pis",
          "cofins",
          "icms"
        ]),

        relacionados: [
          { titulo: "Índice do Bolso Popular", url: "/indicador/bolso-popular" },
          { titulo: "Inflação oficial", url: "/indicador/inflacao" },
          { titulo: "Renda extra", url: "/categoria/renda-extra" }
        ]
      },

      tributos: {
        slug: "tributos",
        titulo: "Arrecadação de tributos",
        valor: economicData.arrecadacao,
        periodo: "valor mensal informado",
        seoTitle:
          "Arrecadação de tributos no Brasil: impostos, consumo e impacto no bolso",
        seoDescription:
          "Entenda o que são tributos, como impostos aparecem no preço dos produtos e como afetam seu dinheiro.",

        resumoCurto:
          "Tributos são impostos, taxas e contribuições pagos por pessoas e empresas. Muitas vezes você paga sem perceber, porque eles já estão embutidos no preço.",

        explicacao:
          "A arrecadação de tributos representa o dinheiro que o governo coleta por meio de impostos, taxas e contribuições. Esse dinheiro vem de consumo, renda, folha de pagamento, empresas, importações e diversos serviços.",

        comoCalcula:
          "A arrecadação soma diferentes tributos, como ICMS, Imposto de Renda, PIS, Cofins, IPI e contribuições previdenciárias. Alguns são pagos diretamente; outros aparecem embutidos no preço final dos produtos e serviços.",

        impactoBolso:
          "Quando muitos tributos estão embutidos no consumo, produtos e serviços ficam mais caros. A pessoa paga imposto até quando compra comida, combustível, energia ou itens básicos.",

        impactoPais:
          "Para o país, arrecadação financia serviços públicos, benefícios e estrutura do Estado. Mas carga tributária alta e mal distribuída pode reduzir consumo, pesar nas empresas e apertar o bolso da população.",

        tabela: [
          ["Tipo", "Onde aparece", "Explicação simples"],
          ["ICMS", "Produtos e serviços", "Imposto estadual embutido em muitos preços."],
          ["PIS", "Empresas", "Contribuição que pode entrar no custo final."],
          ["Cofins", "Faturamento", "Contribuição que também pode pesar no preço."],
          ["Imposto de Renda", "Renda", "Pago sobre salários, lucros ou ganhos."],
          ["IPI", "Indústria", "Afeta produtos industrializados."]
        ],

        chart: {
          type: "doughnut",
          labels: ["Consumo", "Renda", "Empresas", "Importação"],
          values: [40, 25, 25, 10],
          suffix: "%"
        },

        glossario: getGlossaryTerms([
          "pis",
          "cofins",
          "icms",
          "imposto_embutido"
        ]),

        relacionados: [
          { titulo: "Salário mínimo", url: "/indicador/salario-minimo" },
          { titulo: "Inflação oficial", url: "/indicador/inflacao" },
          { titulo: "Organização financeira", url: "/posts" }
        ]
      }
    }
  };
}

module.exports = {
  getIndicators
};
