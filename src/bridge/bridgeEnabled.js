var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../__generated__/bun-bundle.js";
import {
  checkGate_CACHED_OR_BLOCKING,
  getDynamicConfig_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE
} from "../services/analytics/growthbook.js";
import * as authModule from "../utils/auth.js";
import { isEnvTruthy } from "../utils/envUtils.js";
import { lt } from "../utils/semver.js";
function isBridgeEnabled() {
  return feature("BRIDGE_MODE") ? isClaudeAISubscriber() && getFeatureValue_CACHED_MAY_BE_STALE("tengu_ccr_bridge", false) : false;
}
async function isBridgeEnabledBlocking() {
  return feature("BRIDGE_MODE") ? isClaudeAISubscriber() && await checkGate_CACHED_OR_BLOCKING("tengu_ccr_bridge") : false;
}
async function getBridgeDisabledReason() {
  if (feature("BRIDGE_MODE")) {
    if (!isClaudeAISubscriber()) {
      return "Remote Control requires a claude.ai subscription. Run `pigger auth login` to sign in with your claude.ai account.";
    }
    if (!hasProfileScope()) {
      return "Remote Control requires a full-scope login token. Long-lived tokens (from `pigger setup-token` or CLAUDE_CODE_OAUTH_TOKEN) are limited to inference-only for security reasons. Run `pigger auth login` to use Remote Control.";
    }
    if (!getOauthAccountInfo()?.organizationUuid) {
      return "Unable to determine your organization for Remote Control eligibility. Run `pigger auth login` to refresh your account information.";
    }
    if (!await checkGate_CACHED_OR_BLOCKING("tengu_ccr_bridge")) {
      return "Remote Control is not yet enabled for your account.";
    }
    return null;
  }
  return "Remote Control is not available in this build.";
}
function isClaudeAISubscriber() {
  try {
    return authModule.isClaudeAISubscriber();
  } catch {
    return false;
  }
}
function hasProfileScope() {
  try {
    return authModule.hasProfileScope();
  } catch {
    return false;
  }
}
function getOauthAccountInfo() {
  try {
    return authModule.getOauthAccountInfo();
  } catch {
    return void 0;
  }
}
function isEnvLessBridgeEnabled() {
  return feature("BRIDGE_MODE") ? getFeatureValue_CACHED_MAY_BE_STALE("tengu_bridge_repl_v2", false) : false;
}
function isCseShimEnabled() {
  return feature("BRIDGE_MODE") ? getFeatureValue_CACHED_MAY_BE_STALE(
    "tengu_bridge_repl_v2_cse_shim_enabled",
    true
  ) : true;
}
function checkBridgeMinVersion() {
  if (feature("BRIDGE_MODE")) {
    const config = getDynamicConfig_CACHED_MAY_BE_STALE("tengu_bridge_min_version", { minVersion: "0.0.0" });
    if (config.minVersion && lt(define_MACRO_default.VERSION, config.minVersion)) {
      return `Your version of pigger (${define_MACRO_default.VERSION}) is too old for Remote Control.
Version ${config.minVersion} or higher is required. Run \`pigger update\` to update.`;
    }
  }
  return null;
}
function getCcrAutoConnectDefault() {
  return feature("CCR_AUTO_CONNECT") ? getFeatureValue_CACHED_MAY_BE_STALE("tengu_cobalt_harbor", false) : false;
}
function isCcrMirrorEnabled() {
  return feature("CCR_MIRROR") ? isEnvTruthy(process.env.CLAUDE_CODE_CCR_MIRROR) || getFeatureValue_CACHED_MAY_BE_STALE("tengu_ccr_mirror", false) : false;
}
export {
  checkBridgeMinVersion,
  getBridgeDisabledReason,
  getCcrAutoConnectDefault,
  isBridgeEnabled,
  isBridgeEnabledBlocking,
  isCcrMirrorEnabled,
  isCseShimEnabled,
  isEnvLessBridgeEnabled
};
