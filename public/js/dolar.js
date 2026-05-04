setInterval(async () => {
  try {
    const res = await fetch("/api/dolar");
    const data = await res.json();

    const el = document.querySelector("#dolar-valor");

    if (el && data.formatado) {
      el.innerText = data.formatado;
    }
  } catch (err) {
    console.log("Erro ao atualizar dólar");
  }
}, 10000);
