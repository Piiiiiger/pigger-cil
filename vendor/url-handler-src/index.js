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
    if (process.env.URL_HANDLER_NODE_PATH) {
      cachedModule = require2(process.env.URL_HANDLER_NODE_PATH);
    } else {
      const modulePath = join(
        dirname(fileURLToPath(import.meta.url)),
        "..",
        "url-handler",
        `${process.arch}-darwin`,
        "url-handler.node"
      );
      cachedModule = createRequire(import.meta.url)(modulePath);
    }
    return cachedModule;
  } catch {
    return null;
  }
}
function waitForUrlEvent(timeoutMs) {
  const mod = loadModule();
  if (!mod) {
    return null;
  }
  return mod.waitForUrlEvent(timeoutMs);
}
export {
  waitForUrlEvent
};
