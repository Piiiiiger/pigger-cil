import { jsx } from "react/jsx-runtime";
import { feature } from "../../../__generated__/bun-bundle.js";
import { useContext, useMemo } from "react";
import { getKairosActive, getUserMsgOptIn } from "../../bootstrap/state.js";
import { Box } from "../../ink.js";
import { getFeatureValue_CACHED_MAY_BE_STALE } from "../../services/analytics/growthbook.js";
import { useAppState } from "../../state/AppState.js";
import { isEnvTruthy } from "../../utils/envUtils.js";
import { logError } from "../../utils/log.js";
import { countCharInString } from "../../utils/stringUtils.js";
import { MessageActionsSelectedContext } from "../messageActions.js";
import { HighlightedThinkingText } from "./HighlightedThinkingText.js";
const MAX_DISPLAY_CHARS = 1e4;
const TRUNCATE_HEAD_CHARS = 2500;
const TRUNCATE_TAIL_CHARS = 2500;
function UserPromptMessage({
  addMargin,
  param: {
    text
  },
  isTranscriptMode,
  timestamp
}) {
  const isBriefOnly = feature("KAIROS") || feature("KAIROS_BRIEF") ? (
    // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
    useAppState((s) => s.isBriefOnly)
  ) : false;
  const viewingAgentTaskId = feature("KAIROS") || feature("KAIROS_BRIEF") ? (
    // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
    useAppState((s_0) => s_0.viewingAgentTaskId)
  ) : null;
  const briefEnvEnabled = feature("KAIROS") || feature("KAIROS_BRIEF") ? (
    // biome-ignore lint/correctness/useHookAtTopLevel: feature() is a compile-time constant
    useMemo(() => isEnvTruthy(process.env.CLAUDE_CODE_BRIEF), [])
  ) : false;
  const useBriefLayout = feature("KAIROS") || feature("KAIROS_BRIEF") ? (getKairosActive() || getUserMsgOptIn() && (briefEnvEnabled || getFeatureValue_CACHED_MAY_BE_STALE("tengu_kairos_brief", false))) && isBriefOnly && !isTranscriptMode && !viewingAgentTaskId : false;
  const displayText = useMemo(() => {
    if (text.length <= MAX_DISPLAY_CHARS) return text;
    const head = text.slice(0, TRUNCATE_HEAD_CHARS);
    const tail = text.slice(-TRUNCATE_TAIL_CHARS);
    const hiddenLines = countCharInString(text, "\n", TRUNCATE_HEAD_CHARS) - countCharInString(tail, "\n");
    return `${head}
… +${hiddenLines} lines …
${tail}`;
  }, [text]);
  const isSelected = useContext(MessageActionsSelectedContext);
  if (!text) {
    logError(new Error("No content found in user prompt message"));
    return null;
  }
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, backgroundColor: isSelected ? "messageActionsBackground" : useBriefLayout ? void 0 : "userMessageBackground", paddingRight: useBriefLayout ? 0 : 1, children: /* @__PURE__ */ jsx(HighlightedThinkingText, { text: displayText, useBriefLayout, timestamp: useBriefLayout ? timestamp : void 0 }) });
}
export {
  UserPromptMessage
};
