import { jsx, jsxs } from "react/jsx-runtime";
import chalk from "chalk";
import * as React from "react";
import { Select } from "../../components/CustomSelect/index.js";
import { Spinner } from "../../components/Spinner.js";
import { Pane } from "../../components/design-system/Pane.js";
import { COMMON_HELP_ARGS, COMMON_INFO_ARGS } from "../../constants/xml.js";
import { Box, Text } from "../../ink.js";
import { useAppState, useSetAppState } from "../../state/AppState.js";
import { isBilledAsExtraUsage } from "../../utils/extraUsage.js";
import {
  clearFastModeCooldown,
  isFastModeEnabled,
  isFastModeSupportedByModel
} from "../../utils/fastMode.js";
import { MODEL_ALIASES } from "../../utils/model/aliases.js";
import { checkOpus1mAccess, checkSonnet1mAccess } from "../../utils/model/check1mAccess.js";
import {
  activateInferenceProviderModel,
  clearActiveInferenceProvider,
  DEFAULT_OPENAI_PROVIDER_BASE_URL,
  fetchInferenceProviderModels,
  formatProviderModelLabel,
  getActiveInferenceProviderConfig,
  getCodexBackedOpenAIProviderConfig,
  getActiveOpenAIProviderConfig,
  getEnvBackedOpenAIProviderConfig,
  getInferenceProvider,
  getInferenceProviders,
  getSettingsBackedOpenAIProviderConfig,
  OPENAI_SETTINGS_PROVIDER_ID,
  removeInferenceProvider,
  saveInferenceProvider,
  updateInferenceProviderModels
} from "../../utils/model/customProviders.js";
import { getClaudeCompatibilityStatus } from "../../utils/model/claudeCompatibility.js";
import { OPENAI_CODEX_PROVIDER_ID } from "../../utils/model/codexCompatibility.js";
import {
  getDefaultMainLoopModelSetting,
  isOpus1mMergeEnabled,
  renderDefaultModelSetting,
  renderModelName
} from "../../utils/model/model.js";
import { isModelAllowed } from "../../utils/model/modelAllowlist.js";
import { validateModel } from "../../utils/model/validateModel.js";
import { updateSettingsForSource } from "../../utils/settings/settings.js";
const MENU_OPENAI = "__menu_openai__";
const MENU_SELECT_PROVIDER_MODEL = "__menu_select_provider_model__";
const MENU_MANAGE_PROVIDERS = "__menu_manage_providers__";
const MENU_ADD = "__menu_add__";
const MENU_REFRESH = "__menu_refresh__";
const MENU_REMOVE = "__menu_remove__";
const MENU_DEFAULT = "__menu_default__";
const MENU_CANCEL = "__menu_cancel__";
const PICK_MANUAL = "__pick_manual__";
const PICK_BACK = "__pick_back__";
const FORMAT_BACK = "__format_back__";
const REFRESH_BACK = "__refresh_back__";
const REMOVE_BACK = "__remove_back__";
const INPUT_SUBMIT = "__input_submit__";
const INPUT_BACK = "__input_back__";
function createEmptyDraft() {
  return {
    format: "anthropic",
    storage: "global",
    name: "",
    baseUrl: "",
    apiKey: "",
    fetchedModels: []
  };
}
function getCurrentModelLabel(mainLoopModel, mainLoopModelForSession) {
  if (mainLoopModelForSession) {
    return renderModelName(mainLoopModelForSession);
  }
  if (mainLoopModel) {
    return renderModelName(mainLoopModel);
  }
  const activeProvider = getActiveInferenceProviderConfig();
  if (activeProvider) {
    return formatProviderModelLabel(
      activeProvider.provider.name,
      activeProvider.model
    );
  }
  return `${renderDefaultModelSetting(getDefaultMainLoopModelSetting())} (default)`;
}
function isKnownAlias(model) {
  return MODEL_ALIASES.includes(model.toLowerCase().trim());
}
function isOpus1mUnavailable(model) {
  const normalized = model.toLowerCase();
  return !checkOpus1mAccess() && !isOpus1mMergeEnabled() && normalized.includes("opus") && normalized.includes("[1m]");
}
function isSonnet1mUnavailable(model) {
  const normalized = model.toLowerCase();
  return !checkSonnet1mAccess() && (normalized.includes("sonnet[1m]") || normalized.includes("sonnet-4-6[1m]"));
}
function validateBaseUrl(baseUrl) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  new URL(normalized);
  return normalized;
}
function formatBuiltInDefaultLabel() {
  return `${renderDefaultModelSetting(getDefaultMainLoopModelSetting())} (built-in default)`;
}
function isSettingsBackedProvider(provider) {
  return provider?.id === OPENAI_SETTINGS_PROVIDER_ID;
}
function isCodexBackedProvider(provider) {
  return provider?.id === OPENAI_CODEX_PROVIDER_ID;
}
function isWritableSettingsBackedProviderConfig(activeProvider) {
  return isSettingsBackedProvider(activeProvider?.provider) && activeProvider?.source !== "env";
}
function mergeModelList(models, selectedModel) {
  const combined = [...(models ?? []), ...(selectedModel ? [selectedModel] : [])].map((value) => value.trim()).filter(Boolean);
  return [...new Set(combined)];
}
function clearSavedOpenAISettings() {
  const sources = ["userSettings", "projectSettings", "localSettings"];
  const errors = [];
  for (const source of sources) {
    const result = updateSettingsForSource(source, { openai: void 0 });
    if (result.error) {
      errors.push(result.error.message);
    }
  }
  return errors;
}
function disableCodexCompatibility() {
  const result = updateSettingsForSource("userSettings", {
    codexCompatibility: {
      enabled: false
    }
  });
  return result.error ? [result.error.message] : [];
}
function disableClaudeCompatibility() {
  const result = updateSettingsForSource("userSettings", {
    claudeCompatibility: {
      enabled: false
    }
  });
  return result.error ? [result.error.message] : [];
}
function persistSettingsBackedOpenAIProvider({
  name,
  baseUrl,
  apiKey,
  model,
  models
}) {
  const projectResult = updateSettingsForSource("projectSettings", {
    openai: {
      name,
      baseUrl,
      apiKey: void 0,
      model,
      models
    }
  });
  if (projectResult.error) {
    throw projectResult.error;
  }
  const localResult = updateSettingsForSource("localSettings", {
    openai: {
      name: void 0,
      baseUrl: void 0,
      apiKey,
      model: void 0,
      models: void 0
    }
  });
  if (localResult.error) {
    throw localResult.error;
  }
}
function buildSelectionMessage({
  model,
  displayLabel,
  fastMode
}) {
  let message = model === null ? `Using ${chalk.bold(displayLabel)}` : `Set model to ${chalk.bold(displayLabel)}`;
  let nextFastMode = fastMode;
  if (isFastModeEnabled()) {
    clearFastModeCooldown();
    if (!isFastModeSupportedByModel(model) && fastMode) {
      nextFastMode = false;
      message += " · Fast mode OFF";
    }
  }
  if (model !== null && isBilledAsExtraUsage(model, nextFastMode, isOpus1mMergeEnabled())) {
    message += " · Billed as extra usage";
  }
  return { message, nextFastMode };
}
function applyBuiltInModelSelection(setAppState, fastMode, model) {
  clearSavedOpenAISettings();
  disableClaudeCompatibility();
  disableCodexCompatibility();
  clearActiveInferenceProvider();
  const displayLabel = model === null ? formatBuiltInDefaultLabel() : renderModelName(model);
  const { message, nextFastMode } = buildSelectionMessage({
    model,
    displayLabel,
    fastMode
  });
  setAppState((prev) => ({
    ...prev,
    mainLoopModel: model,
    mainLoopModelForSession: null,
    fastMode: nextFastMode
  }));
  return message;
}
function applySettingsBackedProviderSelection(setAppState, fastMode, provider, model) {
  const displayLabel = formatProviderModelLabel(provider.name, model);
  const { message, nextFastMode } = buildSelectionMessage({
    model,
    displayLabel,
    fastMode
  });
  setAppState((prev) => ({
    ...prev,
    mainLoopModel: model,
    mainLoopModelForSession: null,
    fastMode: nextFastMode
  }));
  return message;
}
function applyExistingProviderModelSelection(setAppState, fastMode, activeProvider, model) {
  if (isSettingsBackedProvider(activeProvider.provider) || isCodexBackedProvider(activeProvider.provider)) {
    if (isWritableSettingsBackedProviderConfig(activeProvider)) {
      persistSettingsBackedOpenAIProvider({
        name: activeProvider.provider.name,
        baseUrl: activeProvider.provider.baseUrl,
        apiKey: activeProvider.provider.apiKey,
        model,
        models: mergeModelList(activeProvider.provider.models, model)
      });
    }
    return applySettingsBackedProviderSelection(
      setAppState,
      fastMode,
      activeProvider.provider,
      model
    );
  }
  return applyProviderSelection(setAppState, fastMode, activeProvider.provider, model);
}
function applyProviderSelection(setAppState, fastMode, provider, model) {
  activateInferenceProviderModel(provider.id, model);
  const displayLabel = formatProviderModelLabel(provider.name, model);
  const { message, nextFastMode } = buildSelectionMessage({
    model,
    displayLabel,
    fastMode
  });
  setAppState((prev) => ({
    ...prev,
    mainLoopModel: model,
    mainLoopModelForSession: null,
    fastMode: nextFastMode
  }));
  return message;
}
function Header({
  title,
  subtitle
}) {
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ jsx(Text, { color: "remember", bold: true, children: title }),
    /* @__PURE__ */ jsx(Text, { dimColor: true, children: subtitle })
  ] });
}
function InputStage({
  title,
  subtitle,
  error,
  label,
  placeholder,
  value,
  onValueChange,
  onSubmit,
  onBack
}) {
  const options = [
    {
      type: "input",
      value: INPUT_SUBMIT,
      label,
      placeholder,
      initialValue: value,
      onChange: onValueChange,
      allowEmptySubmitToCancel: false,
      showLabelWithValue: true,
      labelValueSeparator: ": ",
      resetCursorOnUpdate: true
    },
    {
      value: INPUT_BACK,
      label: "Back"
    }
  ];
  return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
    /* @__PURE__ */ jsx(Header, { title, subtitle }),
    error && /* @__PURE__ */ jsx(Box, { marginBottom: 1, children: /* @__PURE__ */ jsx(Text, { color: "error", children: error }) }),
    /* @__PURE__ */ jsx(
      Select,
      {
        options,
        defaultFocusValue: INPUT_SUBMIT,
        onChange: (value2) => {
          if (value2 === INPUT_BACK) {
            onBack();
            return;
          }
          onSubmit();
        },
        onCancel: onBack
      }
    )
  ] });
}
function ModelManager({
  onDone
}) {
  const setAppState = useSetAppState();
  const fastMode = useAppState((state) => state.fastMode ?? false);
  const mainLoopModel = useAppState((state) => state.mainLoopModel);
  const mainLoopModelForSession = useAppState(
    (state) => state.mainLoopModelForSession
  );
  const [stage, setStage] = React.useState("menu");
  const [draft, setDraft] = React.useState(createEmptyDraft());
  const [draftName, setDraftName] = React.useState("");
  const [draftBaseUrl, setDraftBaseUrl] = React.useState("");
  const [draftApiKey, setDraftApiKey] = React.useState("");
  const [manualModel, setManualModel] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [providersVersion, setProvidersVersion] = React.useState(0);
  const settingsOpenAIProvider = React.useMemo(
    () => getSettingsBackedOpenAIProviderConfig(),
    [providersVersion]
  );
  const envOpenAIProvider = React.useMemo(
    () => getEnvBackedOpenAIProviderConfig(),
    [providersVersion]
  );
  const codexOpenAIProvider = React.useMemo(
    () => getCodexBackedOpenAIProviderConfig(),
    [providersVersion]
  );
  const claudeCompatibility = React.useMemo(
    () => getClaudeCompatibilityStatus(),
    [providersVersion]
  );
  const providers = React.useMemo(
    () => settingsOpenAIProvider ? [settingsOpenAIProvider.provider, ...getInferenceProviders()] : getInferenceProviders(),
    [providersVersion, settingsOpenAIProvider]
  );
  const activeProvider = React.useMemo(
    () => getActiveInferenceProviderConfig(),
    [providersVersion]
  );
  const managedOpenAIProviders = React.useMemo(
    () => settingsOpenAIProvider ? [settingsOpenAIProvider.provider] : codexOpenAIProvider ? [codexOpenAIProvider.provider] : [],
    [codexOpenAIProvider, settingsOpenAIProvider]
  );
  const selectableProviders = React.useMemo(
    () => activeProvider?.provider.format === "openai" ? managedOpenAIProviders : providers,
    [activeProvider, managedOpenAIProviders, providers]
  );
  const defaultSelectionActions = React.useMemo(() => {
    const actions = [];
    if (settingsOpenAIProvider) {
      actions.push("clears saved Pigger/OpenAI settings");
    }
    if (claudeCompatibility.enabled) {
      actions.push("disables Claude compatibility");
    }
    if (codexOpenAIProvider) {
      actions.push("disables Codex compatibility");
    }
    return actions;
  }, [claudeCompatibility.enabled, codexOpenAIProvider, settingsOpenAIProvider]);
  function refreshProviders() {
    setProvidersVersion((version) => version + 1);
  }
  function handleCancel() {
    onDone(`Kept model as ${chalk.bold(getCurrentModelLabel(mainLoopModel, mainLoopModelForSession))}`, {
      display: "system"
    });
  }
  function seedDraftFromOpenAIConfig() {
    const activeOpenAIProvider = getActiveOpenAIProviderConfig();
    const existing = settingsOpenAIProvider ?? activeOpenAIProvider;
    const provider = existing?.provider;
    const model = existing?.model ?? provider?.selectedModel ?? "";
    const models = mergeModelList(provider?.models, model);
    setDraft({
      format: "openai",
      storage: "settings",
      name: provider?.name ?? "OpenAI",
      baseUrl: provider?.baseUrl ?? DEFAULT_OPENAI_PROVIDER_BASE_URL,
      apiKey: provider?.apiKey ?? "",
      fetchedModels: models,
      fetchSource: void 0
    });
    setDraftName(provider?.name ?? "OpenAI");
    setDraftBaseUrl(provider?.baseUrl ?? DEFAULT_OPENAI_PROVIDER_BASE_URL);
    setDraftApiKey(provider?.apiKey ?? "");
    setManualModel(model);
  }
  function goToAddProvider() {
    setError(null);
    setDraft(createEmptyDraft());
    setDraftName("");
    setDraftBaseUrl("");
    setDraftApiKey("");
    setManualModel("");
    setStage("format");
  }
  function goToConfigureOpenAI() {
    setError(null);
    seedDraftFromOpenAIConfig();
    setStage("name");
  }
  function finalizeProvider(model) {
    if (draft.storage === "settings" && draft.format === "openai") {
      const savedModels = mergeModelList(draft.fetchedModels, model);
      persistSettingsBackedOpenAIProvider({
        name: draft.name,
        baseUrl: draft.baseUrl,
        apiKey: draft.apiKey,
        model,
        models: savedModels
      });
      refreshProviders();
      onDone(
        applySettingsBackedProviderSelection(
          setAppState,
          fastMode,
          {
            id: OPENAI_SETTINGS_PROVIDER_ID,
            name: draft.name,
            format: "openai"
          },
          model
        )
      );
      return;
    }
    const savedProvider = saveInferenceProvider({
      name: draft.name,
      format: draft.format,
      baseUrl: draft.baseUrl,
      apiKey: draft.apiKey,
      models: mergeModelList(draft.fetchedModels, model),
      selectedModel: model,
      activate: true
    });
    refreshProviders();
    onDone(applyProviderSelection(setAppState, fastMode, savedProvider, model));
  }
  async function fetchModelsAndContinue() {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = validateBaseUrl(draftBaseUrl);
      const nextDraft = {
        ...draft,
        name: draftName.trim(),
        baseUrl,
        apiKey: draftApiKey.trim()
      };
      const result = await fetchInferenceProviderModels({
        format: nextDraft.format,
        baseUrl: nextDraft.baseUrl,
        apiKey: nextDraft.apiKey
      });
      setDraft({
        ...nextDraft,
        fetchedModels: result.models,
        fetchSource: result.endpoint
      });
      setManualModel(result.models[0] ?? "");
      setStage("pick-model");
    } catch (stageError) {
      const nextDraft = {
        ...draft,
        name: draftName.trim(),
        baseUrl: draftBaseUrl.trim(),
        apiKey: draftApiKey.trim(),
        fetchedModels: []
      };
      setDraft(nextDraft);
      setError(
        stageError instanceof Error ? stageError.message : "Failed to fetch models."
      );
      setStage("manual-model");
    } finally {
      setIsLoading(false);
    }
  }
  async function refreshProvider(providerId) {
    const provider = getInferenceProvider(providerId);
    const settingsProvider = providerId === OPENAI_SETTINGS_PROVIDER_ID ? settingsOpenAIProvider?.provider : null;
    const targetProvider = settingsProvider ?? provider;
    if (!targetProvider) {
      onDone("Provider not found.", { display: "system" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchInferenceProviderModels(targetProvider);
      const nextSelectedModel = targetProvider.selectedModel && result.models.includes(targetProvider.selectedModel) ? targetProvider.selectedModel : result.models[0];
      if (isSettingsBackedProvider(targetProvider)) {
        persistSettingsBackedOpenAIProvider({
          name: targetProvider.name,
          baseUrl: targetProvider.baseUrl,
          apiKey: targetProvider.apiKey,
          model: nextSelectedModel,
          models: result.models
        });
      } else {
        updateInferenceProviderModels(targetProvider.id, result.models, nextSelectedModel);
      }
      refreshProviders();
      if (activeProvider?.provider.id === targetProvider.id && nextSelectedModel) {
        setAppState((prev) => ({
          ...prev,
          mainLoopModel: nextSelectedModel,
          mainLoopModelForSession: null
        }));
      }
      onDone(
        `Refreshed ${chalk.bold(targetProvider.name)} from ${result.endpoint}.`,
        {
          display: "system"
        }
      );
    } catch (stageError) {
      onDone(
        stageError instanceof Error ? stageError.message : "Failed to refresh provider models.",
        {
          display: "system"
        }
      );
    } finally {
      setIsLoading(false);
    }
  }
  function removeSelectedProvider(providerId) {
    const settingsProvider = providerId === OPENAI_SETTINGS_PROVIDER_ID ? settingsOpenAIProvider?.provider : null;
    const provider = settingsProvider ?? getInferenceProvider(providerId);
    if (!provider) {
      onDone("Provider not found.", { display: "system" });
      return;
    }
    const wasActive = activeProvider?.provider.id === provider.id;
    if (isSettingsBackedProvider(provider)) {
      clearSavedOpenAISettings();
    } else {
      removeInferenceProvider(provider.id);
    }
    refreshProviders();
    if (wasActive) {
      setAppState((prev) => ({
        ...prev,
        mainLoopModel: null,
        mainLoopModelForSession: null
      }));
    }
    onDone(`Removed provider ${chalk.bold(provider.name)}.`, {
      display: "system"
    });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(Header, { title: "Model", subtitle: "Loading provider data…" }),
      /* @__PURE__ */ jsxs(Box, { flexDirection: "row", gap: 1, children: [
        /* @__PURE__ */ jsx(Spinner, {}),
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: "Checking the provider and fetching models…" })
      ] })
    ] });
  }
  const currentLabel = getCurrentModelLabel(
    mainLoopModel,
    mainLoopModelForSession
  );
  if (stage === "format") {
    const options = [
      {
        value: "anthropic",
        label: "Anthropic",
        description: "Uses the Anthropic message protocol and can be activated immediately."
      },
      {
        value: "openai",
        label: "OpenAI format",
        description: "Uses a Chat Completions compatible endpoint and can be activated immediately."
      },
      {
        value: FORMAT_BACK,
        label: "Back"
      }
    ];
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Add Provider",
          subtitle: `Current model: ${currentLabel}`
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options,
          defaultFocusValue: "anthropic",
          onChange: (value) => {
            if (value === FORMAT_BACK) {
              setStage("menu");
              return;
            }
            const format = value;
            setDraft((current) => ({ ...current, format }));
            setDraftName("");
            setStage("name");
          },
          onCancel: () => setStage("menu")
        }
      )
    ] });
  }
  if (stage === "name") {
    return /* @__PURE__ */ jsx(
      InputStage,
      {
        title: draft.storage === "settings" ? "GPT/OpenAI Provider" : "Provider Name",
        subtitle: draft.storage === "settings" ? "Shared settings go to .pigger/settings.json; the API key is stored in .pigger/settings.local.json." : `Format: ${draft.format === "anthropic" ? "Anthropic" : "OpenAI format"}`,
        error,
        label: "Name",
        placeholder: draft.storage === "settings" ? "e.g. OpenAI, OpenRouter, Team Gateway" : "e.g. OpenRouter, API2D, My gateway",
        value: draftName,
        onValueChange: setDraftName,
        onSubmit: () => {
          if (!draftName.trim()) {
            setError("Provider name cannot be empty.");
            return;
          }
          setError(null);
          setStage("base-url");
        },
        onBack: () => setStage(draft.storage === "settings" ? "menu" : "format")
      }
    );
  }
  if (stage === "base-url") {
    return /* @__PURE__ */ jsx(
      InputStage,
      {
        title: "Base URL",
        subtitle: `Provider: ${draftName || draft.name}`,
        error,
        label: "Base URL",
        placeholder: draft.format === "anthropic" ? "https://api.anthropic.com" : DEFAULT_OPENAI_PROVIDER_BASE_URL,
        value: draftBaseUrl,
        onValueChange: setDraftBaseUrl,
        onSubmit: () => {
          try {
            validateBaseUrl(draftBaseUrl);
            setError(null);
            setStage("api-key");
          } catch (stageError) {
            setError(
              stageError instanceof Error ? stageError.message : "Invalid base URL."
            );
          }
        },
        onBack: () => setStage("name")
      }
    );
  }
  if (stage === "api-key") {
    return /* @__PURE__ */ jsx(
      InputStage,
      {
        title: "API Key",
        subtitle: draft.storage === "settings" ? "The key is saved in .pigger/settings.local.json. Press Enter to fetch /models; if unavailable, the next step falls back to manual input." : "Press Enter to fetch /models. If the endpoint does not expose a model list, the next step will fall back to manual input.",
        error,
        label: "API key",
        placeholder: "Paste the provider key",
        value: draftApiKey,
        onValueChange: setDraftApiKey,
        onSubmit: () => {
          if (!draftApiKey.trim()) {
            setError("API key cannot be empty.");
            return;
          }
          void fetchModelsAndContinue();
        },
        onBack: () => setStage("base-url")
      }
    );
  }
  if (stage === "pick-model") {
    const modelOptions = draft.fetchedModels.map(
      (model) => ({
        value: model,
        label: model,
        description: draft.fetchSource === void 0 ? void 0 : `Fetched from ${draft.fetchSource}`
      })
    );
    modelOptions.push(
      {
        value: PICK_MANUAL,
        label: "Enter model manually",
        description: "Use a custom deployment or a model that did not appear in /models."
      },
      {
        value: PICK_BACK,
        label: "Back"
      }
    );
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Pick Model",
          subtitle: `Provider: ${draft.name} · ${draft.baseUrl}`
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options: modelOptions,
          defaultFocusValue: draft.fetchedModels[0] ?? PICK_MANUAL,
          onChange: (value) => {
            if (value === PICK_BACK) {
              setStage("api-key");
              return;
            }
            if (value === PICK_MANUAL) {
              setStage("manual-model");
              return;
            }
            finalizeProvider(value);
          },
          onCancel: () => setStage("api-key")
        }
      )
    ] });
  }
  if (stage === "manual-model") {
    return /* @__PURE__ */ jsx(
      InputStage,
      {
        title: "Manual Model",
        subtitle: error ? `Model list fetch failed: ${error}` : "Enter the model or deployment name manually.",
        error: error && draft.fetchedModels.length > 0 ? error : null,
        label: "Model",
        placeholder: draft.format === "anthropic" ? "e.g. claude-sonnet-4-6" : "e.g. gpt-4.1, deepseek-chat, your deployment id",
        value: manualModel,
        onValueChange: setManualModel,
        onSubmit: () => {
          if (!manualModel.trim()) {
            setError("Model cannot be empty.");
            return;
          }
          finalizeProvider(manualModel.trim());
        },
        onBack: () => setStage(draft.fetchedModels.length > 0 ? "pick-model" : "api-key")
      }
    );
  }
  if (stage === "refresh") {
    const options = providers.map((provider) => ({
        value: provider.id,
        label: provider.name,
        description: isSettingsBackedProvider(provider) ? `Pigger settings · ${provider.baseUrl}` : `${provider.format === "anthropic" ? "Anthropic" : "OpenAI format"} · ${provider.baseUrl}`
      }));
    options.push({
      value: REFRESH_BACK,
      label: "Back"
    });
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Refresh Models",
          subtitle: "Choose a provider and pull its latest model list from /models."
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options,
          defaultFocusValue: providers[0]?.id ?? REFRESH_BACK,
          onChange: (value) => {
            if (value === REFRESH_BACK) {
              setStage("menu");
              return;
            }
            void refreshProvider(value);
          },
          onCancel: () => setStage("menu")
        }
      )
    ] });
  }
  if (stage === "remove") {
    const options = providers.map((provider) => ({
        value: provider.id,
        label: provider.name,
        description: isSettingsBackedProvider(provider) ? `${provider.models?.length ?? 0} saved Pigger model(s)` : `${provider.models?.length ?? 0} saved model(s)`
      }));
    options.push({
      value: REMOVE_BACK,
      label: "Back"
    });
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Remove Provider",
          subtitle: "Remove a saved provider and all of its stored models."
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options,
          defaultFocusValue: providers[0]?.id ?? REMOVE_BACK,
          onChange: (value) => {
            if (value === REMOVE_BACK) {
              setStage("menu");
              return;
            }
            removeSelectedProvider(value);
          },
          onCancel: () => setStage("menu")
        }
      )
    ] });
  }
  const providerOptions = [];
  for (const provider of selectableProviders) {
    const models = provider.models ?? [];
    if (models.length === 0) {
      providerOptions.push({
        value: `${provider.id}:empty`,
        label: `${provider.name} (no saved models)`,
        description: provider.baseUrl,
        disabled: true
      });
      continue;
    }
    for (const model of models) {
      providerOptions.push({
        value: `${provider.id}:${model}`,
        label: formatProviderModelLabel(provider.name, model),
        description: isSettingsBackedProvider(provider) ? `${provider.baseUrl} · ${claudeCompatibility.enabled ? "Pigger/Claude settings" : "Pigger settings"}` : isCodexBackedProvider(provider) ? `${provider.baseUrl} · Codex compatibility` : provider.format === "anthropic" ? provider.baseUrl : `${provider.baseUrl} · OpenAI compatible`
      });
    }
  }
  if (stage === "select-provider-model") {
    const options = providerOptions.length > 0 ? [
      ...providerOptions,
      {
        value: PICK_BACK,
        label: "Back"
      }
    ] : [
      {
        value: "__no_provider_models__",
        label: "No saved provider models",
        description: "Configure GPT/OpenAI first, or add a saved provider.",
        disabled: true
      },
      {
        value: PICK_BACK,
        label: "Back"
      }
    ];
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Provider Models",
          subtitle: "Choose an existing GPT/OpenAI-compatible model to use."
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options,
          defaultFocusValue: activeProvider && selectableProviders.some((provider) => provider.id === activeProvider.provider.id) ? `${activeProvider.provider.id}:${activeProvider.model}` : providerOptions[0]?.value ?? PICK_BACK,
          visibleOptionCount: Math.min(12, options.length),
          onChange: (value) => {
            if (value === PICK_BACK) {
              setStage("menu");
              return;
            }
            const separator = value.indexOf(":");
            if (separator === -1) {
              return;
            }
            const providerId = value.slice(0, separator);
            const model = value.slice(separator + 1);
            const provider = getInferenceProvider(providerId);
            if (providerId === OPENAI_SETTINGS_PROVIDER_ID && settingsOpenAIProvider) {
              persistSettingsBackedOpenAIProvider({
                name: settingsOpenAIProvider.provider.name,
                baseUrl: settingsOpenAIProvider.provider.baseUrl,
                apiKey: settingsOpenAIProvider.provider.apiKey,
                model,
                models: mergeModelList(settingsOpenAIProvider.provider.models, model)
              });
              onDone(
                applySettingsBackedProviderSelection(
                  setAppState,
                  fastMode,
                  settingsOpenAIProvider.provider,
                  model
                )
              );
              return;
            }
            if (providerId === OPENAI_CODEX_PROVIDER_ID && codexOpenAIProvider) {
              onDone(
                applySettingsBackedProviderSelection(
                  setAppState,
                  fastMode,
                  codexOpenAIProvider.provider,
                  model
                )
              );
              return;
            }
            if (!provider) {
              onDone("Provider not found.", { display: "system" });
              return;
            }
            onDone(applyProviderSelection(setAppState, fastMode, provider, model));
          },
          onCancel: () => setStage("menu")
        }
      )
    ] });
  }
  if (stage === "manage-providers") {
    const options = [
      {
        value: MENU_ADD,
        label: "Add saved provider",
        description: activeProvider?.provider.format === "openai" ? "Save another provider in global config for later use." : "Save an extra Anthropic or OpenAI-compatible provider in global config."
      },
      {
        value: MENU_REFRESH,
        label: "Refresh saved provider models",
        description: "Pull the latest /models list for a saved provider.",
        disabled: providers.length === 0
      },
      {
        value: MENU_REMOVE,
        label: "Remove saved provider",
        description: "Delete a saved provider and its stored model list.",
        disabled: providers.length === 0
      },
      {
        value: MENU_CANCEL,
        label: "Back"
      }
    ];
    return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
      /* @__PURE__ */ jsx(
        Header,
        {
          title: "Provider Management",
          subtitle: "Advanced actions for providers you have saved manually."
        }
      ),
      /* @__PURE__ */ jsx(
        Select,
        {
          options,
          defaultFocusValue: MENU_ADD,
          onChange: (value) => {
            if (value === MENU_ADD) {
              goToAddProvider();
              return;
            }
            if (value === MENU_REFRESH) {
              setStage("refresh");
              return;
            }
            if (value === MENU_REMOVE) {
              setStage("remove");
              return;
            }
            if (value === MENU_CANCEL) {
              setStage("menu");
            }
          },
          onCancel: () => setStage("menu")
        }
      )
    ] });
  }
  const topLevelOptions = [
    {
      value: MENU_SELECT_PROVIDER_MODEL,
      label: "Switch provider model",
      description: providerOptions.length > 0 ? "Choose from your current Codex/Claude/GPT-compatible provider models." : "No saved provider models yet.",
      disabled: providerOptions.length === 0
    },
    {
      value: MENU_OPENAI,
      label: settingsOpenAIProvider ? "Edit GPT/OpenAI config" : "Set up GPT/OpenAI config",
      description: settingsOpenAIProvider ? "Update the shared GPT/OpenAI provider and local API key." : "Create the main GPT/OpenAI-compatible config for this project."
    },
    {
      value: MENU_MANAGE_PROVIDERS,
      label: "Manage saved providers",
      description: "Add, refresh, or remove manually saved providers."
    },
    {
      value: MENU_DEFAULT,
      label: "Use built-in default",
      description: envOpenAIProvider ? `${formatBuiltInDefaultLabel()} · requires clearing OPENAI_* env vars first` : `${formatBuiltInDefaultLabel()}${defaultSelectionActions.length > 0 ? ` · ${defaultSelectionActions.join(" and ")}` : ""}`
    },
    {
      value: MENU_CANCEL,
      label: "Cancel"
    }
  ];
  return /* @__PURE__ */ jsxs(Pane, { color: "permission", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        title: "Model",
        subtitle: `Current model: ${currentLabel}${mainLoopModelForSession ? " (session override)" : ""}`
      }
    ),
    error && /* @__PURE__ */ jsx(Box, { marginBottom: 1, children: /* @__PURE__ */ jsx(Text, { color: "error", children: error }) }),
    /* @__PURE__ */ jsx(
      Select,
      {
        options: topLevelOptions,
        defaultFocusValue: providerOptions.length > 0 ? MENU_SELECT_PROVIDER_MODEL : MENU_OPENAI,
        visibleOptionCount: Math.min(8, topLevelOptions.length),
        onChange: (value) => {
          if (value === MENU_SELECT_PROVIDER_MODEL) {
            setStage("select-provider-model");
            return;
          }
          if (value === MENU_OPENAI) {
            goToConfigureOpenAI();
            return;
          }
          if (value === MENU_MANAGE_PROVIDERS) {
            setStage("manage-providers");
            return;
          }
          if (value === MENU_DEFAULT) {
            if (envOpenAIProvider) {
              onDone(
                "OPENAI_* environment variables are active. Clear them before switching back to the built-in default model.",
                {
                  display: "system"
                }
              );
              return;
            }
            onDone(applyBuiltInModelSelection(setAppState, fastMode, null));
            return;
          }
          if (value === MENU_CANCEL) {
            handleCancel();
            return;
          }
        },
        onCancel: handleCancel
      }
    )
  ] });
}
function SetBuiltInModelAndClose({
  args,
  onDone
}) {
  const fastMode = useAppState((state) => state.fastMode ?? false);
  const setAppState = useSetAppState();
  const activeProvider = React.useMemo(
    () => getActiveInferenceProviderConfig(),
    []
  );
  const envOpenAIProvider = React.useMemo(
    () => getEnvBackedOpenAIProviderConfig(),
    []
  );
  const model = args === "default" ? null : args;
  React.useEffect(() => {
    async function handleModelChange() {
      if (model && !isModelAllowed(model)) {
        onDone(
          `Model '${model}' is not available. Your organization restricts model selection.`,
          {
            display: "system"
          }
        );
        return;
      }
      if (model && isOpus1mUnavailable(model)) {
        onDone(
          "Opus 4.6 with 1M context is not available for your account.",
          {
            display: "system"
          }
        );
        return;
      }
      if (model && isSonnet1mUnavailable(model)) {
        onDone(
          "Sonnet 4.6 with 1M context is not available for your account.",
          {
            display: "system"
          }
        );
        return;
      }
      if (!model && envOpenAIProvider) {
        onDone(
          "OPENAI_* environment variables are active. Clear them before switching back to the built-in default model.",
          {
            display: "system"
          }
        );
        return;
      }
      if (!model) {
        onDone(applyBuiltInModelSelection(setAppState, fastMode, null));
        return;
      }
      if (envOpenAIProvider && (isKnownAlias(model) || model.toLowerCase().includes("pigger"))) {
        onDone(
          "OPENAI_* environment variables are active. Clear them before switching back to built-in Claude models.",
          {
            display: "system"
          }
        );
        return;
      }
      if (isKnownAlias(model)) {
        onDone(applyBuiltInModelSelection(setAppState, fastMode, model));
        return;
      }
      try {
        const validation = await validateModel(model);
        if (!validation.valid) {
          onDone(validation.error || `Model '${model}' not found`, {
            display: "system"
          });
          return;
        }
        if (activeProvider && !isKnownAlias(model) && !model.toLowerCase().includes("pigger")) {
          onDone(
            applyExistingProviderModelSelection(
              setAppState,
              fastMode,
              activeProvider,
              model
            )
          );
          return;
        }
        onDone(applyBuiltInModelSelection(setAppState, fastMode, model));
      } catch (error) {
        onDone(
          `Failed to validate model: ${error instanceof Error ? error.message : String(error)}`,
          {
            display: "system"
          }
        );
      }
    }
    void handleModelChange();
  }, [activeProvider, args, envOpenAIProvider, fastMode, model, onDone, setAppState]);
  return null;
}
function ShowModelAndClose({
  onDone
}) {
  const mainLoopModel = useAppState((state) => state.mainLoopModel);
  const mainLoopModelForSession = useAppState(
    (state) => state.mainLoopModelForSession
  );
  const activeProvider = React.useMemo(
    () => getActiveInferenceProviderConfig(),
    []
  );
  const claudeStatus = React.useMemo(
    () => getClaudeCompatibilityStatus(),
    []
  );
  React.useEffect(() => {
    const current = getCurrentModelLabel(mainLoopModel, mainLoopModelForSession);
    const baseModel = getCurrentModelLabel(mainLoopModel, null);
    const infoLines = [];
    if (activeProvider) {
      infoLines.push(`Provider: ${activeProvider.provider.name}`);
      if (activeProvider.source === "env") {
        infoLines.push("Source: OPENAI_* environment variables");
      } else if (activeProvider.source === "settings") {
        infoLines.push("Source: Pigger settings");
        if (claudeStatus.enabled) {
          infoLines.push(
            `Config source: Claude compatibility (${claudeStatus.configDir})`
          );
        }
      } else if (activeProvider.source === "codex" || activeProvider.origins?.includes("codex")) {
        infoLines.push(
          `Source: Codex compatibility${activeProvider.configDir ? ` (${activeProvider.configDir})` : ""}`
        );
      } else if (activeProvider.source === "mixed") {
        infoLines.push(
          `Source: ${activeProvider.origins?.join(" + ") ?? "mixed OpenAI configuration"}`
        );
      }
    }
    const providerInfo = infoLines.length > 0 ? `
${infoLines.join("\n")}` : "";
    if (mainLoopModelForSession) {
      onDone(
        `Current model: ${chalk.bold(
          renderModelName(mainLoopModelForSession)
        )} (session override)
Base model: ${baseModel}${providerInfo}`
      );
      return;
    }
    onDone(`Current model: ${current}${providerInfo}`);
  }, [activeProvider, claudeStatus.configDir, claudeStatus.enabled, mainLoopModel, mainLoopModelForSession, onDone]);
  return null;
}
const call = async (onDone, _context, args) => {
  const normalizedArgs = args?.trim() || "";
  if (COMMON_INFO_ARGS.includes(normalizedArgs)) {
    return /* @__PURE__ */ jsx(ShowModelAndClose, { onDone });
  }
  if (COMMON_HELP_ARGS.includes(normalizedArgs)) {
    onDone(
      "Run /model to manage built-in models, Pigger/OpenAI-compatible settings, saved providers, and optional Claude/Codex compatibility. OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL are also supported. Use /config to switch between Pigger config, ~/.claude compatibility, and ~/.codex compatibility. Use /model default to clear saved custom provider settings and return to the built-in default model.",
      {
        display: "system"
      }
    );
    return;
  }
  if (normalizedArgs) {
    return /* @__PURE__ */ jsx(SetBuiltInModelAndClose, { args: normalizedArgs, onDone });
  }
  return /* @__PURE__ */ jsx(ModelManager, { onDone });
};
export {
  call
};
