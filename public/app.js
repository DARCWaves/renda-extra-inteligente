(function () {
  async function fetchLiveIndicators() {
    try {
      const response = await fetch("/api/indicadores-live-v2", {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) return;

      const json = await response.json();

      if (!json.ok || !json.indicators || !Array.isArray(json.indicators.resumo)) return;

      json.indicators.resumo.forEach((item) => {
        document.querySelectorAll(`[data-indicator-value="${item.slug}"]`).forEach((el) => {
          el.textContent = item.valor || "Atualizando...";
        });

        document.querySelectorAll(`[data-indicator-period="${item.slug}"]`).forEach((el) => {
          el.textContent = item.periodo || "Atualizado automaticamente";
        });
      });

      document.querySelectorAll("[data-live-updated]").forEach((el) => {
        el.textContent = json.updatedAtLabel
          ? `Atualizado às ${json.updatedAtLabel}`
          : "Atualizado automaticamente";
      });
    } catch (error) {
      console.log("Indicadores ao vivo indisponíveis:", error.message);
    }
  }

  fetchLiveIndicators();
  setInterval(fetchLiveIndicators, 60000);

  // Analytics Clicks (Privativo e Leve)
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    let type = null;
    let id = "";

    if (href.startsWith("/out/")) {
      type = "click";
      id = href.replace("/out/", "").split("?")[0];
    } else if (href.startsWith("/categoria/")) {
      type = "internal";
      id = "cat:" + href.replace("/categoria/", "");
    } else if (href.startsWith("/sobre") || href.startsWith("/contato")) {
      type = "internal";
      id = href.replace("/", "");
    }

    if (type) {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
        keepalive: true
      }).catch(() => {});
    }
  });
})();
