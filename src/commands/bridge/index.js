import { feature } from "../../../__generated__/bun-bundle.js";
import { isBridgeEnabled } from "../../bridge/bridgeEnabled.js";
function isEnabled() {
  if (!feature("BRIDGE_MODE")) {
    return false;
  }
  return isBridgeEnabled();
}
const bridge = {
  type: "local-jsx",
  name: "remote-control",
  aliases: ["rc"],
  description: "Connect this terminal for remote-control sessions",
  argumentHint: "[name]",
  isEnabled,
  get isHidden() {
    return !isEnabled();
  },
  immediate: true,
  load: () => import("./bridge.js")
};
var stdin_default = bridge;
export {
  stdin_default as default
};
