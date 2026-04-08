import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
let cachedModule = null;
let loadAttempted = false;
function getNativeModule() {
  if (loadAttempted) return cachedModule;
  loadAttempted = true;
  try {
    cachedModule = require2("../../image-processor.js");
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}
function sharp(input) {
  let processorPromise = null;
  const operations = [];
  let appliedOperationsCount = 0;
  async function ensureProcessor() {
    if (!processorPromise) {
      processorPromise = (async () => {
        const mod = getNativeModule();
        if (!mod) {
          throw new Error("Native image processor module not available");
        }
        return mod.processImage(input);
      })();
    }
    return processorPromise;
  }
  function applyPendingOperations(proc) {
    for (let i = appliedOperationsCount; i < operations.length; i++) {
      const op = operations[i];
      if (op) {
        op(proc);
      }
    }
    appliedOperationsCount = operations.length;
  }
  const instance = {
    async metadata() {
      const proc = await ensureProcessor();
      return proc.metadata();
    },
    resize(width, height, options) {
      operations.push((proc) => {
        proc.resize(width, height, options);
      });
      return instance;
    },
    jpeg(options) {
      operations.push((proc) => {
        proc.jpeg(options?.quality);
      });
      return instance;
    },
    png(options) {
      operations.push((proc) => {
        proc.png(options);
      });
      return instance;
    },
    webp(options) {
      operations.push((proc) => {
        proc.webp(options?.quality);
      });
      return instance;
    },
    async toBuffer() {
      const proc = await ensureProcessor();
      applyPendingOperations(proc);
      return proc.toBuffer();
    }
  };
  return instance;
}
var stdin_default = sharp;
export {
  stdin_default as default,
  getNativeModule,
  sharp
};
