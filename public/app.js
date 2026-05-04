(function () {
  async function fetchLiveIndicators() {
    try {
      const response = await fetch("/api/indicadores-live", {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) return;

      const json = await response.json();
      if (!json.ok || !json.indicators || !Array.isArray(json.indicators.resumo)) return;

      json.indicators.resumo.forEach((item) => {
        const valueElements = document.querySelectorAll(`[data-indicator-value="${item.slug}"]`);
        valueElements.forEach((el) => {
          el.textContent = item.valor || "Atualizando...";
        });

        const periodElements = document.querySelectorAll(`[data-indicator-period="${item.slug}"]`);
        periodElements.forEach((el) => {
          el.textContent = item.periodo || "Atualizado automaticamente";
        });
      });

      const updatedElements = document.querySelectorAll("[data-live-updated]");
      updatedElements.forEach((el) => {
        el.textContent = json.updatedAtLabel || "Atualizado agora";
      });
    } catch (error) {
      console.log("Indicadores ao vivo indisponíveis:", error.message);
    }
  }

  fetchLiveIndicators();
  setInterval(fetchLiveIndicators, 60000);
})();
