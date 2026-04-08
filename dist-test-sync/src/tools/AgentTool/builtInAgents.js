import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../../__generated__/bun-bundle.js";
import { getIsNonInteractiveSession } from "../../bootstrap/state.js";
import { getFeatureValue_CACHED_MAY_BE_STALE } from "../../services/analytics/growthbook.js";
import { isEnvTruthy } from "../../utils/envUtils.js";
import { CLAUDE_CODE_GUIDE_AGENT } from "./built-in/claudeCodeGuideAgent.js";
import { EXPLORE_AGENT } from "./built-in/exploreAgent.js";
import { GENERAL_PURPOSE_AGENT } from "./built-in/generalPurposeAgent.js";
import { PLAN_AGENT } from "./built-in/planAgent.js";
import { STATUSLINE_SETUP_AGENT } from "./built-in/statuslineSetup.js";
import { VERIFICATION_AGENT } from "./built-in/verificationAgent.js";
function areExplorePlanAgentsEnabled() {
  if (feature("BUILTIN_EXPLORE_PLAN_AGENTS")) {
    return getFeatureValue_CACHED_MAY_BE_STALE("tengu_amber_stoat", true);
  }
  return false;
}
function getBuiltInAgents() {
  if (isEnvTruthy(process.env.CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS) && getIsNonInteractiveSession()) {
    return [];
  }
  if (feature("COORDINATOR_MODE")) {
    if (isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)) {
      const { getCoordinatorAgents } = require2("../../coordinator/workerAgent.js");
      return getCoordinatorAgents();
    }
  }
  const agents = [
    GENERAL_PURPOSE_AGENT,
    STATUSLINE_SETUP_AGENT
  ];
  if (areExplorePlanAgentsEnabled()) {
    agents.push(EXPLORE_AGENT, PLAN_AGENT);
  }
  const isNonSdkEntrypoint = process.env.CLAUDE_CODE_ENTRYPOINT !== "sdk-ts" && process.env.CLAUDE_CODE_ENTRYPOINT !== "sdk-py" && process.env.CLAUDE_CODE_ENTRYPOINT !== "sdk-cli";
  if (isNonSdkEntrypoint) {
    agents.push(CLAUDE_CODE_GUIDE_AGENT);
  }
  if (feature("VERIFICATION_AGENT") && getFeatureValue_CACHED_MAY_BE_STALE("tengu_hive_evidence", false)) {
    agents.push(VERIFICATION_AGENT);
  }
  return agents;
}
export {
  areExplorePlanAgentsEnabled,
  getBuiltInAgents
};
