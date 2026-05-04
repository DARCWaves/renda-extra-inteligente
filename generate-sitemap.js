const fs = require("fs");

const posts = require("./data/posts.json");

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

sitemap += `<url><loc>https://renda-extra-inteligente.onrender.com/</loc></url>\n`;
sitemap += `<url><loc>https://renda-extra-inteligente.onrender.com/posts</loc></url>\n`;
sitemap += `<url><loc>https://renda-extra-inteligente.onrender.com/ofertas</loc></url>\n`;

posts.forEach(post => {
  sitemap += `<url><loc>https://renda-extra-inteligente.onrender.com/post/${post.slug}</loc></url>\n`;
});

sitemap += `</urlset>`;

fs.writeFileSync("public/sitemap.xml", sitemap);

console.log("✅ Sitemap gerado");
