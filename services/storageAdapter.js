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
 * @param {string} baseDir - Diretório base opcional (default: DATA_DIR).
 * @returns {string} - Caminho absoluto seguro.
 */
function getSafeFilePath(key, baseDir = DATA_DIR) {
  // Se for um caminho relativo que tenta subir, limpa
  const safeName = key.replace(/\.\.\//g, "").replace(/\.\.\\/g, "");
  
  // Se o nome já tiver extensão, preserva. Se não, assume .json
  const hasExtension = safeName.includes(".");
  const fileName = hasExtension ? safeName : `${safeName}.json`;
  
  return path.join(baseDir, fileName);
}

/**
 * Garante que um diretório exista.
 */
function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (err) {
    console.error(`❌ [StorageAdapter] Erro ao criar diretório ${dirPath}:`, err.message);
    return false;
  }
}

/**
 * Verifica se um arquivo existe.
 */
function fileExists(key, baseDir = DATA_DIR) {
  return fs.existsSync(getSafeFilePath(key, baseDir));
}

/**
 * Lê um arquivo de texto de forma segura.
 */
function readText(key, fallback = "", baseDir = DATA_DIR) {
  const filePath = getSafeFilePath(key, baseDir);
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`⚠️ [StorageAdapter] Erro ao ler texto em ${key}:`, err.message);
    return fallback;
  }
}

/**
 * Escreve um arquivo de texto (ou Buffer) de forma segura.
 */
function writeRaw(key, content, baseDir = DATA_DIR) {
  const filePath = getSafeFilePath(key, baseDir);
  const dir = path.dirname(filePath);

  try {
    ensureDirectory(dir);
    fs.writeFileSync(filePath, content);
    return true;
  } catch (err) {
    console.error(`❌ [StorageAdapter] Erro ao escrever arquivo em ${key}:`, err.message);
    return false;
  }
}

/**
 * Lê um arquivo JSON de forma segura.
 */
function readJson(key, fallback = []) {
  const filePath = getSafeFilePath(key);

  if (!fs.existsSync(filePath)) return fallback;

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
 */
function writeJson(key, data) {
  return writeRaw(key, JSON.stringify(data, null, 2));
}

/**
 * Realiza uma atualização atômica em um objeto ou array JSON.
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
  exists: fileExists, // Alias mantido por compatibilidade
  fileExists,
  updateJson,
  readText,
  writeRaw,
  ensureDirectory,
  getSafeFilePath,
  ROOT: path.join(__dirname, ".."),
  DATA_DIR
};
