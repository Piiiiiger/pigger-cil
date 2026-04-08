import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from "../../services/analytics/growthbook.js";
const thinkbackPlay = {
  type: "local",
  name: "thinkback-play",
  description: "Play the thinkback animation",
  isEnabled: () => checkStatsigFeatureGate_CACHED_MAY_BE_STALE("tengu_thinkback"),
  isHidden: true,
  supportsNonInteractive: false,
  load: () => import("./thinkback-play.js")
};
var stdin_default = thinkbackPlay;
export {
  stdin_default as default
};
