const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "data", "posts.json");
const stateFile = path.join(__dirname, "data", "auto-post-state.json");

const categoryCycle = [
  "renda-extra",
  "programacao",
  "financas",
  "trabalho",
  "investimentos",
  "economia"
];

const titleBank = {
  "renda-extra": [
    "Como ganhar dinheiro em casa começando do zero: 7 ideias reais para testar hoje",
    "5 formas de fazer renda extra pelo celular sem cair em promessa falsa",
    "Como criar uma renda extra depois do trabalho mesmo tendo pouco tempo",
    "Ideias de renda extra para quem ganha pouco e precisa de dinheiro rápido",
    "Como transformar uma habilidade simples em renda extra ainda este mês",
    "Como começar a vender algo simples e fazer sua primeira renda extra",
    "Renda extra para iniciantes: o caminho mais simples para começar hoje"
  ],
  programacao: [
    "Como aprender programação do zero mesmo achando que é difícil",
    "Lógica de programação explicada como uma receita simples para iniciantes",
    "Como criar seu primeiro site sem entender tudo de uma vez",
    "Programação para iniciantes: o jeito mais simples de entender código",
    "Como aprender JavaScript pelo celular com passos pequenos e práticos",
    "Como transformar programação em renda mesmo começando do básico",
    "O primeiro passo para aprender programação sem travar na lógica"
  ],
  financas: [
    "Como organizar seu dinheiro mesmo ganhando pouco: passo a passo simples",
    "O erro que faz seu salário sumir todo mês sem você perceber",
    "Como sair do aperto financeiro sem depender de milagre",
    "Como parar de gastar dinheiro com coisas inúteis e recuperar o controle",
    "Como montar um controle financeiro simples em menos de 30 minutos",
    "Como guardar dinheiro mesmo quando parece que não sobra nada",
    "Como controlar gastos e parar de viver apagando incêndio"
  ],
  trabalho: [
    "Como aumentar sua renda usando o trabalho que você já tem",
    "O que fazer quando você trabalha muito e mesmo assim sobra pouco dinheiro",
    "Como ser mais valorizado no trabalho sem depender de sorte",
    "Como transformar experiência prática em oportunidade de renda",
    "Como ganhar mais dinheiro melhorando uma habilidade por vez",
    "Como usar seu conhecimento do dia a dia para criar novas oportunidades",
    "Como sair do modo sobrevivência e transformar trabalho em crescimento"
  ],
  investimentos: [
    "Como começar a investir com pouco dinheiro sem fazer besteira",
    "Onde investir R$100 por mês: guia simples para iniciantes",
    "O que você precisa saber antes de investir pela primeira vez",
    "Como investir ganhando pouco e criar consistência aos poucos",
    "Investimentos para iniciantes: como começar sem cair em promessa fácil",
    "Como perder o medo de investir e começar com segurança",
    "Como montar o primeiro hábito de investimento sem complicação"
  ],
  economia: [
    "Como a inflação tira dinheiro do seu bolso sem você perceber",
    "Por que o dólar alto deixa sua vida mais cara mesmo sem você viajar",
    "Como a Selic afeta dívidas, compras e investimentos na prática",
    "O que os indicadores econômicos mudam na vida de quem ganha pouco",
    "Economia para iniciantes: entenda juros, inflação e salário sem complicação",
    "Como entender o preço das coisas olhando inflação, dólar e juros",
    "Por que seu salário compra menos e o que fazer para se proteger"
  ]
};

const descriptions = {
  "renda-extra": "Aprenda ideias práticas para criar renda extra com pouco dinheiro, pouco tempo e sem promessa milagrosa.",
  programacao: "Entenda programação com linguagem simples, exemplos do dia a dia e foco em lógica antes do código.",
  financas: "Aprenda a organizar seu dinheiro, cortar desperdícios e tomar decisões melhores mesmo ganhando pouco.",
  trabalho: "Veja como transformar esforço, habilidade e experiência prática em mais valor e mais renda.",
  investimentos: "Comece a investir com pouco dinheiro, mais segurança e menos confusão.",
  economia: "Entenda como inflação, dólar, juros e tributos afetam diretamente seu bolso."
};

function ensureFiles() {
  const dir = path.dirname(postsFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2), "utf8");
  }

  if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(stateFile, JSON.stringify({ index: 0 }, null, 2), "utf8");
  }
}

function readJson(file, fallback) {
  ensureFiles();

  try {
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function readPosts() {
  return readJson(postsFile, []);
}

function savePosts(posts) {
  writeJson(postsFile, posts);
}

function getNextCategory() {
  const state = readJson(stateFile, { index: 0 });
  const index = Number.isFinite(Number(state.index)) ? Number(state.index) : 0;
  const category = categoryCycle[index % categoryCycle.length];

  writeJson(stateFile, {
    index: index + 1,
    lastCategory: category,
    updatedAt: new Date().toISOString()
  });

  return category;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function detectCategory(post) {
  const text = `${post.title || ""} ${post.description || ""} ${post.content || ""} ${post.category || ""}`.toLowerCase();

  if (text.includes("program") || text.includes("javascript") || text.includes("código") || text.includes("codigo")) return "programacao";
  if (text.includes("renda extra") || text.includes("ganhar dinheiro") || text.includes("vender")) return "renda-extra";
  if (text.includes("invest")) return "investimentos";
  if (text.includes("trabalho") || text.includes("emprego")) return "trabalho";
  if (text.includes("inflação") || text.includes("inflacao") || text.includes("dólar") || text.includes("dolar") || text.includes("selic")) return "economia";
  return "financas";
}

function pickTitle(category, posts) {
  const used = new Set(posts.map(post => post.title));
  const options = titleBank[category] || titleBank.financas;
  const available = options.filter(title => !used.has(title));

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  const base = options[Math.floor(Math.random() * options.length)];
  return `${base} - guia prático ${Date.now()}`;
}

function buildContent(category, title) {
  const intro = {
    "renda-extra": `Renda extra não começa com fórmula mágica. Começa com uma oferta simples, uma dor real e uma ação pequena.\n\nNeste guia, você vai entender ${title.toLowerCase()} com foco em algo aplicável para quem tem pouco tempo, pouco dinheiro e precisa começar sem inventar moda.`,
    programacao: `Programação parece difícil quando alguém começa pelo código antes de explicar a lógica.\n\nAqui, você vai entender ${title.toLowerCase()} com linguagem simples, como se fosse uma receita: primeiro o passo, depois o comando.`,
    financas: `Muita gente acha que o problema é só ganhar pouco. Mas, muitas vezes, o dinheiro também escapa por falta de organização.\n\nAqui você vai aprender ${title.toLowerCase()} com um método simples, direto e sem linguagem difícil.`,
    trabalho: `Trabalhar muito não garante ganhar mais. O segredo é transformar esforço em valor percebido.\n\nNeste conteúdo, você vai entender ${title.toLowerCase()} com exemplos práticos para aplicar no seu dia a dia.`,
    investimentos: `Investir não precisa começar com muito dinheiro. Precisa começar com clareza, paciência e segurança.\n\nNeste guia, você vai entender ${title.toLowerCase()} sem cair em promessa de dinheiro fácil.`,
    economia: `Economia não é só assunto de jornal. Ela aparece no mercado, no cartão, no combustível, no aluguel e no salário.\n\nAqui você vai entender ${title.toLowerCase()} de um jeito simples e conectado com sua vida real.`
  };

  const pain = {
    "renda-extra": "A dor principal é depender de uma única renda e perceber que o salário não acompanha o custo de vida.",
    programacao: "A maior trava do iniciante é achar que precisa entender tudo antes de começar.",
    financas: "A maior dor é receber dinheiro e não saber para onde ele foi no fim do mês.",
    trabalho: "A dor principal é trabalhar muito, se cansar muito e mesmo assim não ver crescimento financeiro.",
    investimentos: "A maior trava é o medo de perder dinheiro ou investir em algo que não entende.",
    economia: "A dor principal é sentir que tudo ficou mais caro, mas não entender exatamente por quê."
  };

  const steps = {
    "renda-extra": [
      "Escolha uma habilidade, produto ou serviço simples.",
      "Valide com pessoas próximas antes de gastar dinheiro.",
      "Crie uma oferta clara: o que você faz, para quem faz e quanto custa.",
      "Divulgue em grupos, redes sociais e contatos diretos.",
      "Melhore a entrega e repita o que funcionar."
    ],
    programacao: [
      "Entenda o problema antes de escrever código.",
      "Divida o problema em passos pequenos.",
      "Transforme cada passo em uma instrução.",
      "Teste uma parte de cada vez.",
      "Erre, corrija e repita sem desespero."
    ],
    financas: [
      "Anote tudo que entra e tudo que sai.",
      "Separe gastos essenciais, importantes e desnecessários.",
      "Corte pequenos vazamentos que se repetem todo mês.",
      "Defina uma meta simples para a semana.",
      "Revise seus gastos uma vez por semana."
    ],
    trabalho: [
      "Identifique o que você faz melhor que a média.",
      "Observe problemas que você consegue resolver.",
      "Mostre resultados, não apenas esforço.",
      "Aprenda uma habilidade que aumente seu valor.",
      "Registre suas entregas para usar como prova."
    ],
    investimentos: [
      "Organize sua vida financeira antes de investir.",
      "Monte uma reserva de emergência aos poucos.",
      "Entenda risco antes de olhar rendimento.",
      "Comece com pouco e mantenha constância.",
      "Fuja de promessas de ganho rápido."
    ],
    economia: [
      "Observe preços no mercado e no transporte.",
      "Compare seu salário com seu custo real de vida.",
      "Entenda como juros afetam dívidas.",
      "Veja como dólar influencia produtos e alimentos.",
      "Use os dados para decidir melhor."
    ]
  };

  const examples = {
    "renda-extra": "Exemplo: se você sabe editar imagens simples, pode oferecer posts para pequenos negócios da sua cidade.",
    programacao: "Exemplo: um botão em um site é como uma campainha. A pessoa clica e alguma coisa acontece.",
    financas: "Exemplo: R$15 por dia parecem pouco, mas viram cerca de R$450 por mês.",
    trabalho: "Exemplo: alguém que trabalha no campo, comércio ou construção pode transformar experiência prática em conteúdo, serviço ou consultoria simples.",
    investimentos: "Exemplo: investir R$100 por mês cria hábito. O hábito vem antes do patrimônio grande.",
    economia: "Exemplo: quando a inflação sobe, seu salário compra menos mesmo que o número na conta seja igual."
  };

  const stepText = (steps[category] || steps.financas)
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");

  return `${intro[category] || intro.financas}

A dor que esse conteúdo resolve

${pain[category] || pain.financas}

O caminho simples

${stepText}

Exemplo prático

${examples[category] || examples.financas}

O erro que você precisa evitar

- Procurar fórmula mágica.
- Começar grande demais.
- Comprar ferramenta antes de entender o básico.
- Comparar sua realidade com quem já está muito à frente.
- Consumir conteúdo sem aplicar nada.

Aplicação para hoje

Escolha apenas uma ação deste conteúdo e coloque em prática ainda hoje. Pequenas decisões repetidas vencem grandes planos que nunca saem do papel.

Conclusão


Veja também:

- <a href="/categoria/renda-extra">Renda extra</a>

- <a href="/categoria/financas">Finanças pessoais</a>

- <a href="/categoria/programacao">Programação simples</a>

- <a href="/indicadores">Indicadores econômicos</a>


Melhorar de vida não acontece por sorte. Acontece quando você entende sua realidade, toma decisões melhores e repete o processo com paciência.

Como diz Provérbios 21:5: os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza.`;
}

function buildPost(category, title) {
  const now = Date.now();

  return {
    slug: `${slugify(title)}-${now}`,
    category,
    title,
    description: descriptions[category] || descriptions.financas,
    content: buildContent(category, title),
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: descriptions[category] || descriptions.financas,
    seoKeywords: `${category}, ganhar dinheiro, renda extra, finanças pessoais, programação para iniciantes, investimentos, economia, trabalho`,
    createdAt: new Date().toISOString()
  };
}

function generatePost() {
  const posts = readPosts();
  const category = getNextCategory();
  const title = pickTitle(category, posts);
  const post = buildPost(category, title);

  posts.unshift(post);
  savePosts(posts.slice(0, 300));

  return post;
}

function runAutoPost() {
  const post = generatePost();
  console.log("✅ Post automático criado:", post.title);
  return post;
}

module.exports = {
  runAutoPost,
  buildPost,
  buildContent,
  pickTitle,
  detectCategory,
  descriptions
};
