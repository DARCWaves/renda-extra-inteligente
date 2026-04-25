const fs = require("fs");
const path = require("path");
const readline = require("readline");

const FILE = path.join(__dirname, "data", "affiliate-links.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function readAffiliates() {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.log("Erro ao ler affiliate-links.json:", err.message);
    return [];
  }
}

function saveAffiliates(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function autoCategory(text) {
  const t = text.toLowerCase();

  if (t.includes("meia") || t.includes("roupa") || t.includes("moda")) {
    return "renda-extra";
  }

  if (t.includes("livro") || t.includes("educação") || t.includes("financeira")) {
    return "investimentos";
  }

  if (t.includes("furadeira") || t.includes("ferramenta") || t.includes("parafusadeira")) {
    return "trabalho";
  }

  if (t.includes("planilha") || t.includes("controle") || t.includes("finança")) {
    return "financas";
  }

  return "geral";
}

function autoTags(text) {
  const t = text.toLowerCase();
  const tags = new Set();

  const rules = {
    "meia": ["meia", "roupa", "revenda", "renda-extra"],
    "roupa": ["moda", "vestuario", "revenda"],
    "furadeira": ["ferramenta", "trabalho", "construcao", "manutencao"],
    "parafusadeira": ["ferramenta", "trabalho", "casa"],
    "livro": ["livro", "educacao", "financas"],
    "investimento": ["investimentos", "dinheiro", "educacao-financeira"],
    "planilha": ["planilha", "controle-financeiro", "financas"],
    "curso": ["curso", "renda-extra", "aprendizado"],
    "celular": ["tecnologia", "produtividade", "renda-extra"]
  };

  Object.keys(rules).forEach((key) => {
    if (t.includes(key)) {
      rules[key].forEach((tag) => tags.add(tag));
    }
  });

  if (!tags.size) {
    tags.add("geral");
    tags.add("produto");
  }

  return Array.from(tags);
}

async function addAffiliate() {
  console.log("\n💰 CADASTRAR NOVO LINK DE AFILIADO\n");

  const url = await ask("Link de afiliado: ");
  const title = await ask("Título do produto: ");
  const description = await ask("Descrição curta: ");
  const price = await ask("Preço (opcional): ");
  const image = await ask("URL da imagem (opcional): ");
  const badge = await ask("Selo (ex: 🔥 Mais vendido): ");

  const baseText = `${title} ${description} ${url}`;

  const suggestedCategory = autoCategory(baseText);
  const suggestedTags = autoTags(baseText);

  console.log("\nSugestão automática:");
  console.log("Categoria:", suggestedCategory);
  console.log("Tags:", suggestedTags.join(", "));

  const categoryInput = await ask(`Categoria [Enter para usar "${suggestedCategory}"]: `);
  const tagsInput = await ask("Tags separadas por vírgula [Enter para usar sugestão]: ");

  const category = categoryInput || suggestedCategory;
  const tags = tagsInput
    ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
    : suggestedTags;

  const list = readAffiliates();

  const affiliate = {
    id: slugify(title || "produto") + "-" + Date.now(),
    title: title || "Produto recomendado",
    description: description || "Produto selecionado para você.",
    url,
    image: image || "",
    price: price || "",
    badge: badge || "💡 Recomendado",
    category,
    tags,
    active: true,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  list.unshift(affiliate);
  saveAffiliates(list);

  console.log("\n✅ Produto salvo com sucesso!");
  console.log("ID:", affiliate.id);

  rl.close();
}

function listAffiliates() {
  const list = readAffiliates();

  if (!list.length) {
    console.log("Nenhum afiliado cadastrado.");
    rl.close();
    return;
  }

  console.log("\n📦 PRODUTOS CADASTRADOS\n");

  list.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   ID: ${item.id}`);
    console.log(`   Categoria: ${item.category}`);
    console.log(`   Tags: ${(item.tags || []).join(", ")}`);
    console.log(`   Cliques: ${item.clicks || 0}`);
    console.log(`   Ativo: ${item.active ? "sim" : "não"}`);
    console.log("");
  });

  rl.close();
}

async function toggleAffiliate() {
  const list = readAffiliates();
  const id = await ask("Digite o ID do produto: ");

  const item = list.find((p) => p.id === id);

  if (!item) {
    console.log("Produto não encontrado.");
    rl.close();
    return;
  }

  item.active = !item.active;
  saveAffiliates(list);

  console.log(`✅ Produto agora está: ${item.active ? "ATIVO" : "INATIVO"}`);
  rl.close();
}

async function removeAffiliate() {
  const list = readAffiliates();
  const id = await ask("Digite o ID do produto para remover: ");

  const newList = list.filter((p) => p.id !== id);

  if (newList.length === list.length) {
    console.log("Produto não encontrado.");
    rl.close();
    return;
  }

  saveAffiliates(newList);

  console.log("✅ Produto removido.");
  rl.close();
}

async function main() {
  const command = process.argv[2];

  if (command === "add") return addAffiliate();
  if (command === "list") return listAffiliates();
  if (command === "toggle") return toggleAffiliate();
  if (command === "remove") return removeAffiliate();

  console.log(`
🤖 BOT DE AFILIADOS

Comandos:

node bot.js add       Cadastrar novo produto
node bot.js list      Listar produtos
node bot.js toggle    Ativar/desativar produto
node bot.js remove    Remover produto
`);
  rl.close();
}

main();
