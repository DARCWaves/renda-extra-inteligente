const crypto = require("crypto");

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function slugify(text) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function detectCategory(title) {
  const t = normalize(title);

  if (t.includes("program") || t.includes("codigo") || t.includes("site")) return "programacao";
  if (t.includes("renda") || t.includes("ganhar dinheiro") || t.includes("vender")) return "renda-extra";
  if (t.includes("invest")) return "investimentos";
  if (t.includes("trabalho") || t.includes("emprego")) return "trabalho";
  if (t.includes("dolar") || t.includes("inflacao") || t.includes("selic")) return "economia";

  return "financas";
}

function generateTitle(category) {
  const base = {
    financas: [
      "Como organizar seu dinheiro mesmo ganhando pouco",
      "O erro que faz seu salário sumir antes do fim do mês",
      "Como sair do aperto financeiro com passos simples"
    ],
    programacao: [
      "Como aprender programação do zero sem travar",
      "Como criar seu primeiro site mesmo sendo iniciante",
      "Lógica de programação explicada de forma simples"
    ],
    "renda-extra": [
      "Como fazer renda extra sem depender de sorte",
      "5 formas reais de ganhar dinheiro usando o celular",
      "Como começar renda extra mesmo com pouco dinheiro"
    ],
    investimentos: [
      "Como começar a investir com pouco dinheiro",
      "Investimentos para iniciantes sem complicação",
      "Como investir com segurança mesmo sendo iniciante"
    ]
  };

  const list = base[category] || base.financas;
  return list[Math.floor(Math.random() * list.length)];
}

function generateContent(category, title) {
  return `
${title}

Se você chegou até aqui, provavelmente já percebeu que existe algo errado na forma como a maioria das pessoas lida com isso.

A verdade é simples: o problema não é falta de capacidade, é falta de direção clara.

Neste conteúdo, você vai entender de forma prática como isso funciona e como aplicar no seu dia a dia.

Por onde começar

O primeiro passo é parar de complicar.

- Entenda o básico antes de avançar
- Foque em uma coisa por vez
- Evite tentar fazer tudo ao mesmo tempo

Aplicação prática

Pegue um pequeno exemplo do seu dia a dia e aplique o que foi explicado aqui.

Isso pode parecer simples, mas é exatamente isso que diferencia quem entende de quem só consome conteúdo.

Erro comum

A maioria das pessoas desiste rápido porque quer resultado imediato.

Mas a realidade é que consistência sempre vence intensidade.

O que pode acontecer

Dependendo da forma como você aplicar isso, é possível melhorar sua situação de forma progressiva.

Não é sobre milagre, é sobre processo.

Conclusão

Quem evolui não é quem sabe mais, é quem aplica melhor.

Como está escrito em Provérbios 16:3:
"Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."
`;
}

function signature(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

module.exports = {
  slugify,
  detectCategory,
  generateTitle,
  generateContent,
  signature
};
