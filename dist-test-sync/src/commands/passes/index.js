import {
  checkCachedPassesEligibility,
  getCachedReferrerReward
} from "../../services/api/referral.js";
var stdin_default = {
  type: "local-jsx",
  name: "passes",
  get description() {
    const reward = getCachedReferrerReward();
    if (reward) {
      return "Share a free week of pigger with friends and earn extra usage";
    }
    return "Share a free week of pigger with friends";
  },
  get isHidden() {
    const { eligible, hasCache } = checkCachedPassesEligibility();
    return !eligible || !hasCache;
  },
  load: () => import("./passes.js")
};
export {
  stdin_default as default
};
