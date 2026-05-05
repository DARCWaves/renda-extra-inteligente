const crypto = require("crypto");

const categories = ["financas", "renda-extra", "programacao", "investimentos", "trabalho", "economia"];

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
    .slice(0, 110);
}

function normalizeCategory(category) {
  const value = normalizeText(category);
  const map = {
    financas: "financas",
    financeiro: "financas",
    dinheiro: "financas",
    renda: "renda-extra",
    rendaextra: "renda-extra",
    "renda-extra": "renda-extra",
    investimento: "investimentos",
    investimentos: "investimentos",
    programacao: "programacao",
    programar: "programacao",
    codigo: "programacao",
    tecnologia: "programacao",
    trabalho: "trabalho",
    emprego: "trabalho",
    economia: "economia",
    noticia: "economia",
    noticias: "economia"
  };
  return map[value] || value || "financas";
}

function detectCategoryFromTitle(title, fallback = "financas") {
  const t = normalizeText(title);
  if (t.includes("program") || t.includes("codigo") || t.includes("javascript") || t.includes("site") || t.includes("app")) return "programacao";
  if (t.includes("renda extra") || t.includes("ganhar dinheiro") || t.includes("vender") || t.includes("celular")) return "renda-extra";
  if (t.includes("invest") || t.includes("fii") || t.includes("tesouro") || t.includes("acoes")) return "investimentos";
  if (t.includes("trabalho") || t.includes("emprego") || t.includes("habilidade")) return "trabalho";
  if (t.includes("inflacao") || t.includes("dolar") || t.includes("selic") || t.includes("economia")) return "economia";
  if (t.includes("divida") || t.includes("gasto") || t.includes("salario") || t.includes("organizar") || t.includes("dinheiro")) return "financas";
  return normalizeCategory(fallback);
}

const titleBanks = {
  financas: [
    "Como organizar seu dinheiro mesmo ganhando pouco e parar de viver no aperto",
    "O erro silencioso que faz seu salário sumir antes do fim do mês",
    "Como controlar gastos sem planilha complicada e recuperar clareza financeira",
    "Como sair do aperto financeiro começando por decisões pequenas",
    "Como montar uma rotina simples para cuidar do dinheiro toda semana",
    "Por que você trabalha tanto e ainda sente que o dinheiro não sobra",
    "Como separar desejo de necessidade antes de gastar dinheiro",
    "Como montar uma reserva mesmo quando parece impossível sobrar dinheiro"
  ],
  "renda-extra": [
    "5 formas de fazer renda extra pelo celular sem cair em promessa falsa",
    "Como ganhar dinheiro em casa começando pequeno e evitando os erros mais comuns",
    "Renda extra para iniciantes: o caminho simples para fazer sua primeira venda",
    "Como transformar uma habilidade simples em uma fonte de renda extra",
    "O que vender para fazer renda extra mesmo tendo pouco dinheiro para começar",
    "Como criar renda extra depois do trabalho sem depender de fórmula mágica",
    "Ideias de renda extra para quem ganha pouco e precisa começar com segurança",
    "Como testar uma ideia de renda extra em 7 dias sem gastar quase nada"
  ],
  programacao: [
    "Como aprender programação do zero sem travar na lógica",
    "Lógica de programação explicada como uma receita simples para iniciantes",
    "Como criar seu primeiro site mesmo sem entender tudo de programação",
    "Programação para iniciantes: o jeito certo de entender código sem decorar",
    "Como usar programação para criar oportunidades mesmo começando pelo celular",
    "O primeiro projeto que todo iniciante deveria criar para aprender programação",
    "Como entender JavaScript usando exemplos simples do dia a dia",
    "Como aprender a pensar como programador antes de escrever código"
  ],
  investimentos: [
    "Como começar a investir com pouco dinheiro sem fazer besteira",
    "O que entender antes de investir pela primeira vez e evitar decisões ruins",
    "Como investir R$100 por mês com mais consciência e menos ansiedade",
    "Investimentos para iniciantes: como começar pequeno e criar constância",
    "Como perder o medo de investir entendendo risco antes de rendimento",
    "Por que investir sem reserva pode atrasar sua vida financeira",
    "Como criar o primeiro hábito de investimento sem complicar",
    "Como comparar investimentos sem cair em conversa bonita"
  ],
  trabalho: [
    "Como aumentar sua renda usando melhor o trabalho que você já faz",
    "O que fazer quando você trabalha muito e mesmo assim o dinheiro não rende",
    "Como transformar experiência prática em uma oportunidade de renda",
    "Como ser mais valorizado no trabalho sem depender apenas de sorte",
    "A habilidade simples que pode aumentar seu valor no mercado",
    "Como sair do modo sobrevivência e usar o trabalho como ponte",
    "Como mostrar resultado no trabalho e abrir portas para ganhar mais",
    "Como transformar esforço diário em crescimento real de renda"
  ],
  economia: [
    "Como a inflação tira dinheiro do seu bolso sem você perceber",
    "Por que o dólar alto deixa sua vida mais cara mesmo sem você viajar",
    "Como a Selic afeta dívidas, compras e investimentos na prática",
    "Economia para iniciantes: entenda juros, inflação e salário sem complicação",
    "Por que seu salário compra menos e o que fazer para se proteger",
    "Como entender o preço das coisas olhando dólar, juros e inflação",
    "O que os indicadores econômicos revelam sobre seu poder de compra",
    "Como usar dados econômicos para tomar decisões melhores no mês"
  ]
};

const descriptions = {
  financas: "Organização financeira simples para quem quer cortar desperdícios, entender o próprio dinheiro e sair do aperto com mais clareza.",
  "renda-extra": "Ideias práticas para criar novas fontes de renda começando pequeno, com baixo risco e sem promessa milagrosa.",
  programacao: "Programação explicada com lógica simples, exemplos reais e foco em construir projetos úteis desde o começo.",
  investimentos: "Investimentos para começar com pouco dinheiro, mais consciência, menos ansiedade e decisões mais seguras.",
  trabalho: "Estratégias para transformar esforço, experiência e habilidade em mais valor, oportunidade e crescimento de renda.",
  economia: "Economia explicada pelo impacto real no bolso: inflação, dólar, juros, salário e poder de compra."
};

function pickNewTitle(category, usedTitles = new Set()) {
  const bank = titleBanks[normalizeCategory(category)] || titleBanks.financas;
  for (const title of bank) {
    if (!usedTitles.has(normalizeText(title))) return title;
  }
  return `${bank[Math.floor(Math.random() * bank.length)]} - guia prático ${Date.now()}`;
}

function improveTitle(title, category, usedTitles = new Set()) {
  const t = normalizeText(title);
  const weak = !t || t.length < 34 || t.includes("como melhorar sua vida com") || t.includes("aprenda estrategias reais") || t.includes("conteudo educativo");
  if (!weak && !usedTitles.has(t)) return title;
  return pickNewTitle(category, usedTitles);
}

function makeSignature(content) {
  return crypto.createHash("sha1").update(normalizeText(content).replace(/\s+/g, " ")).digest("hex");
}

function buildDescription(category, title) {
  const cat = normalizeCategory(category);
  const t = normalizeText(title);

  if (cat === "financas" && t.includes("salario")) return "Entenda por que o salário desaparece antes do fim do mês e como criar uma rotina simples para recuperar controle.";
  if (cat === "financas" && t.includes("gasto")) return "Aprenda a identificar gastos invisíveis, cortar vazamentos e transformar pequenas decisões em folga no orçamento.";
  if (cat === "renda-extra" && t.includes("celular")) return "Veja formas realistas de usar o celular para testar renda extra sem cair em promessa fácil.";
  if (cat === "renda-extra" && t.includes("venda")) return "Aprenda como pensar na primeira venda, criar uma oferta simples e validar uma ideia com pouco dinheiro.";
  if (cat === "programacao" && t.includes("logica")) return "Entenda lógica de programação com exemplos simples antes de se perder em comandos e erros.";
  if (cat === "programacao" && t.includes("site")) return "Veja como criar seu primeiro site pode ensinar programação, organização e raciocínio prático.";
  if (cat === "investimentos") return "Aprenda a começar nos investimentos com menos pressa, mais segurança e foco em constância.";
  if (cat === "trabalho") return "Descubra como transformar sua experiência de trabalho em mais valor, oportunidade e crescimento.";
  if (cat === "economia") return "Entenda como os indicadores econômicos afetam preços, dívidas, compras e poder de compra.";
  return descriptions[cat] || descriptions.financas;
}

function detectAngle(title, category) {
  const t = normalizeText(title);
  if (t.includes("celular")) return "celular";
  if (t.includes("venda") || t.includes("vender")) return "venda";
  if (t.includes("casa")) return "casa";
  if (t.includes("logica")) return "logica";
  if (t.includes("site")) return "site";
  if (t.includes("gasto")) return "gastos";
  if (t.includes("salario")) return "salario";
  if (t.includes("dolar")) return "dolar";
  if (t.includes("inflacao")) return "inflacao";
  if (t.includes("selic")) return "selic";
  return normalizeCategory(category);
}

function buildContent(categoryInput, titleInput, variant = 0) {
  const category = normalizeCategory(categoryInput);
  const title = String(titleInput || pickNewTitle(category)).trim();
  const angle = detectAngle(title, category);

  const intros = {
    financas: {
      salario: "O salário não some por mágica. Ele escapa quando as contas não têm ordem, os pequenos gastos passam despercebidos e a pessoa só percebe o problema quando o mês ainda nem acabou.",
      gastos: "Gasto pequeno parece inofensivo quando acontece uma vez. O problema é quando ele se repete todos os dias e vira um buraco silencioso no orçamento.",
      default: "Organizar dinheiro não é sobre virar especialista em planilhas. É sobre enxergar o que entra, o que sai e quais decisões estão mantendo você no aperto."
    },
    "renda-extra": {
      celular: "O celular pode ser uma ferramenta de renda, mas também pode virar armadilha de promessa falsa. A diferença está em usar ele para oferecer algo útil, testar rápido e medir resposta real.",
      venda: "A primeira venda não precisa ser grande. Ela precisa provar que alguém aceitou pagar por uma solução sua. Esse pequeno sinal muda a forma como você enxerga renda extra.",
      default: "Renda extra começa quando você conecta uma dor real com uma entrega simples. Não precisa começar perfeito. Precisa começar testável."
    },
    programacao: {
      logica: "A lógica é o coração da programação. Sem ela, o código parece um monte de símbolos. Com ela, cada comando vira apenas uma forma de explicar ao computador o que fazer.",
      site: "Criar um site é um dos caminhos mais práticos para aprender programação, porque você vê o resultado na tela e entende o papel de cada parte.",
      default: "Programação fica mais simples quando você para de tentar decorar tudo e começa a entender o raciocínio por trás das estruturas."
    },
    investimentos: {
      default: "Investir não começa no rendimento. Começa na organização. Quem pula essa parte costuma se assustar com risco, vender na hora errada ou cair em conversa bonita."
    },
    trabalho: {
      default: "Trabalhar muito não garante crescer. O que muda o jogo é transformar esforço em resultado visível, habilidade útil e valor percebido."
    },
    economia: {
      dolar: "O dólar parece distante até aparecer no preço do eletrônico, do combustível, dos alimentos e de produtos que você nem imaginava que dependiam dele.",
      inflacao: "A inflação não tira dinheiro da conta, mas reduz o que ele compra. Por isso a pessoa sente que ganha igual e vive pior.",
      selic: "A Selic mexe com crédito, dívida, financiamento e investimentos. Entender isso ajuda a tomar decisões melhores antes de assumir compromissos caros.",
      default: "Economia não é só notícia. Ela aparece no mercado, na fatura, no aluguel, no combustível e no poder de compra."
    }
  };

  const steps = {
    financas: ["Liste tudo que entra e sai no mês.", "Separe gastos essenciais, importantes e impulsivos.", "Escolha um gasto invisível para cortar primeiro.", "Defina uma meta semanal pequena.", "Revise no mesmo dia toda semana."],
    "renda-extra": ["Escolha uma ideia simples e barata de testar.", "Descubra quem teria interesse real nela.", "Crie uma oferta curta e clara.", "Divulgue para poucas pessoas primeiro.", "Melhore com base nas respostas."],
    programacao: ["Explique o problema em português.", "Divida em passos pequenos.", "Transforme cada passo em lógica.", "Escreva pouco código por vez.", "Teste, erre, corrija e repita."],
    investimentos: ["Organize o orçamento antes.", "Monte uma reserva mínima.", "Entenda risco antes de rendimento.", "Comece com pouco dinheiro.", "Crie constância antes de buscar ganho alto."],
    trabalho: ["Identifique uma habilidade útil.", "Observe problemas que você resolve.", "Registre resultados entregues.", "Aprenda algo complementar.", "Mostre valor com clareza."],
    economia: ["Observe preços reais no seu dia a dia.", "Compare com os indicadores.", "Evite dívidas caras em juros altos.", "Planeje compras maiores.", "Use dados como alerta, não como enfeite."]
  };

  const examples = {
    financas: "Exemplo: R$20 por dia em compras pequenas viram cerca de R$600 por mês. O problema não é o café, o lanche ou a compra isolada. É o padrão sem controle.",
    "renda-extra": "Exemplo: uma pessoa que sabe editar vídeos simples pode oferecer cortes para pequenos comércios, criadores iniciantes ou vendedores locais. O primeiro objetivo não é ficar rico: é validar uma entrega.",
    programacao: "Exemplo: antes de criar um botão, pense no comportamento: quando a pessoa clica, algo deve acontecer. Esse raciocínio é mais importante do que decorar o comando.",
    investimentos: "Exemplo: investir R$100 por mês não transforma tudo rapidamente, mas constrói hábito. Hábito financeiro bom é uma das bases para crescer.",
    trabalho: "Exemplo: alguém que registra o que entrega, aprende uma habilidade nova e comunica melhor seu resultado aumenta a chance de ser lembrado em oportunidades.",
    economia: "Exemplo: se mercado, gás, transporte e aluguel sobem mais que o salário, sua inflação pessoal pode ser muito maior que a oficial."
  };

  const intro = (intros[category] && (intros[category][angle] || intros[category].default)) || intros.financas.default;
  const stepText = (steps[category] || steps.financas).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const example = examples[category] || examples.financas;

  return `${title}

${intro}

Por que isso merece sua atenção

A maioria das pessoas não está presa por falta de inteligência. Está presa porque recebe informação solta demais, genérica demais e difícil de aplicar. O caminho melhora quando o assunto vira processo.

A dor que esse conteúdo resolve

Este conteúdo ataca uma trava comum: saber que precisa mudar, mas não saber qual passo dar primeiro. Quando o primeiro passo fica claro, a pessoa para de depender de motivação e começa a depender de método.

O caminho prático

${stepText}

Exemplo realista

${example}

Onde muita gente erra

- Tenta resolver tudo em um dia.
- Começa comprando ferramenta antes de validar.
- Copia quem já está avançado e ignora a própria realidade.
- Consome conteúdo demais e pratica pouco.
- Procura resultado rápido sem criar repetição.

O que pode acontecer quando você aplica

Não existe garantia de resultado, mas existe aumento de chance quando você coloca uma ação simples em prática. Dependendo da sua realidade, esse conhecimento pode virar economia mensal, renda extra, portfólio, oportunidade de trabalho ou decisão financeira melhor.

Como usar isso como roteiro de vídeo

1. Abra mostrando a dor.
2. Mostre o erro comum.
3. Explique o passo a passo.
4. Dê um exemplo realista.
5. Termine com uma ação prática.

Aplicação para hoje

Escolha uma parte deste conteúdo e execute ainda hoje. Não precisa ser perfeito. Precisa ser feito, medido e melhorado.

Conclusão

Quem melhora de vida não é quem entende tudo antes de começar. É quem começa com clareza, ajusta no caminho e repete o que funciona.

Como diz Provérbios 21:5, os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza.`;
}

module.exports = {
  categories,
  titleBanks,
  descriptions,
  normalizeText,
  normalizeCategory,
  detectCategoryFromTitle,
  improveTitle,
  pickNewTitle,
  buildDescription,
  buildContent,
  slugify,
  makeSignature
};
