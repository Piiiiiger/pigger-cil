import { isClaudeAISubscriber } from "../../utils/auth.js";
const cost = {
  type: "local",
  name: "cost",
  description: "Show the total cost and duration of the current session",
  get isHidden() {
    if (process.env.USER_TYPE === "ant") {
      return false;
    }
    return isClaudeAISubscriber();
  },
  supportsNonInteractive: true,
  load: () => import("./cost.js")
};
var stdin_default = cost;
export {
  stdin_default as default
};
