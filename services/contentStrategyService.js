const crypto = require("crypto");

const categories = [
  "renda-extra",
  "programacao",
  "financas",
  "investimentos",
  "trabalho",
  "economia"
];

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
    investimentos: "investimentos",
    investimento: "investimentos",
    renda: "renda-extra",
    rendaextra: "renda-extra",
    "renda-extra": "renda-extra",
    programacao: "programacao",
    programar: "programacao",
    tecnologia: "programacao",
    trabalho: "trabalho",
    emprego: "trabalho",
    economia: "economia",
    mercado: "economia",
    noticias: "economia"
  };

  return map[value] || value || "financas";
}

function detectCategoryFromTitle(title, fallback = "financas") {
  const text = normalizeText(title);

  if (text.includes("program") || text.includes("codigo") || text.includes("javascript") || text.includes("site") || text.includes("app")) return "programacao";
  if (text.includes("renda extra") || text.includes("ganhar dinheiro") || text.includes("vender") || text.includes("celular")) return "renda-extra";
  if (text.includes("invest") || text.includes("fii") || text.includes("tesouro") || text.includes("acoes")) return "investimentos";
  if (text.includes("trabalho") || text.includes("emprego") || text.includes("habilidade")) return "trabalho";
  if (text.includes("inflacao") || text.includes("dolar") || text.includes("selic") || text.includes("economia")) return "economia";
  if (text.includes("divida") || text.includes("gastos") || text.includes("salario") || text.includes("organizar")) return "financas";

  return normalizeCategory(fallback);
}

const titleBanks = {
  "renda-extra": [
    "5 formas de fazer renda extra pelo celular sem cair em promessa falsa",
    "Como ganhar dinheiro em casa começando pequeno e evitando os erros mais comuns",
    "Renda extra para iniciantes: o caminho simples para fazer sua primeira venda",
    "Como transformar uma habilidade simples em uma fonte de renda extra",
    "O que vender para fazer renda extra mesmo tendo pouco dinheiro para começar",
    "Como criar renda extra depois do trabalho sem depender de fórmula mágica",
    "Ideias de renda extra para quem ganha pouco e precisa começar com segurança"
  ],
  programacao: [
    "Como aprender programação do zero sem travar na lógica",
    "Lógica de programação explicada como uma receita simples para iniciantes",
    "Como criar seu primeiro site mesmo sem entender tudo de programação",
    "Programação para iniciantes: o jeito certo de entender código sem decorar",
    "Como usar programação para criar oportunidades mesmo começando pelo celular",
    "O primeiro projeto que todo iniciante deveria criar para aprender programação",
    "Como entender JavaScript usando exemplos simples do dia a dia"
  ],
  financas: [
    "Como organizar seu dinheiro mesmo ganhando pouco e parar de viver no aperto",
    "O erro silencioso que faz seu salário sumir antes do fim do mês",
    "Como controlar gastos sem planilha complicada e recuperar clareza financeira",
    "Como sair do aperto financeiro começando por decisões pequenas",
    "Como montar uma rotina simples para cuidar do dinheiro toda semana",
    "Por que você trabalha tanto e ainda sente que o dinheiro não sobra",
    "Como separar desejo de necessidade antes de gastar dinheiro"
  ],
  investimentos: [
    "Como começar a investir com pouco dinheiro sem fazer besteira",
    "O que entender antes de investir pela primeira vez e evitar decisões ruins",
    "Como investir R$100 por mês com mais consciência e menos ansiedade",
    "Investimentos para iniciantes: como começar pequeno e criar constância",
    "Como perder o medo de investir entendendo risco antes de rendimento",
    "Por que investir sem reserva pode atrasar sua vida financeira",
    "Como criar o primeiro hábito de investimento sem complicar"
  ],
  trabalho: [
    "Como aumentar sua renda usando melhor o trabalho que você já faz",
    "O que fazer quando você trabalha muito e mesmo assim o dinheiro não rende",
    "Como transformar experiência prática em uma oportunidade de renda",
    "Como ser mais valorizado no trabalho sem depender apenas de sorte",
    "A habilidade simples que pode aumentar seu valor no mercado",
    "Como sair do modo sobrevivência e usar o trabalho como ponte",
    "Como mostrar resultado no trabalho e abrir portas para ganhar mais"
  ],
  economia: [
    "Como a inflação tira dinheiro do seu bolso sem você perceber",
    "Por que o dólar alto deixa sua vida mais cara mesmo sem você viajar",
    "Como a Selic afeta dívidas, compras e investimentos na prática",
    "Economia para iniciantes: entenda juros, inflação e salário sem complicação",
    "Por que seu salário compra menos e o que fazer para se proteger",
    "Como entender o preço das coisas olhando dólar, juros e inflação",
    "O que os indicadores econômicos revelam sobre seu poder de compra"
  ]
};

const descriptions = {
  "renda-extra": "Aprenda caminhos práticos para criar renda extra com pouco dinheiro, começando pequeno e evitando promessa milagrosa.",
  programacao: "Entenda programação com linguagem simples, foco em lógica e exemplos que qualquer iniciante consegue acompanhar.",
  financas: "Aprenda a organizar seu dinheiro, reduzir desperdícios e tomar decisões melhores mesmo ganhando pouco.",
  investimentos: "Comece a investir com mais clareza, segurança e paciência, sem cair em promessas de ganho fácil.",
  trabalho: "Transforme esforço, experiência e habilidade em mais valor, oportunidade e crescimento de renda.",
  economia: "Entenda como dólar, inflação, juros e salário afetam diretamente sua vida financeira."
};

function titleLooksWeak(title) {
  const t = normalizeText(title);

  return (
    !t ||
    t.length < 32 ||
    t.includes("como melhorar sua vida com") ||
    t.includes("aprenda estrategias reais") ||
    t.includes("conteudo educativo sobre")
  );
}

function improveTitle(title, category, usedTitles = new Set()) {
  const cat = detectCategoryFromTitle(title, category);
  const bank = titleBanks[cat] || titleBanks.financas;

  if (!titleLooksWeak(title) && !usedTitles.has(normalizeText(title))) {
    return title;
  }

  for (const option of bank) {
    if (!usedTitles.has(normalizeText(option))) return option;
  }

  return `${bank[Math.floor(Math.random() * bank.length)]} - guia prático ${Date.now()}`;
}

function pickNewTitle(category, usedTitles = new Set()) {
  const cat = normalizeCategory(category);
  const bank = titleBanks[cat] || titleBanks.financas;

  for (const option of bank) {
    if (!usedTitles.has(normalizeText(option))) return option;
  }

  return `${bank[Math.floor(Math.random() * bank.length)]} - passo a passo ${Date.now()}`;
}

function makeSignature(content) {
  return crypto
    .createHash("sha1")
    .update(normalizeText(content).replace(/\s+/g, " "))
    .digest("hex");
}

function detectAngle(title, category) {
  const text = normalizeText(title);

  if (text.includes("celular")) return "celular";
  if (text.includes("casa")) return "casa";
  if (text.includes("primeira venda") || text.includes("vender")) return "venda";
  if (text.includes("logica")) return "logica";
  if (text.includes("site")) return "site";
  if (text.includes("gastos")) return "gastos";
  if (text.includes("salario")) return "salario";
  if (text.includes("investir") || text.includes("investimento")) return "investir";
  if (text.includes("dolar")) return "dolar";
  if (text.includes("inflacao")) return "inflacao";

  return normalizeCategory(category);
}

function buildIntro(category, title, angle) {
  const intros = {
    "renda-extra": {
      celular: "Ganhar dinheiro pelo celular virou desejo de muita gente, mas também virou terreno cheio de promessa bonita e pouca entrega. O ponto não é acreditar em mágica: é entender quais atividades realmente podem ser feitas com o que você já tem na mão.",
      venda: "Fazer a primeira venda muda a cabeça de uma pessoa. Não pelo valor em si, mas porque prova que existe um caminho entre uma ideia simples e dinheiro entrando de verdade.",
      casa: "Ganhar dinheiro em casa parece fácil quando alguém vende a ideia pronta. Na prática, funciona melhor quando você começa pequeno, testa rápido e não gasta antes de validar.",
      default: "Renda extra não começa com fórmula secreta. Começa quando você identifica uma dor real, oferece uma solução simples e repete o processo até ganhar consistência."
    },
    programacao: {
      logica: "A maior trava de quem começa na programação não é o código. É a lógica. Quando a pessoa entende o raciocínio por trás dos comandos, o código deixa de parecer um idioma impossível.",
      site: "Criar um site é um dos melhores primeiros projetos para aprender programação porque junta lógica, visual, organização e resultado na tela. Você vê o que está construindo.",
      default: "Programação parece difícil quando começa pelo lugar errado. O iniciante tenta decorar comandos antes de entender o motivo de cada coisa existir. O caminho mais inteligente é começar pela lógica."
    },
    financas: {
      gastos: "O dinheiro raramente desaparece de uma vez. Ele escapa em pequenas decisões repetidas. Quando você começa a enxergar esses vazamentos, organizar a vida financeira fica menos assustador.",
      salario: "Muita gente recebe o salário e sente que ele já nasceu comprometido. A solução não é apenas ganhar mais, mas entender o caminho do dinheiro dentro da própria rotina.",
      default: "Organizar dinheiro não é sobre virar uma pessoa perfeita. É sobre enxergar para onde ele está indo e tomar decisões melhores antes que o mês acabe."
    },
    investimentos: {
      investir: "Investir com pouco dinheiro não é o problema. O problema é começar sem entender risco, reserva e objetivo. Quando a base está clara, até valores pequenos começam a construir hábito.",
      default: "Investir não precisa começar com muito dinheiro. Precisa começar com ordem, paciência e entendimento. Quem ignora essa base costuma pagar caro pela pressa."
    },
    trabalho: {
      default: "Trabalhar muito não garante crescimento. O que muda o jogo é transformar esforço em valor percebido. Quando você aprende a mostrar resultado, sua experiência começa a abrir portas."
    },
    economia: {
      dolar: "O dólar pode parecer distante, mas aparece no preço do eletrônico, do combustível, de alimentos e até em produtos que você compra sem pensar nisso.",
      inflacao: "A inflação é silenciosa. Ela não tira dinheiro da sua conta, mas reduz o que seu dinheiro consegue comprar. Por isso muita gente sente que ganha igual, mas vive pior.",
      default: "Economia não é assunto apenas de jornal. Ela está no mercado, na fatura, no aluguel, no combustível e nas decisões que você toma todos os dias."
    }
  };

  return (intros[category] && (intros[category][angle] || intros[category].default)) || intros.financas.default;
}

function buildSteps(category, angle) {
  const data = {
    "renda-extra": {
      celular: [
        "Escolha uma atividade que possa ser feita pelo celular, como revenda, edição simples, atendimento, indicação ou criação de conteúdo.",
        "Valide antes de gastar: ofereça para três pessoas e veja se alguém demonstra interesse real.",
        "Crie uma oferta simples com preço, entrega e prazo claros.",
        "Divulgue em grupos, contatos e redes sociais sem parecer desesperado.",
        "Anote o que gerou resposta e repita apenas o que trouxe sinal de interesse."
      ],
      venda: [
        "Escolha um produto ou serviço que resolva uma dor simples.",
        "Defina uma promessa realista: o que a pessoa ganha ao comprar de você.",
        "Monte uma abordagem curta, direta e honesta.",
        "Ofereça primeiro para quem já confia em você.",
        "Use o feedback da primeira tentativa para melhorar a próxima oferta."
      ],
      default: [
        "Liste habilidades, produtos ou serviços que você poderia oferecer hoje.",
        "Escolha uma ideia que não exige investimento alto.",
        "Teste com poucas pessoas antes de criar estrutura grande.",
        "Transforme a ideia em uma oferta simples.",
        "Repita por sete dias e acompanhe respostas, cliques e conversas."
      ]
    },
    programacao: {
      logica: [
        "Pegue um problema simples do dia a dia.",
        "Divida esse problema em passos pequenos.",
        "Escreva os passos em português antes de pensar em código.",
        "Transforme cada passo em uma condição, ação ou repetição.",
        "Teste uma parte por vez e corrija sem pressa."
      ],
      site: [
        "Comece com uma página simples: título, texto e botão.",
        "Entenda o HTML como estrutura da casa.",
        "Use CSS como pintura, espaço e aparência.",
        "Use JavaScript apenas para dar comportamento.",
        "Publique algo pequeno antes de tentar criar um sistema grande."
      ],
      default: [
        "Entenda lógica antes de decorar comandos.",
        "Crie pequenos desafios diários.",
        "Leia erros como pistas, não como fracasso.",
        "Construa projetos simples e úteis.",
        "Explique o que aprendeu como se estivesse ensinando uma criança."
      ]
    },
    financas: {
      gastos: [
        "Anote todos os gastos por sete dias.",
        "Separe o que é necessário, importante e impulso.",
        "Identifique gastos pequenos que se repetem.",
        "Corte um vazamento por semana.",
        "Use o dinheiro economizado para reserva ou dívida prioritária."
      ],
      salario: [
        "Separe o salário em blocos antes de gastar.",
        "Defina o que é conta fixa, comida, transporte e dívida.",
        "Crie um limite para gasto livre.",
        "Reserve nem que seja pouco no começo.",
        "Revise tudo uma vez por semana."
      ],
      default: [
        "Descubra quanto entra e quanto sai.",
        "Organize os gastos por categoria.",
        "Corte desperdícios invisíveis.",
        "Priorize dívidas caras.",
        "Crie uma rotina semanal de revisão."
      ]
    },
    investimentos: {
      default: [
        "Monte uma reserva antes de buscar rendimento alto.",
        "Entenda a diferença entre risco e promessa.",
        "Comece com valores pequenos.",
        "Estude o ativo antes de colocar dinheiro.",
        "Tenha constância em vez de pressa."
      ]
    },
    trabalho: {
      default: [
        "Identifique uma habilidade que você já usa no trabalho.",
        "Veja como essa habilidade resolve problema para outras pessoas.",
        "Registre resultados que você já entregou.",
        "Aprenda algo complementar que aumente seu valor.",
        "Mostre solução, não apenas esforço."
      ]
    },
    economia: {
      dolar: [
        "Observe quais produtos do seu consumo dependem de importação.",
        "Compare preços ao longo do mês.",
        "Evite compras grandes sem pesquisar.",
        "Entenda que dólar alto pode afetar preços indiretamente.",
        "Use essa leitura para planejar melhor compras e investimentos."
      ],
      inflacao: [
        "Compare o preço dos itens que você compra sempre.",
        "Monte sua própria lista de inflação pessoal.",
        "Veja quais categorias subiram mais para você.",
        "Ajuste consumo sem perder qualidade de vida.",
        "Proteja parte do dinheiro com organização e investimento adequado."
      ],
      default: [
        "Acompanhe dólar, inflação e juros.",
        "Compare esses dados com sua vida real.",
        "Evite dívidas caras quando os juros estão altos.",
        "Planeje compras maiores com antecedência.",
        "Use indicadores como alerta, não como enfeite."
      ]
    }
  };

  return (data[category] && (data[category][angle] || data[category].default)) || data.financas.default;
}

function buildExample(category, angle) {
  const examples = {
    "renda-extra": {
      celular: "Exemplo: uma pessoa pode começar oferecendo edição simples de vídeos curtos, divulgação de produtos, revenda local ou criação de artes básicas. Não é sobre ficar rico rápido; é sobre criar a primeira entrada fora do salário.",
      venda: "Exemplo: se você vende um kit simples para conhecidos e entende por que eles compraram, você aprende mais do que passando semanas apenas planejando.",
      default: "Exemplo: alguém que sabe organizar planilhas, editar imagens ou encontrar bons produtos pode transformar isso em serviço simples para pequenos negócios."
    },
    programacao: {
      logica: "Exemplo: antes de criar um botão de cadastro, pense assim: se a pessoa preencheu os dados, o sistema salva; se deixou vazio, o sistema avisa. Isso é lógica antes de código.",
      site: "Exemplo: um site simples com uma página de serviços já ensina estrutura, visual, links, botão e publicação. É pequeno, mas forma base real.",
      default: "Exemplo: criar uma calculadora simples ensina entrada de dados, processamento e resultado. Parece básico, mas é a espinha dorsal de sistemas maiores."
    },
    financas: {
      gastos: "Exemplo: R$18 por dia em pequenas compras viram mais de R$500 no mês. O problema não é um gasto isolado; é o padrão invisível.",
      salario: "Exemplo: separar o salário no mesmo dia em que recebe evita que o dinheiro livre seja confundido com dinheiro de conta.",
      default: "Exemplo: uma família que anota gastos por duas semanas geralmente descobre desperdícios que pareciam pequenos demais para importar."
    },
    investimentos: {
      default: "Exemplo: investir R$100 por mês não muda tudo de uma vez, mas muda o comportamento. E comportamento consistente costuma valer mais que aporte grande sem disciplina."
    },
    trabalho: {
      default: "Exemplo: um trabalhador que registra entregas, aprende uma habilidade extra e comunica melhor seus resultados aumenta a chance de ser lembrado quando surge oportunidade."
    },
    economia: {
      dolar: "Exemplo: quando o dólar sobe, alguns produtos importados e componentes ficam mais caros. Esse custo pode chegar até coisas comuns do dia a dia.",
      inflacao: "Exemplo: se o arroz, leite, gás e transporte sobem mais que seu salário, sua inflação pessoal pode ser maior que a inflação oficial.",
      default: "Exemplo: juros altos podem deixar crédito mais caro, mas também podem mudar oportunidades em renda fixa. O mesmo dado pode ser problema ou ferramenta."
    }
  };

  return (examples[category] && (examples[category][angle] || examples[category].default)) || examples.financas.default;
}

function buildContent(categoryInput, titleInput, variant = 0) {
  const category = normalizeCategory(categoryInput);
  const title = String(titleInput || pickNewTitle(category)).trim();
  const angle = detectAngle(title, category);
  const intro = buildIntro(category, title, angle);
  const steps = buildSteps(category, angle);
  const example = buildExample(category, angle);

  const hooks = [
    "A maioria das pessoas trava porque tenta resolver tudo de uma vez. O caminho mais inteligente é começar por uma ação pequena, mensurável e possível.",
    "Esse conhecimento não muda nada sozinho. Ele começa a valer quando vira atitude, teste e repetição.",
    "O objetivo aqui não é vender ilusão. É mostrar um caminho que pode abrir possibilidade real para quem aplica com consistência.",
    "Quem procura atalhos costuma perder tempo. Quem entende o processo começa pequeno, melhora rápido e cria vantagem."
  ];

  const stepText = steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  return `${title}

${intro}

Por que isso importa agora

${hooks[variant % hooks.length]}

A dor que precisa ser resolvida

O problema não é apenas falta de informação. Muitas pessoas até sabem que precisam mudar, mas não conseguem transformar conhecimento em ação simples. É aí que mora o prejuízo: a pessoa consome conteúdo, se anima por alguns minutos e volta para o mesmo ciclo.

O caminho prático

${stepText}

Exemplo realista

${example}

O que pode dar resultado

Não existe garantia de ganho, mas existe aumento de chance quando você combina clareza, repetição e uma oferta útil. Dependendo do assunto, uma pessoa disciplinada pode transformar esse conhecimento em economia mensal, renda extra, portfólio, oportunidade de trabalho ou decisão financeira melhor.

O que evitar

- Começar grande demais.
- Comprar ferramenta antes de validar a ideia.
- Copiar outras pessoas sem adaptar para sua realidade.
- Procurar resultado rápido sem construir processo.
- Ler muito e aplicar pouco.

Como transformar isso em roteiro de vídeo

1. Comece mostrando a dor.
2. Explique o erro comum.
3. Mostre o passo a passo.
4. Dê um exemplo realista.
5. Termine com uma ação prática para hoje.

Aplicação para hoje

Escolha uma ação deste conteúdo e execute hoje. Não espere o cenário perfeito.

Conclusão

O que separa quem apenas sonha de quem começa a mudar é a execução. Pequenas ações bem repetidas criam clareza. Clareza cria decisão melhor. Decisão melhor pode abrir portas.

Como diz Provérbios 21:5, os planos bem elaborados levam à fartura, mas a pressa excessiva leva à pobreza.`;
}

module.exports = {
  categories,
  titleBanks,
  descriptions,
  normalizeText,
  normalizeCategory,
  detectCategoryFromTitle,
  titleLooksWeak,
  improveTitle,
  pickNewTitle,
  buildContent,
  slugify,
  makeSignature
};
