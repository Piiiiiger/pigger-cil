import { randomUUID } from "crypto";
import {
  getGlobalConfig,
  saveGlobalConfig
} from "../config.js";
import { getProxyFetchOptions } from "../proxy.js";
import { getSettingsForSource } from "../settings/settings.js";
import {
  getCodexCompatibilityStatus,
  OPENAI_CODEX_PROVIDER_ID
} from "./codexCompatibility.js";
import { getAPIProvider } from "./providers.js";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_OPENAI_PROVIDER_NAME = "OpenAI";
const DEFAULT_OPENAI_PROVIDER_BASE_URL = "https://api.openai.com/v1";
const OPENAI_SETTINGS_PROVIDER_ID = "__settings_openai__";
function normalizeBaseUrl(baseUrl) {
  return baseUrl.trim().replace(/\/+$/, "");
}
function sanitizeOptionalString(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : void 0;
}
function clearProviderSpecificFields(target) {
  delete target.wireApi;
  delete target.reasoningEffort;
  delete target.disableResponseStorage;
  delete target.configDir;
  delete target.requiresOpenAIAuth;
}
function uniqueStrings(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
function sanitizeModels(models) {
  const normalized = uniqueStrings(models ?? []);
  return normalized.length > 0 ? normalized : void 0;
}
function sortProviders(providers) {
  return [...providers].sort((a, b) => a.name.localeCompare(b.name));
}
function normalizeProvider(provider) {
  const models = sanitizeModels(provider.models);
  const selectedModel = provider.selectedModel && models?.includes(provider.selectedModel) ? provider.selectedModel : models?.[0];
  return {
    ...provider,
    baseUrl: normalizeBaseUrl(provider.baseUrl),
    models,
    selectedModel
  };
}
function getFetchEndpoints(format, baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  return format === "anthropic" ? [`${normalized}/v1/models`, `${normalized}/models`] : [`${normalized}/models`, `${normalized}/v1/models`];
}
function getFetchHeaders(provider) {
  const headers = {
    Accept: "application/json"
  };
  if (provider.format === "anthropic") {
    if (provider.apiKey) {
      headers["x-api-key"] = provider.apiKey;
    }
    headers["anthropic-version"] = ANTHROPIC_VERSION;
  } else if (provider.apiKey) {
    headers.Authorization = `Bearer ${provider.apiKey}`;
  }
  return headers;
}
function extractModelIds(payload) {
  if (Array.isArray(payload)) {
    return uniqueStrings(
      payload.flatMap((entry) => {
        if (typeof entry === "string") {
          return [entry];
        }
        if (entry && typeof entry === "object" && "id" in entry && typeof entry.id === "string") {
          return [entry.id];
        }
        return [];
      })
    );
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  if ("data" in payload && Array.isArray(payload.data)) {
    return extractModelIds(payload.data);
  }
  if ("models" in payload && Array.isArray(payload.models)) {
    return extractModelIds(payload.models);
  }
  if ("id" in payload && typeof payload.id === "string") {
    return [payload.id];
  }
  return [];
}
function getInferenceProviders() {
  return sortProviders(
    (getGlobalConfig().inferenceProviders ?? []).map(normalizeProvider)
  );
}
function getInferenceProvider(providerId) {
  return getInferenceProviders().find((provider) => provider.id === providerId);
}
function getSavedInferenceProviderSelection() {
  const active = getGlobalConfig().activeInferenceProvider;
  if (!active?.providerId || !active.model) {
    return null;
  }
  const provider = getInferenceProvider(active.providerId);
  if (!provider) {
    return null;
  }
  return {
    providerId: provider.id,
    model: active.model
  };
}
function getSavedInferenceProviderConfig() {
  const active = getSavedInferenceProviderSelection();
  if (!active) {
    return null;
  }
  const provider = getInferenceProvider(active.providerId);
  if (!provider) {
    return null;
  }
  return {
    provider,
    model: active.model
  };
}
function mergeOpenAIConfigLayers(layers) {
  const merged = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== "object") {
      continue;
    }
    if ("name" in layer) {
      merged.name = sanitizeOptionalString(layer.name) ?? merged.name;
    }
    if ("baseUrl" in layer) {
      const baseUrl = sanitizeOptionalString(layer.baseUrl);
      if (baseUrl) {
        merged.baseUrl = baseUrl;
        if (!("wireApi" in layer) && !("reasoningEffort" in layer) && !("disableResponseStorage" in layer) && !("configDir" in layer) && !("requiresOpenAIAuth" in layer)) {
          clearProviderSpecificFields(merged);
        }
      }
    }
    if ("apiKey" in layer) {
      merged.apiKey = sanitizeOptionalString(layer.apiKey) ?? merged.apiKey;
    }
    if ("model" in layer) {
      merged.model = sanitizeOptionalString(layer.model) ?? merged.model;
    }
    if ("models" in layer && Array.isArray(layer.models)) {
      merged.models = sanitizeModels(layer.models);
    }
    if ("wireApi" in layer) {
      merged.wireApi = sanitizeOptionalString(layer.wireApi) ?? merged.wireApi;
    }
    if ("reasoningEffort" in layer) {
      merged.reasoningEffort = sanitizeOptionalString(layer.reasoningEffort) ?? merged.reasoningEffort;
    }
    if ("disableResponseStorage" in layer && typeof layer.disableResponseStorage === "boolean") {
      merged.disableResponseStorage = layer.disableResponseStorage;
    }
    if ("configDir" in layer) {
      merged.configDir = sanitizeOptionalString(layer.configDir) ?? merged.configDir;
    }
    if ("requiresOpenAIAuth" in layer && typeof layer.requiresOpenAIAuth === "boolean") {
      merged.requiresOpenAIAuth = layer.requiresOpenAIAuth;
    }
  }
  return merged;
}
function buildOpenAIProviderConfig(layeredConfig, source) {
  const name = sanitizeOptionalString(layeredConfig.name) ?? DEFAULT_OPENAI_PROVIDER_NAME;
  const baseUrl = sanitizeOptionalString(layeredConfig.baseUrl) ?? DEFAULT_OPENAI_PROVIDER_BASE_URL;
  const model = sanitizeOptionalString(layeredConfig.model);
  const models = sanitizeModels(layeredConfig.models ?? (model ? [model] : []));
  const selectedModel = model ?? models?.[0];
  const wireApi = sanitizeOptionalString(layeredConfig.wireApi);
  const reasoningEffort = sanitizeOptionalString(layeredConfig.reasoningEffort);
  const configDir = sanitizeOptionalString(layeredConfig.configDir);
  if (!selectedModel) {
    return null;
  }
  const allModels = sanitizeModels([...(models ?? []), selectedModel]);
  const provider = normalizeProvider({
    id: sanitizeOptionalString(layeredConfig.providerId) ?? OPENAI_SETTINGS_PROVIDER_ID,
    name,
    format: "openai",
    baseUrl,
    apiKey: sanitizeOptionalString(layeredConfig.apiKey),
    models: allModels ?? [selectedModel],
    selectedModel,
    ...(wireApi ? { wireApi } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
    ...(typeof layeredConfig.disableResponseStorage === "boolean" ? {
      disableResponseStorage: layeredConfig.disableResponseStorage
    } : {}),
    ...(layeredConfig.requiresOpenAIAuth === true ? { requiresOpenAIAuth: true } : {})
  });
  return {
    provider,
    model: provider.selectedModel ?? selectedModel,
    source,
    ...(Array.isArray(layeredConfig.origins) ? { origins: [...new Set(layeredConfig.origins)] } : {}),
    ...(configDir ? { configDir } : {})
  };
}
function getOpenAIEnvOverrides() {
  const envConfig = mergeOpenAIConfigLayers([
    {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_MODEL
    }
  ]);
  if (!envConfig.apiKey && !envConfig.baseUrl && !envConfig.model) {
    return null;
  }
  return envConfig;
}
function getSettingsBackedOpenAIProviderConfig() {
  const merged = mergeOpenAIConfigLayers([
    getSettingsForSource("userSettings")?.openai,
    getSettingsForSource("projectSettings")?.openai,
    getSettingsForSource("localSettings")?.openai,
    getSettingsForSource("flagSettings")?.openai
  ]);
  if (!merged.name && !merged.baseUrl && !merged.apiKey && !merged.model && !merged.models) {
    return null;
  }
  return buildOpenAIProviderConfig(merged, "settings");
}
function getEnvBackedOpenAIProviderConfig() {
  const envOverrides = getOpenAIEnvOverrides();
  if (!envOverrides) {
    return null;
  }
  return buildOpenAIProviderConfig(envOverrides, "env");
}
function getCodexBackedOpenAIProviderConfig() {
  const status = getCodexCompatibilityStatus();
  if (!status.enabled || !status.available || !status.openaiConfig) {
    return null;
  }
  return buildOpenAIProviderConfig({
    ...status.openaiConfig,
    providerId: OPENAI_CODEX_PROVIDER_ID,
    origins: ["codex"],
    configDir: status.configDir
  }, "codex");
}
function getMergedOpenAIProviderConfig() {
  const codexConfig = getCodexBackedOpenAIProviderConfig();
  const envOverrides = getOpenAIEnvOverrides();
  const settingsConfig = getSettingsBackedOpenAIProviderConfig();
  if (!envOverrides && !settingsConfig && !codexConfig) {
    return null;
  }
  const origins = [
    ...(codexConfig ? ["codex"] : []),
    ...(settingsConfig ? ["settings"] : []),
    ...(envOverrides ? ["env"] : [])
  ];
  const merged = mergeOpenAIConfigLayers([
    codexConfig ? {
      providerId: codexConfig.provider.id,
      name: codexConfig.provider.name,
      baseUrl: codexConfig.provider.baseUrl,
      apiKey: codexConfig.provider.apiKey,
      model: codexConfig.model,
      models: codexConfig.provider.models,
      wireApi: codexConfig.provider.wireApi,
      reasoningEffort: codexConfig.provider.reasoningEffort,
      disableResponseStorage: codexConfig.provider.disableResponseStorage,
      configDir: codexConfig.configDir,
      requiresOpenAIAuth: codexConfig.provider.requiresOpenAIAuth
    } : null,
    settingsConfig ? {
      providerId: OPENAI_SETTINGS_PROVIDER_ID,
      name: settingsConfig.provider.name,
      baseUrl: settingsConfig.provider.baseUrl,
      apiKey: settingsConfig.provider.apiKey,
      model: settingsConfig.model,
      models: settingsConfig.provider.models
    } : null,
    envOverrides
  ]);
  const source = origins.length <= 1 ? origins[0] ?? "settings" : "mixed";
  return buildOpenAIProviderConfig({
    ...merged,
    providerId: settingsConfig ? OPENAI_SETTINGS_PROVIDER_ID : codexConfig ? OPENAI_CODEX_PROVIDER_ID : OPENAI_SETTINGS_PROVIDER_ID,
    origins
  }, source);
}
function getActiveInferenceProviderSelection() {
  const activeOpenAI = getAPIProvider() === "firstParty" ? getMergedOpenAIProviderConfig() : null;
  if (activeOpenAI) {
    return {
      providerId: activeOpenAI.provider.id,
      model: activeOpenAI.model
    };
  }
  return getSavedInferenceProviderSelection();
}
function getActiveInferenceProviderConfig() {
  const activeOpenAI = getAPIProvider() === "firstParty" ? getMergedOpenAIProviderConfig() : null;
  if (activeOpenAI) {
    return activeOpenAI;
  }
  return getSavedInferenceProviderConfig();
}
function getActiveAnthropicProviderConfig() {
  const active = getActiveInferenceProviderConfig();
  if (!active) {
    return null;
  }
  if (active.provider.format !== "anthropic") {
    return null;
  }
  if (getAPIProvider() !== "firstParty") {
    return null;
  }
  return active;
}
function getActiveOpenAIProviderConfig() {
  const active = getActiveInferenceProviderConfig();
  if (!active) {
    return null;
  }
  if (active.provider.format !== "openai") {
    return null;
  }
  if (getAPIProvider() !== "firstParty") {
    return null;
  }
  return active;
}
function formatProviderModelLabel(providerName, model) {
  return `${providerName}/${model}`;
}
function getActiveProviderModelLabel(model) {
  if (!model) {
    return null;
  }
  const active = getActiveInferenceProviderConfig();
  if (!active || active.model !== model) {
    return null;
  }
  return formatProviderModelLabel(active.provider.name, active.model);
}
function saveInferenceProvider(provider) {
  const normalizedProvider = normalizeProvider({
    id: provider.id ?? randomUUID(),
    name: provider.name.trim(),
    format: provider.format,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey?.trim() || void 0,
    models: provider.models,
    selectedModel: provider.selectedModel?.trim() || void 0
  });
  saveGlobalConfig((current) => {
    const existingProviders = current.inferenceProviders ?? [];
    const filtered = existingProviders.filter(
      (entry) => entry.id !== normalizedProvider.id
    );
    const updatedProviders = sortProviders([...filtered, normalizedProvider]);
    const nextActive = provider.activate && normalizedProvider.selectedModel ? {
      providerId: normalizedProvider.id,
      model: normalizedProvider.selectedModel
    } : current.activeInferenceProvider;
    return {
      ...current,
      inferenceProviders: updatedProviders,
      activeInferenceProvider: nextActive
    };
  });
  return normalizedProvider;
}
function activateInferenceProviderModel(providerId, model) {
  saveGlobalConfig((current) => {
    const providers = (current.inferenceProviders ?? []).map(
      (provider) => provider.id === providerId ? normalizeProvider({
        ...provider,
        models: uniqueStrings([...(provider.models ?? []), model]),
        selectedModel: model
      }) : provider
    );
    return {
      ...current,
      inferenceProviders: providers,
      activeInferenceProvider: {
        providerId,
        model
      }
    };
  });
}
function updateInferenceProviderModels(providerId, models, selectedModel) {
  const normalizedModels = uniqueStrings(models);
  saveGlobalConfig((current) => {
    const providers = (current.inferenceProviders ?? []).map((provider) => {
      if (provider.id !== providerId) {
        return provider;
      }
      const nextSelectedModel = selectedModel && normalizedModels.includes(selectedModel) ? selectedModel : provider.selectedModel && normalizedModels.includes(provider.selectedModel) ? provider.selectedModel : normalizedModels[0];
      return normalizeProvider({
        ...provider,
        models: normalizedModels,
        selectedModel: nextSelectedModel
      });
    });
    const active = current.activeInferenceProvider;
    const activeNeedsUpdate = active?.providerId === providerId;
    const nextActive = activeNeedsUpdate && normalizedModels.length > 0 ? {
      providerId,
      model: selectedModel && normalizedModels.includes(selectedModel) ? selectedModel : normalizedModels.includes(active.model) ? active.model : normalizedModels[0]
    } : active;
    return {
      ...current,
      inferenceProviders: providers,
      activeInferenceProvider: nextActive
    };
  });
}
function clearActiveInferenceProvider() {
  saveGlobalConfig((current) => ({
    ...current,
    activeInferenceProvider: void 0
  }));
}
function removeInferenceProvider(providerId) {
  saveGlobalConfig((current) => {
    const providers = (current.inferenceProviders ?? []).filter(
      (provider) => provider.id !== providerId
    );
    const active = current.activeInferenceProvider?.providerId === providerId ? void 0 : current.activeInferenceProvider;
    return {
      ...current,
      inferenceProviders: providers,
      activeInferenceProvider: active
    };
  });
}
async function fetchInferenceProviderModels(provider, signal) {
  let lastError = "No model endpoint responded successfully.";
  for (const endpoint of getFetchEndpoints(provider.format, provider.baseUrl)) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: getFetchHeaders(provider),
        signal,
        ...getProxyFetchOptions()
      });
      if (!response.ok) {
        const text = await response.text();
        lastError = `GET ${endpoint} failed with ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`;
        continue;
      }
      const payload = await response.json();
      const models = extractModelIds(payload);
      if (models.length === 0) {
        lastError = `GET ${endpoint} succeeded but returned no model ids.`;
        continue;
      }
      return {
        endpoint,
        models
      };
    } catch (error) {
      lastError = error instanceof Error ? `GET ${endpoint} failed: ${error.message}` : `GET ${endpoint} failed`;
    }
  }
  throw new Error(lastError);
}
export {
  DEFAULT_OPENAI_PROVIDER_BASE_URL,
  DEFAULT_OPENAI_PROVIDER_NAME,
  OPENAI_SETTINGS_PROVIDER_ID,
  activateInferenceProviderModel,
  clearActiveInferenceProvider,
  fetchInferenceProviderModels,
  formatProviderModelLabel,
  getActiveAnthropicProviderConfig,
  getActiveInferenceProviderConfig,
  getActiveInferenceProviderSelection,
  getCodexBackedOpenAIProviderConfig,
  getActiveOpenAIProviderConfig,
  getActiveProviderModelLabel,
  getEnvBackedOpenAIProviderConfig,
  getInferenceProvider,
  getInferenceProviders,
  getSettingsBackedOpenAIProviderConfig,
  removeInferenceProvider,
  saveInferenceProvider,
  updateInferenceProviderModels
};
