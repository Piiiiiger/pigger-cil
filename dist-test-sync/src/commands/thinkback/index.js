import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from "../../services/analytics/growthbook.js";
const thinkback = {
  type: "local-jsx",
  name: "think-back",
  description: "Your 2025 pigger Year in Review",
  isEnabled: () => checkStatsigFeatureGate_CACHED_MAY_BE_STALE("tengu_thinkback"),
  load: () => import("./thinkback.js")
};
var stdin_default = thinkback;
export {
  stdin_default as default
};
