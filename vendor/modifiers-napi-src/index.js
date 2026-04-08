import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
let cachedModule = null;
function loadModule() {
  if (cachedModule) {
    return cachedModule;
  }
  if (process.platform !== "darwin") {
    return null;
  }
  try {
    if (process.env.MODIFIERS_NODE_PATH) {
      cachedModule = require2(process.env.MODIFIERS_NODE_PATH);
    } else {
      const modulePath = join(
        dirname(fileURLToPath(import.meta.url)),
        "..",
        "modifiers-napi",
        `${process.arch}-darwin`,
        "modifiers.node"
      );
      cachedModule = createRequire(import.meta.url)(modulePath);
    }
    return cachedModule;
  } catch {
    return null;
  }
}
function getModifiers() {
  const mod = loadModule();
  if (!mod) {
    return [];
  }
  return mod.getModifiers();
}
function isModifierPressed(modifier) {
  const mod = loadModule();
  if (!mod) {
    return false;
  }
  return mod.isModifierPressed(modifier);
}
function prewarm() {
  loadModule();
}
export {
  getModifiers,
  isModifierPressed,
  prewarm
};
