import {
  ColorDiff,
  ColorFile,
  getSyntaxTheme as nativeGetSyntaxTheme
} from "../../native-ts/color-diff/index.js";
import { isEnvDefinedFalsy } from "../../utils/envUtils.js";
function getColorModuleUnavailableReason() {
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT)) {
    return "env";
  }
  return null;
}
function expectColorDiff() {
  return getColorModuleUnavailableReason() === null ? ColorDiff : null;
}
function expectColorFile() {
  return getColorModuleUnavailableReason() === null ? ColorFile : null;
}
function getSyntaxTheme(themeName) {
  return getColorModuleUnavailableReason() === null ? nativeGetSyntaxTheme(themeName) : null;
}
export {
  expectColorDiff,
  expectColorFile,
  getColorModuleUnavailableReason,
  getSyntaxTheme
};
