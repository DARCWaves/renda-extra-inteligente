/**
 * Configuração Global de Constantes.
 * Única fonte de verdade para categorias e regras semânticas do portal.
 */

const OFFICIAL_CATEGORIES = [
  "financas",
  "renda-extra",
  "programacao",
  "investimentos",
  "economia",
  "trabalho"
];

const CATEGORY_METADATA = {
  financas: { 
    title: "Finanças Pessoais", 
    headline: "Domine seu dinheiro", 
    description: "Aprenda a organizar suas contas e fazer o salário render mais." 
  },
  "renda-extra": { 
    title: "Renda Extra", 
    headline: "Novas fontes de lucro", 
    description: "Estratégias reais para ganhar dinheiro extra no tempo livre." 
  },
  investimentos: { 
    title: "Investimentos", 
    headline: "Cresça seu patrimônio", 
    description: "Guia para iniciantes e avançados no mundo dos investimentos." 
  },
  programacao: { 
    title: "Programação", 
    headline: "Tecnologia e Lucro", 
    description: "Aprenda a programar e monetize suas habilidades digitais." 
  },
  economia: { 
    title: "Economia", 
    headline: "Entenda o Cenário", 
    description: "O impacto dos indicadores econômicos no seu dia a dia." 
  },
  trabalho: { 
    title: "Trabalho", 
    headline: "Carreira e Eficiência", 
    description: "Como valorizar seu tempo e crescer profissionalmente." 
  }
};

module.exports = {
  OFFICIAL_CATEGORIES,
  CATEGORY_METADATA
};
