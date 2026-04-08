import {
  hasUsedBackslashReturn,
  isShiftEnterKeyBindingInstalled
} from "../../commands/terminalSetup/terminalSetup.js";
import { getGlobalConfig } from "../../utils/config.js";
import { env } from "../../utils/env.js";
function isVimModeEnabled() {
  const config = getGlobalConfig();
  return config.editorMode === "vim";
}
function getNewlineInstructions() {
  if (env.terminal === "Apple_Terminal" && process.platform === "darwin") {
    return "shift + ⏎ for newline";
  }
  if (isShiftEnterKeyBindingInstalled()) {
    return "shift + ⏎ for newline";
  }
  return hasUsedBackslashReturn() ? "\\⏎ for newline" : "backslash (\\) + return (⏎) for newline";
}
function isNonSpacePrintable(input, key) {
  if (key.ctrl || key.meta || key.escape || key.return || key.tab || key.backspace || key.delete || key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.pageUp || key.pageDown || key.home || key.end) {
    return false;
  }
  return input.length > 0 && !/^\s/.test(input) && !input.startsWith("\x1B");
}
export {
  getNewlineInstructions,
  isNonSpacePrintable,
  isVimModeEnabled
};
