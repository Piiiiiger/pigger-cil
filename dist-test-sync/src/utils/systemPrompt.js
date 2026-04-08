import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../__generated__/bun-bundle.js";
import {
  logEvent
} from "../services/analytics/index.js";
import { isBuiltInAgent } from "../tools/AgentTool/loadAgentsDir.js";
import { isEnvTruthy } from "./envUtils.js";
import { asSystemPrompt } from "./systemPromptType.js";
import { asSystemPrompt as asSystemPrompt2 } from "./systemPromptType.js";
const proactiveModule = feature("PROACTIVE") || feature("KAIROS") ? require2("../proactive/index.js") : null;
function isProactiveActive_SAFE_TO_CALL_ANYWHERE() {
  return proactiveModule?.isProactiveActive() ?? false;
}
function buildEffectiveSystemPrompt({
  mainThreadAgentDefinition,
  toolUseContext,
  customSystemPrompt,
  defaultSystemPrompt,
  appendSystemPrompt,
  overrideSystemPrompt
}) {
  if (overrideSystemPrompt) {
    return asSystemPrompt([overrideSystemPrompt]);
  }
  if (feature("COORDINATOR_MODE") && isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE) && !mainThreadAgentDefinition) {
    const { getCoordinatorSystemPrompt } = (
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require2("../coordinator/coordinatorMode.js")
    );
    return asSystemPrompt([
      getCoordinatorSystemPrompt(),
      ...appendSystemPrompt ? [appendSystemPrompt] : []
    ]);
  }
  const agentSystemPrompt = mainThreadAgentDefinition ? isBuiltInAgent(mainThreadAgentDefinition) ? mainThreadAgentDefinition.getSystemPrompt({
    toolUseContext: { options: toolUseContext.options }
  }) : mainThreadAgentDefinition.getSystemPrompt() : void 0;
  if (mainThreadAgentDefinition?.memory) {
    logEvent("tengu_agent_memory_loaded", {
      ...process.env.USER_TYPE === "ant" && {
        agent_type: mainThreadAgentDefinition.agentType
      },
      scope: mainThreadAgentDefinition.memory,
      source: "main-thread"
    });
  }
  if (agentSystemPrompt && (feature("PROACTIVE") || feature("KAIROS")) && isProactiveActive_SAFE_TO_CALL_ANYWHERE()) {
    return asSystemPrompt([
      ...defaultSystemPrompt,
      `
# Custom Agent Instructions
${agentSystemPrompt}`,
      ...appendSystemPrompt ? [appendSystemPrompt] : []
    ]);
  }
  return asSystemPrompt([
    ...agentSystemPrompt ? [agentSystemPrompt] : customSystemPrompt ? [customSystemPrompt] : defaultSystemPrompt,
    ...appendSystemPrompt ? [appendSystemPrompt] : []
  ]);
}
export {
  asSystemPrompt2 as asSystemPrompt,
  buildEffectiveSystemPrompt
};
