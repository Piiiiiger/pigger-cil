import { join } from "path";
import { getFsImplementation } from "../fsOperations.js";
import { readFileSync } from "../fileRead.js";
import { safeParseJSON } from "../json.js";
import { expandPath } from "../path.js";
import { getSettingsForSource } from "../settings/settings.js";
const DEFAULT_CODEX_CONFIG_DIR = "~/.codex";
const OPENAI_CODEX_PROVIDER_ID = "__codex_openai__";
const DEFAULT_CODEX_PROVIDER_NAME = "Codex";
function sanitizeOptionalString(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : void 0;
}
function mergeCodexCompatibilityLayers(layers) {
  const merged = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== "object") {
      continue;
    }
    if ("enabled" in layer && typeof layer.enabled === "boolean") {
      merged.enabled = layer.enabled;
    }
    if ("configDir" in layer) {
      merged.configDir = sanitizeOptionalString(layer.configDir) ?? merged.configDir;
    }
  }
  return merged;
}
function getCodexCompatibilitySettings() {
  const merged = mergeCodexCompatibilityLayers([
    getSettingsForSource("userSettings")?.codexCompatibility,
    getSettingsForSource("projectSettings")?.codexCompatibility,
    getSettingsForSource("localSettings")?.codexCompatibility,
    getSettingsForSource("flagSettings")?.codexCompatibility
  ]);
  if (!("enabled" in merged) && !merged.configDir) {
    return null;
  }
  return {
    enabled: merged.enabled === true,
    ...merged.configDir ? { configDir: merged.configDir } : {}
  };
}
function getCodexCompatibilityConfigDir() {
  const settings = getCodexCompatibilitySettings();
  return expandPath(settings?.configDir ?? DEFAULT_CODEX_CONFIG_DIR);
}
function stripTomlComment(line) {
  let result = "";
  let quote = null;
  let escaped = false;
  for (const char of line) {
    if (quote) {
      result += char;
      if (quote === '"' && char === "\\" && !escaped) {
        escaped = true;
        continue;
      }
      if (char === quote && !escaped) {
        quote = null;
      }
      escaped = false;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      continue;
    }
    if (char === "#") {
      break;
    }
    result += char;
  }
  return result;
}
function findUnquotedCharacter(line, target) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote) {
      if (quote === '"' && char === "\\" && !escaped) {
        escaped = true;
        continue;
      }
      if (char === quote && !escaped) {
        quote = null;
      }
      escaped = false;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === target) {
      return index;
    }
  }
  return -1;
}
function parseTomlPath(pathText) {
  const segments = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const char of pathText.trim()) {
    if (quote) {
      if (quote === '"' && char === "\\" && !escaped) {
        escaped = true;
        continue;
      }
      if (char === quote && !escaped) {
        quote = null;
        continue;
      }
      current += char;
      escaped = false;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ".") {
      if (current.trim()) {
        segments.push(current.trim());
      }
      current = "";
      continue;
    }
    current += char;
  }
  if (quote) {
    return null;
  }
  if (current.trim()) {
    segments.push(current.trim());
  }
  return segments.length > 0 ? segments : null;
}
function parseTomlValue(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (/^[+-]?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}
function setNestedValue(target, path, value) {
  let current = target;
  for (let index = 0; index < path.length - 1; index++) {
    const key = path[index];
    const existing = current[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
}
function parseCodexConfigToml(content) {
  const parsed = {};
  let currentPath = [];
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const rawLine = lines[lineNumber];
    const line = stripTomlComment(rawLine).trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) {
      const path = parseTomlPath(line.slice(1, -1));
      if (!path) {
        return {
          error: `Codex config.toml has an invalid table header on line ${lineNumber + 1}.`
        };
      }
      currentPath = path;
      continue;
    }
    const separator = findUnquotedCharacter(line, "=");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key) {
      continue;
    }
    setNestedValue(parsed, [...currentPath, key], parseTomlValue(value));
  }
  const providerId = sanitizeOptionalString(parsed.model_provider);
  const model = sanitizeOptionalString(parsed.model);
  const reasoningEffort = sanitizeOptionalString(parsed.model_reasoning_effort);
  const disableResponseStorage = parsed.disable_response_storage === true;
  if (!providerId) {
    return { error: "Codex config.toml is missing model_provider." };
  }
  if (!model) {
    return { error: "Codex config.toml is missing model." };
  }
  const providerSection = parsed.model_providers?.[providerId];
  if (!providerSection || typeof providerSection !== "object" || Array.isArray(providerSection)) {
    return {
      error: `Codex config.toml does not define [model_providers.${providerId}].`
    };
  }
  const baseUrl = sanitizeOptionalString(providerSection.base_url);
  if (!baseUrl) {
    return {
      error: `Codex provider '${providerId}' is missing base_url.`
    };
  }
  const wireApi = sanitizeOptionalString(providerSection.wire_api) ?? "chat_completions";
  if (wireApi !== "chat_completions" && wireApi !== "responses") {
    return {
      error: `Codex provider '${providerId}' uses unsupported wire_api '${wireApi}'.`
    };
  }
  const rawName = sanitizeOptionalString(providerSection.name) ?? providerId;
  return {
    value: {
      providerId,
      name: rawName.toLowerCase() === "codex" ? DEFAULT_CODEX_PROVIDER_NAME : rawName,
      baseUrl,
      wireApi,
      model,
      reasoningEffort,
      disableResponseStorage,
      requiresOpenAIAuth: providerSection.requires_openai_auth === true
    }
  };
}
function getFileMtimeMs(filePath) {
  try {
    return getFsImplementation().statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}
function readOptionalFile(filePath) {
  try {
    return readFileSync(filePath);
  } catch {
    return null;
  }
}
let cachedStatus = null;
let cachedKey = null;
function getCodexCompatibilityStatus() {
  const settings = getCodexCompatibilitySettings();
  const configDir = getCodexCompatibilityConfigDir();
  if (!settings?.enabled) {
    return {
      enabled: false,
      configDir,
      available: false
    };
  }
  const authPath = join(configDir, "auth.json");
  const configPath = join(configDir, "config.toml");
  const cacheKey = [
    "enabled",
    configDir,
    getFileMtimeMs(authPath) ?? "missing-auth",
    getFileMtimeMs(configPath) ?? "missing-config"
  ].join("|");
  if (cachedKey === cacheKey && cachedStatus) {
    return cachedStatus;
  }
  const nextStatus = {
    enabled: true,
    configDir,
    authPath,
    configPath,
    available: false
  };
  const configContent = readOptionalFile(configPath);
  if (!configContent) {
    nextStatus.error = `Codex compatibility is enabled but ${configPath} was not found.`;
    cachedKey = cacheKey;
    cachedStatus = nextStatus;
    return nextStatus;
  }
  const parsedToml = parseCodexConfigToml(configContent);
  if ("error" in parsedToml) {
    nextStatus.error = parsedToml.error;
    cachedKey = cacheKey;
    cachedStatus = nextStatus;
    return nextStatus;
  }
  let apiKey;
  const authContent = readOptionalFile(authPath);
  if (authContent) {
    const parsedAuth = safeParseJSON(authContent, false);
    if (!parsedAuth || typeof parsedAuth !== "object") {
      nextStatus.warning = `Codex auth.json at ${authPath} is not valid JSON.`;
    } else {
      apiKey = sanitizeOptionalString(parsedAuth.OPENAI_API_KEY);
    }
  }
  nextStatus.available = true;
  nextStatus.providerId = parsedToml.value.providerId;
  nextStatus.model = parsedToml.value.model;
  nextStatus.reasoningEffort = parsedToml.value.reasoningEffort;
  nextStatus.disableResponseStorage = parsedToml.value.disableResponseStorage;
  if (parsedToml.value.requiresOpenAIAuth && !apiKey && !nextStatus.warning) {
    nextStatus.warning = `Codex provider '${parsedToml.value.providerId}' requires OPENAI_API_KEY, but ${authPath} did not provide one.`;
  }
  nextStatus.openaiConfig = {
    providerId: OPENAI_CODEX_PROVIDER_ID,
    name: parsedToml.value.name,
    baseUrl: parsedToml.value.baseUrl,
    apiKey,
    model: parsedToml.value.model,
    models: [parsedToml.value.model],
    wireApi: parsedToml.value.wireApi,
    requiresOpenAIAuth: parsedToml.value.requiresOpenAIAuth,
    reasoningEffort: parsedToml.value.reasoningEffort,
    disableResponseStorage: parsedToml.value.disableResponseStorage,
    configDir
  };
  cachedKey = cacheKey;
  cachedStatus = nextStatus;
  return nextStatus;
}
export {
  DEFAULT_CODEX_CONFIG_DIR,
  DEFAULT_CODEX_PROVIDER_NAME,
  OPENAI_CODEX_PROVIDER_ID,
  getCodexCompatibilityConfigDir,
  getCodexCompatibilitySettings,
  getCodexCompatibilityStatus
};
