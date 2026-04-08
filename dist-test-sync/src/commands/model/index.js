import { shouldInferenceConfigCommandBeImmediate } from "../../utils/immediateCommand.js";
import { getMainLoopModel, renderModelName } from "../../utils/model/model.js";
var stdin_default = {
  type: "local-jsx",
  name: "model",
  get description() {
    return `Manage inference providers, GPT/OpenAI/Codex config, and models (currently ${renderModelName(
      getMainLoopModel()
    )})`;
  },
  argumentHint: "[info|help|default]",
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate();
  },
  load: () => import("./model.js")
};
export {
  stdin_default as default
};
