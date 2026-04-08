import {
  getClaudeCompatibilitySettingsFromLayers,
  getLegacyClaudeConfigDir,
  getLegacyClaudeGlobalFile,
  getLegacyClaudeSettingsFilePaths,
  pathExists
} from "../claudeCompatibility.js";
import { getSettingsForSource } from "../settings/settings.js";
function getClaudeCompatibilitySettings() {
  return getClaudeCompatibilitySettingsFromLayers([
    getSettingsForSource("userSettings")?.claudeCompatibility,
    getSettingsForSource("projectSettings")?.claudeCompatibility,
    getSettingsForSource("localSettings")?.claudeCompatibility,
    getSettingsForSource("flagSettings")?.claudeCompatibility,
    getSettingsForSource("policySettings")?.claudeCompatibility
  ]);
}
function getClaudeCompatibilityStatus() {
  const settings = getClaudeCompatibilitySettings();
  const configDir = getLegacyClaudeConfigDir(settings?.configDir);
  const settingsFiles = getLegacyClaudeSettingsFilePaths(settings?.configDir);
  const globalFile = getLegacyClaudeGlobalFile();
  const hasSettingsFiles = settingsFiles.some(pathExists);
  const hasGlobalFile = pathExists(globalFile);
  const enabled = settings?.enabled === true;
  const available = hasSettingsFiles || hasGlobalFile;
  const nextStatus = {
    enabled,
    available,
    configDir,
    settingsFiles,
    globalFile,
    hasSettingsFiles,
    hasGlobalFile
  };
  if (enabled && !available) {
    nextStatus.warning = `Claude compatibility is enabled but no legacy Claude config was found in ${configDir}.`;
  }
  return nextStatus;
}
export {
  getClaudeCompatibilitySettings,
  getClaudeCompatibilityStatus
};
