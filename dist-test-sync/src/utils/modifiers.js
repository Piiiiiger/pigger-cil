import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
let prewarmed = false;
function prewarmModifiers() {
  if (prewarmed || process.platform !== "darwin") {
    return;
  }
  prewarmed = true;
  try {
    const { prewarm } = require2("../../vendor/modifiers-napi-src/index.js");
    prewarm();
  } catch {
  }
}
function isModifierPressed(modifier) {
  if (process.platform !== "darwin") {
    return false;
  }
  const { isModifierPressed: nativeIsModifierPressed } = (
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require2("../../vendor/modifiers-napi-src/index.js")
  );
  return nativeIsModifierPressed(modifier);
}
export {
  isModifierPressed,
  prewarmModifiers
};
