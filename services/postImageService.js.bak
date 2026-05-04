const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "public", "images", "posts");

function ensureDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function slugify(text) {
  return String(text || "post")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function escapeXml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitTitle(title) {
  const words = String(title || "").split(" ");
  const lines = [];
  let current = "";

  words.forEach(word => {
    if ((current + " " + word).trim().length > 34 && lines.length < 3) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current && lines.length < 4) lines.push(current.trim());

  return lines.slice(0, 4);
}

function categoryLabel(category) {
  const map = {
    "renda-extra": "RENDA EXTRA",
    "programacao": "PROGRAMAÇÃO",
    "financas": "FINANÇAS",
    "trabalho": "TRABALHO",
    "investimentos": "INVESTIMENTOS",
    "economia": "ECONOMIA"
  };

  return map[category] || "CONTEÚDO";
}

function categoryPain(category) {
  const map = {
    "renda-extra": "PARE DE DEPENDER DE UMA ÚNICA RENDA",
    "programacao": "ENTENDA A LÓGICA ANTES DO CÓDIGO",
    "financas": "DESCUBRA PARA ONDE SEU DINHEIRO ESTÁ INDO",
    "trabalho": "TRANSFORME ESFORÇO EM VALOR",
    "investimentos": "COMECE PEQUENO, MAS COM CLAREZA",
    "economia": "ENTENDA O QUE ENCARECE SUA VIDA"
  };

  return map[category] || "APRENDA E APLIQUE HOJE";
}

function makePostImage(post) {
  ensureDir();

  const title = post.title || "Conteúdo prático";
  const category = post.category || "financas";
  const fileName = `${slugify(post.slug || title)}.svg`;
  const filePath = path.join(outputDir, fileName);
  const publicPath = `/images/posts/${fileName}`;

  const lines = splitTitle(title);
  const label = categoryLabel(category);
  const pain = categoryPain(category);

  const lineSvg = lines.map((line, index) => {
    return `<text x="70" y="${250 + index * 58}" class="title">${escapeXml(line)}</text>`;
  }).join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="45%" stop-color="#0d0d10"/>
      <stop offset="100%" stop-color="#15110a"/>
    </linearGradient>

    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f2d27a"/>
      <stop offset="100%" stop-color="#d6b35a"/>
    </linearGradient>

    <filter id="blur">
      <feGaussianBlur stdDeviation="40"/>
    </filter>

    <style>
      .label { font: 800 28px Arial, sans-serif; letter-spacing: 7px; fill: #f2d27a; }
      .title { font: 900 52px Arial, sans-serif; fill: #ffffff; letter-spacing: -2px; }
      .pain { font: 800 22px Arial, sans-serif; letter-spacing: 3px; fill: #d8d8d8; }
      .brand { font: 800 24px Arial, sans-serif; letter-spacing: 4px; fill: #d6b35a; }
      .small { font: 600 20px Arial, sans-serif; fill: #9d9d9d; }
    </style>
  </defs>

  <rect width="1200" height="675" fill="url(#bg)"/>

  <circle cx="150" cy="80" r="190" fill="#d6b35a" opacity="0.18" filter="url(#blur)"/>
  <circle cx="1040" cy="590" r="230" fill="#f2d27a" opacity="0.10" filter="url(#blur)"/>

  <rect x="44" y="42" width="1112" height="591" rx="38" fill="rgba(255,255,255,0.035)" stroke="rgba(214,179,90,0.35)" stroke-width="2"/>

  <text x="70" y="118" class="label">${escapeXml(label)}</text>

  <text x="70" y="176" class="pain">${escapeXml(pain)}</text>

  ${lineSvg}

  <rect x="70" y="548" width="390" height="54" rx="27" fill="url(#gold)"/>
  <text x="100" y="584" style="font:900 22px Arial,sans-serif; fill:#080808;">Leia e aplique hoje →</text>

  <text x="790" y="580" class="brand">RENDA EXTRA</text>
  <text x="790" y="610" class="small">INTELIGENTE</text>

  <path d="M940 160 C1010 230 1055 300 1070 390" stroke="#d6b35a" stroke-width="6" opacity="0.55" stroke-linecap="round"/>
  <path d="M985 158 L940 160 L942 205" stroke="#d6b35a" stroke-width="6" opacity="0.55" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  fs.writeFileSync(filePath, svg, "utf8");

  return {
    image: publicPath,
    imageAlt: `${title} - ${label.toLowerCase()} com solução prática`
  };
}

module.exports = {
  makePostImage
};
