const { runPatchCycle } = require("../services/patchApplicationService");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  const limit = parseInt(process.argv[2]) || 1;
  
  console.log(`\n🚀 INICIANDO CICLO DE APLICAÇÃO DE PATCHES (Limite: ${limit})`);
  
  // 1. Snapshot de segurança
  const postsPath = path.join(__dirname, "..", "data", "posts.json");
  const backupPath = `${postsPath}.bak-patch-${Date.now()}`;
  
  try {
    fs.copyFileSync(postsPath, backupPath);
    console.log(`✅ Snapshot de segurança criado: ${path.basename(backupPath)}`);
  } catch (err) {
    console.error("❌ Falha ao criar snapshot. Abortando.");
    process.exit(1);
  }

  // 2. Executa aplicação
  const result = await runPatchCycle(limit);

  if (!result.ok) {
    console.log(`⚠️  ${result.message}`);
    process.exit(0);
  }

  console.log(`✅ ${result.appliedCount} patches aplicados com sucesso.`);

  // 3. Validação via Guardian
  console.log("\n🔍 Disparando validação pós-patch (Site Guardian)...");
  try {
    const guardianOutput = execSync("node scripts/site-guardian.js", { encoding: "utf8" });
    console.log(guardianOutput);
  } catch (err) {
    console.error("❌ [CRÍTICO] Falha na validação do Guardian após aplicação!");
    console.log("Revertendo snapshot...");
    fs.copyFileSync(backupPath, postsPath);
    console.log("✅ Snapshot restaurado. Site íntegro.");
    process.exit(1);
  }

  console.log("\n🎉 Ciclo concluído com sucesso.");
}

main().catch(err => {
  console.error("🔥 Erro inesperado:", err);
  process.exit(1);
});
