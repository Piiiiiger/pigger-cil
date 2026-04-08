import { isConsumerSubscriber } from "../../utils/auth.js";
const privacySettings = {
  type: "local-jsx",
  name: "privacy-settings",
  description: "View and update your privacy settings",
  isEnabled: () => {
    return isConsumerSubscriber();
  },
  load: () => import("./privacy-settings.js")
};
var stdin_default = privacySettings;
export {
  stdin_default as default
};
