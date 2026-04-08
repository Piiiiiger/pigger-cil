import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
let cached;
function requireComputerUseInput() {
  if (cached) return cached;
  const input = require2("../../../__generated__/externals/ant-computer-use-input.js");
  if (!input.isSupported) {
    throw new Error("@ant/computer-use-input is not supported on this platform");
  }
  return cached = input;
}
export {
  requireComputerUseInput
};
