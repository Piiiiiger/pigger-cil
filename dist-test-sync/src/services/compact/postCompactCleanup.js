import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../../__generated__/bun-bundle.js";
import { clearSystemPromptSections } from "../../constants/systemPromptSections.js";
import { getUserContext } from "../../context.js";
import { clearSpeculativeChecks } from "../../tools/BashTool/bashPermissions.js";
import { clearClassifierApprovals } from "../../utils/classifierApprovals.js";
import { resetGetMemoryFilesCache } from "../../utils/claudemd.js";
import { clearSessionMessagesCache } from "../../utils/sessionStorage.js";
import { clearBetaTracingState } from "../../utils/telemetry/betaSessionTracing.js";
import { resetMicrocompactState } from "./microCompact.js";
function runPostCompactCleanup(querySource) {
  const isMainThreadCompact = querySource === void 0 || querySource.startsWith("repl_main_thread") || querySource === "sdk";
  resetMicrocompactState();
  if (feature("CONTEXT_COLLAPSE")) {
    if (isMainThreadCompact) {
      ;
      require2("../contextCollapse/index.js").resetContextCollapse();
    }
  }
  if (isMainThreadCompact) {
    getUserContext.cache.clear?.();
    resetGetMemoryFilesCache("compact");
  }
  clearSystemPromptSections();
  clearClassifierApprovals();
  clearSpeculativeChecks();
  clearBetaTracingState();
  if (feature("COMMIT_ATTRIBUTION")) {
    void import("../../utils/attributionHooks.js").then(
      (m) => m.sweepFileContentCache()
    );
  }
  clearSessionMessagesCache();
}
export {
  runPostCompactCleanup
};
