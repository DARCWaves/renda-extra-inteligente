const crypto = require("crypto");
const { OFFICIAL_CATEGORIES: CATEGORY_ORDER } = require("../config/constants");

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function slugify(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

function normalizeCategory(category, title = "", content = "") {
  const raw = normalizeText(category);

  // PRIORIDADE 1: Se a categoria já for uma das oficiais, mantém
  if (CATEGORY_ORDER.includes(raw)) return raw;

  // PRIORIDADE 2: Mapeamento de aliases diretos da categoria original
  const directMap = {
    "finanças": "financas",
    "programação": "programacao",
    "investimento": "investimentos",
    "renda": "renda-extra",
    "rendaextra": "renda-extra",
    "noticias": "economia",
    "noticia": "economia",
    "mercado": "economia",
    "emprego": "trabalho",
    "dinheiro": "financas"
  };

  if (directMap[raw]) return directMap[raw];

  // PRIORIDADE 3: Busca por palavras-chave se a categoria original for genérica ou inválida
  const text = `${raw} ${normalizeText(title)} ${normalizeText(content)}`;

  if (
    text.includes("programacao") ||
    text.includes("programar") ||
    text.includes("codigo") ||
    text.includes("javascript") ||
    text.includes("html") ||
    text.includes("css") ||
    text.includes("site") ||
    text.includes("app") ||
    text.includes("logica")
  ) return "programacao";

  if (
    text.includes("renda extra") ||
    text.includes("ganhar dinheiro") ||
    text.includes("vender") ||
    text.includes("revenda") ||
    text.includes("celular") ||
    text.includes("primeira venda")
  ) return "renda-extra";

  if (
    text.includes("investimento") ||
    text.includes("investir") ||
    text.includes("fii") ||
    text.includes("tesouro") ||
    text.includes("acoes") ||
    text.includes("renda fixa")
  ) return "investimentos";

  if (
    text.includes("trabalho") ||
    text.includes("emprego") ||
    text.includes("profissao") ||
    text.includes("carreira") ||
    text.includes("habilidade")
  ) return "trabalho";

  if (
    text.includes("dolar") ||
    text.includes("selic") ||
    text.includes("inflacao") ||
    text.includes("economia") ||
    text.includes("juros") ||
    text.includes("poder de compra")
  ) return "economia";

  if (
    text.includes("financa") ||
    text.includes("dinheiro") ||
    text.includes("salario") ||
    text.includes("gasto") ||
    text.includes("divida") ||
    text.includes("orcamento") ||
    text.includes("organizar")
  ) return "financas";

  if (raw === "finanças") return "financas";
  if (raw === "programação") return "programacao";
  if (raw === "renda") return "renda-extra";

  return CATEGORY_ORDER.includes(raw) ? raw : "financas";
}

const TITLE_BANK = {
  financas: [
    "Como organizar seu dinheiro mesmo ganhando pouco e parar de viver no aperto",
    "O erro silencioso que faz seu salário sumir antes do fim do mês",
    "Como controlar gastos sem planilha complicada e recuperar clareza financeira",
    "Como separar desejo de necessidade antes de gastar dinheiro",
    "Como montar uma reserva mesmo quando parece impossível sobrar dinheiro"
  ],
  "renda-extra": [
    "5 formas de fazer renda extra pelo celular sem cair em promessa falsa",
    "Como começar a vender algo simples e fazer sua primeira renda extra",
    "Renda extra para iniciantes: o caminho mais simples para começar hoje",
    "Como transformar uma habilidade simples em uma fonte de renda extra",
    "O que vender para fazer renda extra mesmo tendo pouco dinheiro para começar"
  ],
  programacao: [
    "Como aprender programação do zero sem travar na lógica",
    "Lógica de programação explicada como uma receita simples para iniciantes",
    "Como criar seu primeiro site mesmo sem entender tudo de programação",
    "Programação para iniciantes: o jeito certo de entender código sem decorar",
    "Como aprender JavaScript usando exemplos simples do dia a dia"
  ],
  investimentos: [
    "Como começar a investir com pouco dinheiro sem fazer besteira",
    "O que entender antes de investir pela primeira vez e evitar decisões ruins",
    "Investimentos para iniciantes: como começar pequeno e criar constância",
    "Como perder o medo de investir entendendo risco antes de rendimento"
  ],
  trabalho: [
    "Como aumentar sua renda usando melhor o trabalho que você já faz",
    "O que fazer quando você trabalha muito e mesmo assim o dinheiro não rende",
    "Como transformar experiência prática em uma oportunidade de renda",
    "Como ser mais valorizado no trabalho sem depender apenas de sorte"
  ],
  economia: [
    "Como a inflação tira dinheiro do seu bolso sem você perceber",
    "Por que o dólar alto deixa sua vida mais cara mesmo sem você viajar",
    "Como a Selic afeta dívidas, compras e investimentos na prática",
    "Economia para iniciantes: entenda juros, inflação e salário sem complicação"
  ]
};

function pickTitle(category, usedTitles = new Set()) {
  const normalized = normalizeCategory(category);
  const list = TITLE_BANK[normalized] || TITLE_BANK.financas;

  for (const title of list) {
    if (!usedTitles.has(normalizeText(title))) return title;
  }

  return `${list[Math.floor(Math.random() * list.length)]} - guia prático ${Date.now()}`;
}

function buildDescription(category, title) {
  const cat = normalizeCategory(category, title);

  const descriptions = {
    financas: "Aprenda a organizar dinheiro, cortar desperdícios e tomar decisões melhores sem complicar sua rotina.",
    "renda-extra": "Veja caminhos práticos para criar renda extra começando pequeno, com baixo risco e sem promessa milagrosa.",
    programacao: "Aprenda programação com lógica simples, exemplos reais e passos claros para começar sem travar.",
    investimentos: "Entenda como começar a investir com pouco dinheiro, mais consciência e menos ansiedade.",
    trabalho: "Aprenda a transformar esforço, habilidade e experiência em mais valor e oportunidade.",
    economia: "Entenda como inflação, dólar, Selic e juros afetam diretamente seu bolso."
  };

  return descriptions[cat] || descriptions.financas;
}

function buildContent(category, title) {
  const cat = normalizeCategory(category, title);
  const description = buildDescription(cat, title);

  const steps = {
    financas: [
      "Anote tudo que entra e tudo que sai.",
      "Separe gasto essencial, gasto importante e gasto impulsivo.",
      "Corte primeiro o vazamento pequeno que se repete todo dia.",
      "Defina uma meta semanal simples.",
      "Revise seu dinheiro sempre no mesmo dia da semana."
    ],
    "renda-extra": [
      "Escolha uma ideia simples e barata de testar.",
      "Descubra quem realmente teria interesse nisso.",
      "Crie uma oferta curta e fácil de entender.",
      "Divulgue para poucas pessoas primeiro.",
      "Melhore com base nas respostas reais."
    ],
    programacao: [
      "Explique o problema em português antes de escrever código.",
      "Divida o problema em passos pequenos.",
      "Transforme cada passo em uma instrução.",
      "Teste uma parte por vez.",
      "Corrija o erro entendendo a causa, não apenas copiando solução."
    ],
    investimentos: [
      "Organize o orçamento antes de investir.",
      "Monte uma reserva mínima.",
      "Entenda risco antes de olhar rendimento.",
      "Comece com pouco para ganhar experiência.",
      "Repita o hábito antes de buscar ganho alto."
    ],
    trabalho: [
      "Identifique uma habilidade que você já usa.",
      "Observe quais problemas você resolve.",
      "Registre resultados entregues.",
      "Aprenda uma habilidade complementar.",
      "Mostre valor com clareza."
    ],
    economia: [
      "Observe os preços do seu dia a dia.",
      "Compare com inflação, juros e dólar.",
      "Evite dívida cara quando os juros estão altos.",
      "Planeje compras maiores com antecedência.",
      "Use indicadores como alerta para decidir melhor."
    ]
  };

  const intro = {
    financas: "Dinheiro desorganizado não desaparece de uma vez. Ele escapa em decisões pequenas, gastos invisíveis e falta de clareza.",
    "renda-extra": "Renda extra não começa com fórmula mágica. Começa quando você encontra uma dor real e testa uma solução simples.",
    programacao: "Programação parece difícil quando você tenta decorar comandos. Ela fica simples quando você entende a lógica por trás do código.",
    investimentos: "Investir sem entender o básico é como entrar em estrada sem mapa. O primeiro ganho é clareza, não rendimento.",
    trabalho: "Trabalhar muito não basta. O ponto é transformar esforço em resultado visível e valor percebido.",
    economia: "Economia não vive só no jornal. Ela aparece no mercado, no aluguel, na fatura, no combustível e no salário."
  };

  const selectedSteps = steps[cat] || steps.financas;

  return `${title}

${intro[cat] || intro.financas}

${description}

Por que isso importa

A maioria das pessoas não está presa por falta de capacidade. Está presa porque recebe informação solta demais, difícil demais ou genérica demais. Quando o assunto vira passo a passo, a ação fica mais possível.

O caminho prático

${selectedSteps.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Erro comum

O erro mais comum é querer resolver tudo de uma vez. Quem tenta mudar tudo em um único dia normalmente desiste rápido. O melhor caminho é escolher uma ação pequena, aplicar, medir e melhorar.

Exemplo simples

Imagine alguém que quer melhorar a vida financeira, aprender programação ou criar renda extra. Essa pessoa não precisa dominar tudo hoje. Ela precisa entender o primeiro passo, aplicar com constância e transformar isso em experiência real.

O que pode acontecer quando você aplica

Não existe resultado automático, mas existe aumento de chance quando você age com método. Dependendo da sua realidade, esse conhecimento pode virar economia, renda extra, oportunidade profissional, portfólio, decisão melhor ou mais controle sobre o próprio dinheiro.

Aplicação para hoje

Escolha uma única ação deste conteúdo e execute ainda hoje. Pequenas decisões repetidas criam resultados maiores do que grandes promessas abandonadas.

Conclusão

Quem evolui não é quem sabe tudo. É quem começa com clareza, corrige no caminho e permanece constante.

Como diz Provérbios 21:5, os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza.`;
}

function contentSignature(text) {
  return crypto
    .createHash("sha1")
    .update(normalizeText(text).replace(/\s+/g, " "))
    .digest("hex");
}

module.exports = {
  CATEGORY_ORDER,
  TITLE_BANK,
  normalizeText,
  normalizeCategory,
  slugify,
  pickTitle,
  buildDescription,
  buildContent,
  contentSignature
};
