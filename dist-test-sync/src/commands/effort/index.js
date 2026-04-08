import { shouldInferenceConfigCommandBeImmediate } from "../../utils/immediateCommand.js";
var stdin_default = {
  type: "local-jsx",
  name: "effort",
  description: "Set effort level for model usage",
  argumentHint: "[low|medium|high|max|auto]",
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate();
  },
  load: () => import("./effort.js")
};
export {
  stdin_default as default
};
