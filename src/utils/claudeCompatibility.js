import { getUseCoworkPlugins } from "../bootstrap/state.js";
import { homedir } from "os";
import { join, resolve } from "path";
import { getClaudeConfigHomeDir, isEnvTruthy } from "./envUtils.js";
import { getFsImplementation } from "./fsOperations.js";
import { safeParseJSON } from "./json.js";
import { stripBOM } from "./jsonRead.js";
import { expandPath } from "./path.js";
const DEFAULT_LEGACY_CLAUDE_CONFIG_DIR = join(homedir(), ".claude");
function sanitizeOptionalString(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : void 0;
}
function mergeClaudeCompatibilityLayers(layers) {
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
function getClaudeCompatibilitySettingsFromLayers(layers) {
  const merged = mergeClaudeCompatibilityLayers(layers);
  if (!("enabled" in merged) && !merged.configDir) {
    return null;
  }
  return {
    enabled: merged.enabled === true,
    ...merged.configDir ? { configDir: merged.configDir } : {}
  };
}
function getLegacyClaudeConfigDir(configDir) {
  return expandPath(configDir ?? DEFAULT_LEGACY_CLAUDE_CONFIG_DIR);
}
function getLegacyClaudeGlobalFile() {
  return join(homedir(), ".claude.json");
}
function getLegacyClaudeSettingsFilePaths(configDir) {
  const resolvedConfigDir = getLegacyClaudeConfigDir(configDir);
  return [
    join(resolvedConfigDir, "settings.json"),
    join(resolvedConfigDir, "settings.local.json")
  ];
}
function getPrimaryPiggerUserSettingsFile() {
  return join(
    getClaudeConfigHomeDir(),
    getUseCoworkPlugins() || isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS) ? "cowork_settings.json" : "settings.json"
  );
}
function isClaudeCompatibilityEnabledInPrimarySettings() {
  try {
    const content = getFsImplementation().readFileSync(
      getPrimaryPiggerUserSettingsFile(),
      { encoding: "utf8" }
    );
    const parsed = safeParseJSON(stripBOM(content), false);
    return !!(parsed && typeof parsed === "object" && parsed.claudeCompatibility?.enabled === true);
  } catch {
    return false;
  }
}
function pathExists(filePath) {
  try {
    return getFsImplementation().existsSync(filePath);
  } catch {
    return false;
  }
}
function isLegacyClaudeConfigDir(path) {
  try {
    return resolve(path) === resolve(getLegacyClaudeConfigDir());
  } catch {
    return false;
  }
}
export {
  getClaudeCompatibilitySettingsFromLayers,
  getLegacyClaudeConfigDir,
  getLegacyClaudeGlobalFile,
  getLegacyClaudeSettingsFilePaths,
  isClaudeCompatibilityEnabledInPrimarySettings,
  isLegacyClaudeConfigDir,
  mergeClaudeCompatibilityLayers,
  pathExists
};
