const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

/**
 * Utilitário central para persistência segura de arquivos JSON.
 * Este adapter abstrai a origem dos dados (atualmente arquivos locais)
 * permitindo uma migração futura para MongoDB/SQLite/GitHub API 
 * sem alterar a lógica dos serviços.
 */

/**
 * Resolve o caminho de um arquivo de dados de forma segura.
 * Impede path traversal (acesso a arquivos fora da pasta data).
 * @param {string} key - Nome do arquivo ou chave de dados.
 * @returns {string} - Caminho absoluto seguro.
 */
function getSafeFilePath(key) {
  // Remove extensões e limpa o nome para evitar subidas de diretório
  const safeName = path.basename(key, ".json");
  return path.join(DATA_DIR, `${safeName}.json`);
}

/**
 * Verifica se um conjunto de dados existe.
 * @param {string} key - Chave dos dados.
 * @returns {boolean}
 */
function exists(key) {
  return fs.existsSync(getSafeFilePath(key));
}

/**
 * Lê um arquivo JSON de forma segura.
 * Retorna fallback em caso de erro de parse ou arquivo inexistente.
 * 
 * Mapeamento futuro:
 * SQL: SELECT * FROM table WHERE key = ?
 * NoSQL: db.collection.find({ key })
 */
function readJson(key, fallback = []) {
  const filePath = getSafeFilePath(key);

  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) return fallback;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) || typeof parsed === "object" ? parsed : fallback;
  } catch (err) {
    console.error(`⚠️ [StorageAdapter] Erro ao ler JSON em ${key}:`, err.message);
    return fallback;
  }
}

/**
 * Escreve um arquivo JSON de forma segura.
 * 
 * Mapeamento futuro:
 * SQL: UPDATE table SET data = ?
 * NoSQL: db.collection.updateOne(...)
 */
function writeJson(key, data) {
  const filePath = getSafeFilePath(key);
  const dir = path.dirname(filePath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (err) {
    console.error(`❌ [StorageAdapter] Erro ao escrever JSON em ${key}:`, err.message);
    return false;
  }
}

/**
 * Realiza uma atualização atômica em um objeto ou array JSON.
 * Lê, aplica a transformação e salva em um único fluxo.
 * @param {string} key - Chave dos dados.
 * @param {function} updater - Função que recebe os dados atuais e retorna os novos.
 * @param {any} fallback - Valor inicial se o arquivo não existir.
 */
function updateJson(key, updater, fallback = []) {
  try {
    const currentData = readJson(key, fallback);
    const newData = updater(currentData);
    return writeJson(key, newData);
  } catch (err) {
    console.error(`❌ [StorageAdapter] Falha no updateJson em ${key}:`, err.message);
    return false;
  }
}

module.exports = {
  readJson,
  writeJson,
  exists,
  updateJson
};
