import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
let cached;
function requireComputerUseSwift() {
  if (process.platform !== "darwin") {
    throw new Error("@ant/computer-use-swift is macOS-only");
  }
  return cached ??= require2("../../../__generated__/externals/ant-computer-use-swift.js");
}
export {
  requireComputerUseSwift
};
