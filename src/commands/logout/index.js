import { isEnvTruthy } from "../../utils/envUtils.js";
var stdin_default = {
  type: "local-jsx",
  name: "logout",
  description: "Sign out from your Anthropic account",
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGOUT_COMMAND),
  load: () => import("./logout.js")
};
export {
  stdin_default as default
};
