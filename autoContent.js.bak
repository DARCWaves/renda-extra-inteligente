const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "data", "posts.json");

const categories = [
  { name: "financas", weight: 5 },
  { name: "renda-extra", weight: 5 },
  { name: "investimentos", weight: 4 },
  { name: "trabalho", weight: 3 },
  { name: "programacao", weight: 3 },
  { name: "economia", weight: 2 }
];

const titleBank = {
  financas: [
    "Como organizar seu dinheiro mesmo ganhando pouco",
    "O erro que faz seu salário sumir todo mês",
    "Como parar de gastar dinheiro com coisas inúteis",
    "Como sair do aperto financeiro sem depender de milagre",
    "Como montar um controle financeiro simples em poucos minutos"
  ],
  "renda-extra": [
    "5 formas reais de ganhar dinheiro em casa começando do zero",
    "Como fazer renda extra usando apenas o celular",
    "Ideias simples para ganhar dinheiro depois do trabalho",
    "Como transformar uma habilidade simples em renda extra",
    "Como começar uma renda extra sem gastar muito dinheiro"
  ],
  investimentos: [
    "Como começar a investir com pouco dinheiro",
    "Onde investir R$100 por mês sem complicar",
    "O que você precisa saber antes de investir pela primeira vez",
    "Como investir sem cair em promessa de dinheiro fácil",
    "Como criar o hábito de investir mesmo ganhando pouco"
  ],
  trabalho: [
    "Como aumentar sua renda usando o trabalho que você já tem",
    "Como ser mais valorizado no trabalho sem puxar saco",
    "Como transformar experiência prática em oportunidade",
    "Como ganhar mais dinheiro melhorando uma habilidade",
    "O que fazer quando você trabalha muito e mesmo assim sobra pouco"
  ],
  programacao: [
    "Como entender programação mesmo começando do zero",
    "Programação explicada como se fosse uma receita simples",
    "Como criar seu primeiro site sem entender tudo de uma vez",
    "O jeito mais simples de entender lógica de programação",
    "Como aprender programação pelo celular usando passos pequenos"
  ],
  economia: [
    "Como a inflação tira dinheiro do seu bolso sem você perceber",
    "Por que o dólar alto deixa sua vida mais cara",
    "Como a Selic afeta dívidas, compras e investimentos",
    "O que os indicadores econômicos mudam na sua vida real",
    "Como entender economia sem linguagem difícil"
  ]
};

const descriptions = {
  financas: "Aprenda um passo simples para organizar seu dinheiro, cortar desperdícios e tomar decisões melhores.",
  "renda-extra": "Veja ideias práticas para criar renda extra sem cair em promessa falsa ou fórmula milagrosa.",
  investimentos: "Entenda como começar a investir com segurança, simplicidade e pouco dinheiro.",
  trabalho: "Aprenda formas práticas de aumentar seu valor, melhorar sua renda e usar melhor suas habilidades.",
  programacao: "Aprenda programação com linguagem simples, exemplos do dia a dia e foco em lógica antes do código.",
  economia: "Entenda como economia, inflação, dólar e juros afetam diretamente seu bolso."
};

function ensureDataFile() {
  const dir = path.dirname(postsFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2), "utf8");
  }
}

function readPosts() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(postsFile, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  ensureDataFile();
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), "utf8");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickCategory() {
  const pool = [];

  categories.forEach((cat) => {
    for (let i = 0; i < cat.weight; i++) {
      pool.push(cat.name);
    }
  });

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickTitle(category, posts) {
  const usedTitles = new Set(posts.map((post) => post.title));
  const options = titleBank[category] || titleBank.financas;

  const available = options.filter((title) => !usedTitles.has(title));

  if (available.length) {
    return available[Math.floor(Math.random() * available.length)];
  }

  return `${options[Math.floor(Math.random() * options.length)]} - guia ${Date.now()}`;
}

function buildIntro(category, title) {
  const intros = {
    financas: `Muita gente acha que o problema é apenas ganhar pouco. Mas, em muitos casos, o dinheiro também escapa porque ninguém ensinou um método simples de organização.\n\nNeste conteúdo, você vai entender ${title.toLowerCase()} com uma linguagem direta, sem teoria inútil e sem enrolação.`,
    "renda-extra": `Renda extra não precisa começar com investimento alto nem promessa milagrosa. O começo pode ser simples, pequeno e realista.\n\nAqui você vai ver ${title.toLowerCase()} de um jeito prático, pensando em quem tem pouco tempo e precisa de clareza.`,
    investimentos: `Investir assusta muita gente porque o assunto costuma ser explicado de forma difícil. Mas o primeiro passo não precisa ser complicado.\n\nNeste guia, você vai entender ${title.toLowerCase()} com foco em segurança, simplicidade e consistência.`,
    trabalho: `Trabalhar muito nem sempre significa ganhar bem. Às vezes, falta estratégia para transformar esforço em valor percebido.\n\nAqui você vai aprender ${title.toLowerCase()} com exemplos práticos para aplicar na vida real.`,
    programacao: `Programação não começa no código. Começa na lógica. Antes de decorar comandos, você precisa entender como pensar em passos.\n\nNeste conteúdo, você vai aprender ${title.toLowerCase()} de um jeito simples, quase como explicar para uma criança, mas sem infantilizar.`,
    economia: `Economia parece distante, mas ela aparece no mercado, no aluguel, no combustível, no cartão e no salário.\n\nAqui você vai entender ${title.toLowerCase()} com foco no impacto real no seu bolso.`
  };

  return intros[category] || intros.financas;
}

function buildSteps(category) {
  const steps = {
    financas: [
      "Anote tudo que entra e tudo que sai.",
      "Separe gastos essenciais, importantes e desnecessários.",
      "Corte primeiro os vazamentos pequenos que se repetem.",
      "Defina um valor mínimo para guardar, mesmo que seja pouco.",
      "Revise sua vida financeira uma vez por semana."
    ],
    "renda-extra": [
      "Escolha uma habilidade simples que você já tem.",
      "Transforme essa habilidade em uma oferta pequena.",
      "Divulgue para pessoas próximas e nas redes sociais.",
      "Comece com preço acessível para validar a ideia.",
      "Melhore a entrega e repita o processo."
    ],
    investimentos: [
      "Organize sua vida financeira antes de investir.",
      "Monte uma pequena reserva de emergência.",
      "Entenda o risco antes de olhar rendimento.",
      "Comece com valores pequenos e constantes.",
      "Evite promessas de ganho rápido."
    ],
    trabalho: [
      "Identifique o que você faz melhor que a média.",
      "Procure problemas que você consegue resolver.",
      "Mostre resultado, não apenas esforço.",
      "Aprenda uma habilidade que aumente seu valor.",
      "Documente seus projetos e conquistas."
    ],
    programacao: [
      "Entenda o problema antes de escrever código.",
      "Divida o problema em passos pequenos.",
      "Transforme cada passo em uma instrução simples.",
      "Teste uma parte de cada vez.",
      "Erre, corrija e repita sem desespero."
    ],
    economia: [
      "Observe o preço das coisas no dia a dia.",
      "Compare inflação oficial com sua realidade.",
      "Entenda como juros afetam dívidas e compras.",
      "Veja como dólar muda produtos importados e alimentos.",
      "Use informação econômica para tomar decisões melhores."
    ]
  };

  return steps[category] || steps.financas;
}

function buildExamples(category) {
  const examples = {
    financas: "Exemplo: se você gasta R$12 por dia em algo que poderia reduzir, isso vira cerca de R$360 por mês. Às vezes, o dinheiro não falta de uma vez. Ele vaza em pequenas decisões repetidas.",
    "renda-extra": "Exemplo: uma pessoa que sabe fazer arte simples no Canva pode começar oferecendo cardápios, posts e banners para pequenos negócios do bairro.",
    investimentos: "Exemplo: investir R$100 por mês pode parecer pouco, mas cria hábito. O hábito vem antes do grande patrimônio.",
    trabalho: "Exemplo: se você trabalha no campo, em obra, comércio ou serviço, pode transformar sua experiência em conteúdo, consultoria simples ou prestação de serviço melhor organizada.",
    programacao: "Exemplo: criar um botão em um site é como criar uma campainha. A pessoa aperta e alguma coisa acontece. Esse é o raciocínio por trás do código.",
    economia: "Exemplo: quando a inflação sobe, seu salário compra menos. Mesmo que o número na conta seja o mesmo, o poder real do dinheiro diminui."
  };

  return examples[category] || examples.financas;
}

function generateContent(category, title) {
  const intro = buildIntro(category, title);
  const steps = buildSteps(category);
  const example = buildExamples(category);

  const stepText = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  return `${intro}

O problema principal

A maior trava não é falta de inteligência. É falta de clareza. Quando um assunto parece difícil demais, a pessoa trava, adia e continua no mesmo lugar.

Por isso, o segredo é simplificar o caminho.

Passo a passo prático

${stepText}

Exemplo real

${example}

O que evitar

- Promessas de dinheiro fácil.
- Comparar sua realidade com a de pessoas que já estão muito à frente.
- Começar grande demais e desistir rápido.
- Consumir conteúdo sem aplicar nada.
- Achar que uma única decisão vai resolver tudo.

O que fazer hoje

Escolha uma ação pequena deste conteúdo e aplique ainda hoje. Pode ser anotar gastos, pesquisar uma ideia de renda extra, estudar um conceito básico ou organizar uma pequena meta.

Conclusão

Melhorar de vida não é mágica. É direção, repetição e decisão. Como diz Provérbios 21:5, os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza.

Comece pequeno, mas comece com seriedade.`;
}

function generatePost() {
  const posts = readPosts();
  const category = pickCategory();
  const title = pickTitle(category, posts);
  const now = Date.now();

  const post = {
    slug: `${slugify(title)}-${now}`,
    category,
    title,
    description: descriptions[category] || descriptions.financas,
    content: generateContent(category, title),
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: descriptions[category] || descriptions.financas,
    seoKeywords: `${category}, dinheiro, renda extra, finanças pessoais, investimentos, trabalho, programação, educação financeira`,
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);

  const limitedPosts = posts.slice(0, 300);

  savePosts(limitedPosts);

  return post;
}

function runAutoPost() {
  const post = generatePost();
  console.log("✅ Post automático criado:", post.title);
  return post;
}

module.exports = { runAutoPost };
