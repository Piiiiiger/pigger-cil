import { feature } from "../../../__generated__/bun-bundle.js";
import { logForDebugging } from "../debug.js";
import {
  getAutoModeUnavailableReason,
  isAutoModeGateEnabled,
  transitionPermissionMode
} from "./permissionSetup.js";
function canCycleToAuto(ctx) {
  if (feature("TRANSCRIPT_CLASSIFIER")) {
    const gateEnabled = isAutoModeGateEnabled();
    const can = !!ctx.isAutoModeAvailable && gateEnabled;
    if (!can) {
      logForDebugging(
        `[auto-mode] canCycleToAuto=false: ctx.isAutoModeAvailable=${ctx.isAutoModeAvailable} isAutoModeGateEnabled=${gateEnabled} reason=${getAutoModeUnavailableReason()}`
      );
    }
    return can;
  }
  return false;
}
function getNextPermissionMode(toolPermissionContext, _teamContext) {
  switch (toolPermissionContext.mode) {
    case "default":
      if (process.env.USER_TYPE === "ant") {
        if (toolPermissionContext.isBypassPermissionsModeAvailable) {
          return "bypassPermissions";
        }
        if (canCycleToAuto(toolPermissionContext)) {
          return "auto";
        }
        return "default";
      }
      return "acceptEdits";
    case "acceptEdits":
      return "plan";
    case "plan":
      if (toolPermissionContext.isBypassPermissionsModeAvailable) {
        return "bypassPermissions";
      }
      if (canCycleToAuto(toolPermissionContext)) {
        return "auto";
      }
      return "default";
    case "bypassPermissions":
      if (canCycleToAuto(toolPermissionContext)) {
        return "auto";
      }
      return "default";
    case "dontAsk":
      return "default";
    default:
      return "default";
  }
}
function cyclePermissionMode(toolPermissionContext, teamContext) {
  const nextMode = getNextPermissionMode(toolPermissionContext, teamContext);
  return {
    nextMode,
    context: transitionPermissionMode(
      toolPermissionContext.mode,
      nextMode,
      toolPermissionContext
    )
  };
}
export {
  cyclePermissionMode,
  getNextPermissionMode
};
