var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
import { feature } from "../../__generated__/bun-bundle.js";
import { getFeatureValue_CACHED_MAY_BE_STALE } from "../services/analytics/growthbook.js";
import { logForDebugging } from "../utils/debug.js";
import { isEnvDefinedFalsy } from "../utils/envUtils.js";
import { getAPIProvider } from "../utils/model/providers.js";
import { getWorkload } from "../utils/workloadContext.js";
const DEFAULT_PREFIX = `You are pigger, a local coding CLI assistant.`;
const AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX = `You are pigger, a local coding CLI assistant running inside an agent runtime.`;
const AGENT_SDK_PREFIX = `You are a coding agent running inside pigger's agent runtime.`;
const CLI_SYSPROMPT_PREFIX_VALUES = [
  DEFAULT_PREFIX,
  AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX,
  AGENT_SDK_PREFIX
];
const CLI_SYSPROMPT_PREFIXES = new Set(
  CLI_SYSPROMPT_PREFIX_VALUES
);
function getCLISyspromptPrefix(options) {
  const apiProvider = getAPIProvider();
  if (apiProvider === "vertex") {
    return DEFAULT_PREFIX;
  }
  if (options?.isNonInteractive) {
    if (options.hasAppendSystemPrompt) {
      return AGENT_SDK_CLAUDE_CODE_PRESET_PREFIX;
    }
    return AGENT_SDK_PREFIX;
  }
  return DEFAULT_PREFIX;
}
function isAttributionHeaderEnabled() {
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_ATTRIBUTION_HEADER)) {
    return false;
  }
  return getFeatureValue_CACHED_MAY_BE_STALE("tengu_attribution_header", true);
}
function getAttributionHeader(fingerprint) {
  if (!isAttributionHeaderEnabled()) {
    return "";
  }
  const version = `${define_MACRO_default.VERSION}.${fingerprint}`;
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT ?? "unknown";
  const cch = feature("NATIVE_CLIENT_ATTESTATION") ? " cch=00000;" : "";
  const workload = getWorkload();
  const workloadPair = workload ? ` cc_workload=${workload};` : "";
  const header = `x-anthropic-billing-header: cc_version=${version}; cc_entrypoint=${entrypoint};${cch}${workloadPair}`;
  logForDebugging(`attribution header ${header}`);
  return header;
}
export {
  CLI_SYSPROMPT_PREFIXES,
  getAttributionHeader,
  getCLISyspromptPrefix
};
