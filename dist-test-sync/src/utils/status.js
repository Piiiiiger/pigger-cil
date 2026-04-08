import { jsxs } from "react/jsx-runtime";
import chalk from "chalk";
import figures from "figures";
import { color, Text } from "../ink.js";
import { getAccountInformation, isClaudeAISubscriber } from "./auth.js";
import { getLargeMemoryFiles, getMemoryFiles, MAX_MEMORY_CHARACTER_COUNT } from "./claudemd.js";
import { getDoctorDiagnostic } from "./doctorDiagnostic.js";
import { getAWSRegion, getClaudeConfigHomeDir, getDefaultVertexRegion, isEnvTruthy } from "./envUtils.js";
import { getDisplayPath } from "./file.js";
import { formatNumber } from "./format.js";
import { getIdeClientName, isJetBrainsIde, toIDEDisplayName } from "./ide.js";
import { getClaudeAiUserDefaultModelDescription, modelDisplayString } from "./model/model.js";
import { getActiveInferenceProviderConfig } from "./model/customProviders.js";
import { getClaudeCompatibilityStatus } from "./model/claudeCompatibility.js";
import { getCodexCompatibilityStatus } from "./model/codexCompatibility.js";
import { getAPIProvider } from "./model/providers.js";
import { getMTLSConfig } from "./mtls.js";
import { checkInstall } from "./nativeInstaller/index.js";
import { getProxyUrl } from "./proxy.js";
import { SandboxManager } from "./sandbox/sandbox-adapter.js";
import { getSettingsWithAllErrors } from "./settings/allErrors.js";
import { getEnabledSettingSources, getSettingSourceDisplayNameCapitalized } from "./settings/constants.js";
import { getManagedFileSettingsPresence, getPolicySettingsOrigin, getSettingsForSource } from "./settings/settings.js";
function buildSandboxProperties() {
  if (true) {
    return [];
  }
  const isSandboxed = SandboxManager.isSandboxingEnabled();
  return [{
    label: "Bash Sandbox",
    value: isSandboxed ? "Enabled" : "Disabled"
  }];
}
function buildIDEProperties(mcpClients, ideInstallationStatus = null, theme) {
  const ideClient = mcpClients?.find((client) => client.name === "ide");
  if (ideInstallationStatus) {
    const ideName = toIDEDisplayName(ideInstallationStatus.ideType);
    const pluginOrExtension = isJetBrainsIde(ideInstallationStatus.ideType) ? "plugin" : "extension";
    if (ideInstallationStatus.error) {
      return [{
        label: "IDE",
        value: /* @__PURE__ */ jsxs(Text, { children: [
          color("error", theme)(figures.cross),
          " Error installing ",
          ideName,
          " ",
          pluginOrExtension,
          ": ",
          ideInstallationStatus.error,
          "\n",
          "Please restart your IDE and try again."
        ] })
      }];
    }
    if (ideInstallationStatus.installed) {
      if (ideClient && ideClient.type === "connected") {
        if (ideInstallationStatus.installedVersion !== ideClient.serverInfo?.version) {
          return [{
            label: "IDE",
            value: `Connected to ${ideName} ${pluginOrExtension} version ${ideInstallationStatus.installedVersion} (server version: ${ideClient.serverInfo?.version})`
          }];
        } else {
          return [{
            label: "IDE",
            value: `Connected to ${ideName} ${pluginOrExtension} version ${ideInstallationStatus.installedVersion}`
          }];
        }
      } else {
        return [{
          label: "IDE",
          value: `Installed ${ideName} ${pluginOrExtension}`
        }];
      }
    }
  } else if (ideClient) {
    const ideName = getIdeClientName(ideClient) ?? "IDE";
    if (ideClient.type === "connected") {
      return [{
        label: "IDE",
        value: `Connected to ${ideName} extension`
      }];
    } else {
      return [{
        label: "IDE",
        value: `${color("error", theme)(figures.cross)} Not connected to ${ideName}`
      }];
    }
  }
  return [];
}
function buildMcpProperties(clients = [], theme) {
  const servers = clients.filter((client) => client.name !== "ide");
  if (!servers.length) {
    return [];
  }
  const byState = {
    connected: 0,
    pending: 0,
    needsAuth: 0,
    failed: 0
  };
  for (const s of servers) {
    if (s.type === "connected") byState.connected++;
    else if (s.type === "pending") byState.pending++;
    else if (s.type === "needs-auth") byState.needsAuth++;
    else byState.failed++;
  }
  const parts = [];
  if (byState.connected) parts.push(color("success", theme)(`${byState.connected} connected`));
  if (byState.needsAuth) parts.push(color("warning", theme)(`${byState.needsAuth} need auth`));
  if (byState.pending) parts.push(color("inactive", theme)(`${byState.pending} pending`));
  if (byState.failed) parts.push(color("error", theme)(`${byState.failed} failed`));
  return [{
    label: "MCP servers",
    value: `${parts.join(", ")} ${color("inactive", theme)("· /mcp")}`
  }];
}
async function buildMemoryDiagnostics() {
  const files = await getMemoryFiles();
  const largeFiles = getLargeMemoryFiles(files);
  const diagnostics = [];
  largeFiles.forEach((file) => {
    const displayPath = getDisplayPath(file.path);
    diagnostics.push(`Large ${displayPath} will impact performance (${formatNumber(file.content.length)} chars > ${formatNumber(MAX_MEMORY_CHARACTER_COUNT)})`);
  });
  return diagnostics;
}
function buildSettingSourcesProperties() {
  const enabledSources = getEnabledSettingSources();
  const sourcesWithSettings = enabledSources.filter((source) => {
    const settings = getSettingsForSource(source);
    return settings !== null && Object.keys(settings).length > 0;
  });
  const sourceNames = sourcesWithSettings.map((source) => {
    if (source === "policySettings") {
      const origin = getPolicySettingsOrigin();
      if (origin === null) {
        return null;
      }
      switch (origin) {
        case "remote":
          return "Enterprise managed settings (remote)";
        case "plist":
          return "Enterprise managed settings (plist)";
        case "hklm":
          return "Enterprise managed settings (HKLM)";
        case "file": {
          const {
            hasBase,
            hasDropIns
          } = getManagedFileSettingsPresence();
          if (hasBase && hasDropIns) {
            return "Enterprise managed settings (file + drop-ins)";
          }
          if (hasDropIns) {
            return "Enterprise managed settings (drop-ins)";
          }
          return "Enterprise managed settings (file)";
        }
        case "hkcu":
          return "Enterprise managed settings (HKCU)";
      }
    }
    return getSettingSourceDisplayNameCapitalized(source);
  }).filter((name) => name !== null);
  return [{
    label: "Setting sources",
    value: sourceNames
  }];
}
async function buildInstallationDiagnostics() {
  const installWarnings = await checkInstall();
  return installWarnings.map((warning) => warning.message);
}
async function buildInstallationHealthDiagnostics() {
  const diagnostic = await getDoctorDiagnostic();
  const items = [];
  const {
    errors: validationErrors
  } = getSettingsWithAllErrors();
  if (validationErrors.length > 0) {
    const invalidFiles = Array.from(new Set(validationErrors.map((error) => error.file)));
    const fileList = invalidFiles.join(", ");
    items.push(`Found invalid settings files: ${fileList}. They will be ignored.`);
  }
  diagnostic.warnings.forEach((warning) => {
    items.push(warning.issue);
  });
  if (diagnostic.hasUpdatePermissions === false) {
    items.push("No write permissions for auto-updates (requires sudo)");
  }
  return items;
}
function buildAccountProperties() {
  const accountInfo = getAccountInformation();
  if (!accountInfo) {
    return [];
  }
  const properties = [];
  if (accountInfo.subscription) {
    properties.push({
      label: "Login method",
      value: `${accountInfo.subscription} Account`
    });
  }
  if (accountInfo.tokenSource) {
    properties.push({
      label: "Auth token",
      value: accountInfo.tokenSource
    });
  }
  if (accountInfo.apiKeySource) {
    properties.push({
      label: "API key",
      value: accountInfo.apiKeySource
    });
  }
  if (accountInfo.organization && !process.env.IS_DEMO) {
    properties.push({
      label: "Organization",
      value: accountInfo.organization
    });
  }
  if (accountInfo.email && !process.env.IS_DEMO) {
    properties.push({
      label: "Email",
      value: accountInfo.email
    });
  }
  return properties;
}
function formatProviderSource(activeProvider) {
  const origins = Array.isArray(activeProvider?.origins) ? activeProvider.origins : [];
  if (origins.length > 0) {
    return origins.map((origin) => {
      switch (origin) {
        case "env":
          return "OPENAI_* env";
        case "settings":
          return "Pigger/OpenAI settings";
        case "codex":
          return "Codex";
        default:
          return origin;
      }
    }).join(" + ");
  }
  switch (activeProvider?.source) {
    case "env":
      return "OPENAI_* env";
    case "settings":
      return "Pigger/OpenAI settings";
    case "codex":
      return "Codex";
    default:
      return activeProvider?.source ?? "unknown";
  }
}
function formatCodexCompatibilityValue(status) {
  if (!status.enabled) {
    return "Disabled";
  }
  if (!status.available) {
    return status.error ? `Enabled, unavailable: ${status.error}` : `Enabled, waiting for ${status.configDir}`;
  }
  if (status.warning) {
    return `Enabled (${status.configDir}) · ${status.warning}`;
  }
  return `Enabled (${status.configDir})`;
}
function formatClaudeCompatibilityValue(status) {
  if (!status.enabled) {
    return "Disabled";
  }
  if (!status.available) {
    return status.warning ? `Enabled, unavailable: ${status.warning}` : `Enabled, waiting for ${status.configDir}`;
  }
  if (!status.hasSettingsFiles && status.hasGlobalFile) {
    return `Enabled (${status.configDir}) · using ${status.globalFile} for global config`;
  }
  return `Enabled (${status.configDir})`;
}
function formatConfigSourceValue(codexStatus, claudeStatus) {
  if (codexStatus.enabled && claudeStatus.enabled) {
    return `Codex (${codexStatus.configDir}) + Claude (${claudeStatus.configDir})`;
  }
  if (codexStatus.enabled) {
    return `Codex (${codexStatus.configDir})`;
  }
  if (claudeStatus.enabled) {
    return `Claude (${claudeStatus.configDir})`;
  }
  return `Pigger (${getClaudeConfigHomeDir()})`;
}
function buildAPIProviderProperties() {
  const apiProvider = getAPIProvider();
  const activeCustomProvider = getActiveInferenceProviderConfig();
  const claudeStatus = getClaudeCompatibilityStatus();
  const codexStatus = getCodexCompatibilityStatus();
  const properties = [];
  if (activeCustomProvider) {
    properties.push({
      label: "Inference provider",
      value: activeCustomProvider.provider.name
    }, {
      label: "Provider format",
      value: activeCustomProvider.provider.format === "anthropic" ? "Anthropic" : "OpenAI compatible"
    }, {
      label: "Provider base URL",
      value: activeCustomProvider.provider.baseUrl
    });
    if (activeCustomProvider.provider.format === "openai") {
      properties.push({
        label: "Provider source",
        value: formatProviderSource(activeCustomProvider)
      });
      if (activeCustomProvider.provider.wireApi) {
        properties.push({
          label: "Wire API",
          value: activeCustomProvider.provider.wireApi === "responses" ? "Responses" : "Chat Completions"
        });
      }
      if (activeCustomProvider.provider.reasoningEffort) {
        properties.push({
          label: "Reasoning effort",
          value: activeCustomProvider.provider.reasoningEffort
        });
      }
      if (activeCustomProvider.provider.disableResponseStorage === true) {
        properties.push({
          label: "Response storage",
          value: "Disabled"
        });
      }
      if (activeCustomProvider.source === "codex" || activeCustomProvider.origins?.includes("codex") || activeCustomProvider.configDir) {
        properties.push({
          label: "Codex config",
          value: activeCustomProvider.configDir ?? codexStatus.configDir
        });
      }
      if (claudeStatus.enabled) {
        properties.push({
          label: "Claude config",
          value: claudeStatus.configDir
        });
      }
    }
    properties.push({
      label: "Config source",
      value: formatConfigSourceValue(codexStatus, claudeStatus)
    });
    properties.push({
      label: "Claude compatibility",
      value: formatClaudeCompatibilityValue(claudeStatus)
    });
    properties.push({
      label: "Codex compatibility",
      value: formatCodexCompatibilityValue(codexStatus)
    });
    return properties;
  }
  if (apiProvider !== "firstParty") {
    const providerLabel = {
      bedrock: "AWS Bedrock",
      vertex: "Google Vertex AI",
      foundry: "Microsoft Foundry"
    }[apiProvider];
    properties.push({
      label: "API provider",
      value: providerLabel
    });
  }
  if (apiProvider === "firstParty") {
    const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;
    if (anthropicBaseUrl) {
      properties.push({
        label: "Anthropic base URL",
        value: anthropicBaseUrl
      });
    }
  } else if (apiProvider === "bedrock") {
    const bedrockBaseUrl = process.env.BEDROCK_BASE_URL;
    if (bedrockBaseUrl) {
      properties.push({
        label: "Bedrock base URL",
        value: bedrockBaseUrl
      });
    }
    properties.push({
      label: "AWS region",
      value: getAWSRegion()
    });
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
      properties.push({
        value: "AWS auth skipped"
      });
    }
  } else if (apiProvider === "vertex") {
    const vertexBaseUrl = process.env.VERTEX_BASE_URL;
    if (vertexBaseUrl) {
      properties.push({
        label: "Vertex base URL",
        value: vertexBaseUrl
      });
    }
    const gcpProject = process.env.ANTHROPIC_VERTEX_PROJECT_ID;
    if (gcpProject) {
      properties.push({
        label: "GCP project",
        value: gcpProject
      });
    }
    properties.push({
      label: "Default region",
      value: getDefaultVertexRegion()
    });
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
      properties.push({
        value: "GCP auth skipped"
      });
    }
  } else if (apiProvider === "foundry") {
    const foundryBaseUrl = process.env.ANTHROPIC_FOUNDRY_BASE_URL;
    if (foundryBaseUrl) {
      properties.push({
        label: "Microsoft Foundry base URL",
        value: foundryBaseUrl
      });
    }
    const foundryResource = process.env.ANTHROPIC_FOUNDRY_RESOURCE;
    if (foundryResource) {
      properties.push({
        label: "Microsoft Foundry resource",
        value: foundryResource
      });
    }
    if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)) {
      properties.push({
        value: "Microsoft Foundry auth skipped"
      });
    }
  }
  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    properties.push({
      label: "Proxy",
      value: proxyUrl
    });
  }
  const mtlsConfig = getMTLSConfig();
  if (process.env.NODE_EXTRA_CA_CERTS) {
    properties.push({
      label: "Additional CA cert(s)",
      value: process.env.NODE_EXTRA_CA_CERTS
    });
  }
  if (mtlsConfig) {
    if (mtlsConfig.cert && process.env.CLAUDE_CODE_CLIENT_CERT) {
      properties.push({
        label: "mTLS client cert",
        value: process.env.CLAUDE_CODE_CLIENT_CERT
      });
    }
    if (mtlsConfig.key && process.env.CLAUDE_CODE_CLIENT_KEY) {
      properties.push({
        label: "mTLS client key",
        value: process.env.CLAUDE_CODE_CLIENT_KEY
      });
    }
  }
  properties.push({
    label: "Config source",
    value: formatConfigSourceValue(codexStatus, claudeStatus)
  });
  properties.push({
    label: "Claude compatibility",
    value: formatClaudeCompatibilityValue(claudeStatus)
  });
  properties.push({
    label: "Codex compatibility",
    value: formatCodexCompatibilityValue(codexStatus)
  });
  return properties;
}
function getModelDisplayLabel(mainLoopModel) {
  let modelLabel = modelDisplayString(mainLoopModel);
  if (mainLoopModel === null && isClaudeAISubscriber()) {
    const description = getClaudeAiUserDefaultModelDescription();
    modelLabel = `${chalk.bold("Default")} ${description}`;
  }
  return modelLabel;
}
export {
  buildAPIProviderProperties,
  buildAccountProperties,
  buildIDEProperties,
  buildInstallationDiagnostics,
  buildInstallationHealthDiagnostics,
  buildMcpProperties,
  buildMemoryDiagnostics,
  buildSandboxProperties,
  buildSettingSourcesProperties,
  getModelDisplayLabel
};
