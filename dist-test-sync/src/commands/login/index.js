import { hasAnthropicApiKeyAuth } from "../../utils/auth.js";
import { isEnvTruthy } from "../../utils/envUtils.js";
var stdin_default = () => ({
  type: "local-jsx",
  name: "login",
  description: hasAnthropicApiKeyAuth() ? "Switch Anthropic accounts" : "Sign in with your Anthropic account",
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
  load: () => import("./login.js")
});
export {
  stdin_default as default
};
