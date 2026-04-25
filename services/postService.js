const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function defaultPosts() {
  return [
    {
      slug: "como-melhorar-sua-renda-extra-sem-complicacao",
      title: "Como melhorar sua renda extra sem complicação",
      description: "Aprenda formas simples e realistas de começar uma renda extra com organização e estratégia.",
      content: `
        Renda extra não é promessa mágica. É organização, consistência e escolha inteligente.
        Uma pessoa pode começar vendendo produtos, prestando serviços simples, criando conteúdo,
        revendendo itens úteis ou usando habilidades que já possui.

        O ponto principal é começar pequeno, medir resultado e melhorar com o tempo.
        Antes de investir dinheiro, entenda o público, o produto e o canal de venda.
      `,
      category: "renda-extra",
      seoTitle: "Como melhorar sua renda extra sem complicação",
      seoDescription: "Guia simples sobre renda extra, ideias práticas e organização financeira.",
      createdAt: new Date().toISOString()
    },
    {
      slug: "como-melhorar-sua-vida-financeira-com-investimentos-para-iniciantes",
      title: "Como melhorar sua vida financeira com investimentos para iniciantes",
      description: "Entenda como começar a investir com pouco dinheiro, sem promessas e com consciência de risco.",
      content: `
        Investir não é apostar. Investir é organizar o dinheiro para que ele trabalhe com mais eficiência.
        Para iniciantes, o mais importante é montar reserva de emergência, entender renda fixa,
        conhecer riscos e nunca colocar dinheiro em algo que não entende.

        Este conteúdo é educativo e não representa recomendação de investimento.
      `,
      category: "investimentos",
      seoTitle: "Investimentos para iniciantes com pouco dinheiro",
      seoDescription: "Aprenda noções básicas de investimentos, diversificação e educação financeira.",
      createdAt: new Date().toISOString()
    },
    {
      slug: "profissoes-com-alta-demanda-e-oportunidades-de-trabalho",
      title: "Profissões com alta demanda e oportunidades de trabalho",
      description: "Veja áreas que podem ter boa procura e entenda como analisar oportunidades de trabalho.",
      content: `
        O mercado de trabalho muda rápido. Áreas ligadas a tecnologia, vendas, serviços,
        logística, atendimento, manutenção, beleza, produção de conteúdo e economia digital
        podem gerar oportunidades para quem aprende rápido e executa bem.

        O segredo é observar demanda, estudar o básico e criar um plano de ação.
      `,
      category: "trabalho",
      seoTitle: "Profissões com alta demanda e oportunidades de trabalho",
      seoDescription: "Conteúdo educativo sobre mercado de trabalho, oportunidades e renda.",
      createdAt: new Date().toISOString()
    },
    {
      slug: "economia-do-dia-a-dia-como-os-indicadores-afetam-seu-bolso",
      title: "Economia do dia a dia: como os indicadores afetam seu bolso",
      description: "Entenda de forma simples como dólar, inflação e Selic afetam sua vida financeira.",
      content: `
        Economia parece distante, mas afeta tudo: comida, transporte, aluguel, crédito,
        compras, investimentos e renda. Quando o dólar sobe, alguns produtos ficam mais caros.
        Quando a inflação aumenta, o dinheiro compra menos. Quando a Selic muda,
        crédito e investimentos também são afetados.
      `,
      category: "economia",
      seoTitle: "Como os indicadores econômicos afetam seu bolso",
      seoDescription: "Entenda dólar, inflação, Selic e economia real em linguagem simples.",
      createdAt: new Date().toISOString()
    },
    {
      slug: "controle-financeiro-pessoal-para-comecar-hoje",
      title: "Controle financeiro pessoal para começar hoje",
      description: "Organize gastos, renda, dívidas e prioridades com uma estratégia simples.",
      content: `
        Controle financeiro começa com clareza. Anote quanto entra, quanto sai,
        quais contas são obrigatórias e quais gastos podem ser reduzidos.
        Quem controla o dinheiro para de ser controlado por ele.
      `,
      category: "financas",
      seoTitle: "Controle financeiro pessoal simples",
      seoDescription: "Aprenda a organizar dinheiro, gastos, renda e dívidas de forma prática.",
      createdAt: new Date().toISOString()
    }
  ];
}

function ensurePostsFile() {
  ensureDataDir();

  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(defaultPosts(), null, 2), "utf8");
    return;
  }

  try {
    const raw = fs.readFileSync(POSTS_FILE, "utf8");
    const parsed = raw.trim() ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(POSTS_FILE, JSON.stringify(defaultPosts(), null, 2), "utf8");
    }
  } catch {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(defaultPosts(), null, 2), "utf8");
  }
}

function readPosts() {
  ensurePostsFile();

  try {
    const raw = fs.readFileSync(POSTS_FILE, "utf8");
    const posts = raw.trim() ? JSON.parse(raw) : [];

    if (!Array.isArray(posts)) return [];

    return posts
      .filter(Boolean)
      .map((post) => ({
        slug: post.slug || slugify(post.title || `post-${Date.now()}`),
        title: post.title || "Conteúdo sem título",
        description: post.description || post.seoDescription || "Conteúdo educativo.",
        content: post.content || "",
        category: normalizeCategory(post.category || "financas"),
        seoTitle: post.seoTitle || post.title || "Conteúdo",
        seoDescription: post.seoDescription || post.description || "Conteúdo educativo.",
        createdAt: post.createdAt || new Date().toISOString(),
        ...post
      }));
  } catch (err) {
    console.error("ERRO AO LER POSTS:", err.message);
    return defaultPosts();
  }
}

function writePosts(posts) {
  ensureDataDir();

  const cleanPosts = Array.isArray(posts) ? posts.filter(Boolean) : [];

  fs.writeFileSync(POSTS_FILE, JSON.stringify(cleanPosts, null, 2), "utf8");
}

function normalizeCategory(category) {
  const value = String(category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const map = {
    financas: "financas",
    "finanças": "financas",
    investimentos: "investimentos",
    investimento: "investimentos",
    "renda-extra": "renda-extra",
    renda: "renda-extra",
    rendaextra: "renda-extra",
    trabalho: "trabalho",
    empregos: "trabalho",
    emprego: "trabalho",
    economia: "economia",
    noticias: "noticias",
    notícia: "noticias",
    noticias_financeiras: "noticias"
  };

  return map[value] || value || "financas";
}

function getAllPosts() {
  return readPosts().sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function getLatestPosts(limit = 6) {
  return getAllPosts().slice(0, Number(limit) || 6);
}

function getPostBySlug(slug) {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
}

function getPostsByCategory(category) {
  const normalized = normalizeCategory(category);

  return getAllPosts().filter((post) => {
    return normalizeCategory(post.category) === normalized;
  });
}

function savePost(post) {
  if (!post || typeof post !== "object") {
    throw new Error("Post inválido.");
  }

  const posts = getAllPosts();

  const title = post.title || "Conteúdo automático";
  const slug = post.slug || slugify(`${title}-${Date.now()}`);

  const newPost = {
    slug,
    title,
    description: post.description || post.seoDescription || "Conteúdo educativo.",
    content: post.content || "",
    category: normalizeCategory(post.category || "financas"),
    seoTitle: post.seoTitle || title,
    seoDescription: post.seoDescription || post.description || "Conteúdo educativo.",
    createdAt: post.createdAt || new Date().toISOString(),
    ...post,
    slug
  };

  const exists = posts.some((item) => item.slug === newPost.slug);

  if (exists) {
    const updated = posts.map((item) => {
      if (item.slug === newPost.slug) return { ...item, ...newPost };
      return item;
    });

    writePosts(updated);
    return newPost;
  }

  posts.unshift(newPost);
  writePosts(posts);

  return newPost;
}

function deletePost(slug) {
  const posts = getAllPosts();
  const filtered = posts.filter((post) => post.slug !== slug);
  writePosts(filtered);
  return filtered.length !== posts.length;
}

function countPostsByCategory() {
  const posts = getAllPosts();

  return posts.reduce((acc, post) => {
    const category = normalizeCategory(post.category);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

module.exports = {
  getAllPosts,
  getLatestPosts,
  getPostBySlug,
  getPostsByCategory,
  savePost,
  deletePost,
  countPostsByCategory,
  normalizeCategory
};
