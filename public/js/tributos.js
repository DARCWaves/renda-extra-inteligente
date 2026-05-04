console.log("🔥 TRIBUTOS JS CARREGADO");
async function atualizarTributos() {
  try {
    const res = await fetch("/api/tributos");
    const json = await res.json();

    const el = document.querySelector("#tributos-valor");

    if (el && json.ok && json.data && json.data.formatado) {
      el.innerText = json.data.formatado;
    }
  } catch (err) {
    console.log("Erro ao atualizar tributos");
  }
}

atualizarTributos();
setInterval(atualizarTributos, 10000);
