import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../__generated__/bun-bundle.js";
import { initAutoDream } from "../services/autoDream/autoDream.js";
import { initMagicDocs } from "../services/MagicDocs/magicDocs.js";
import { initSkillImprovement } from "./hooks/skillImprovement.js";
const extractMemoriesModule = feature("EXTRACT_MEMORIES") ? require2("../services/extractMemories/extractMemories.js") : null;
const registerProtocolModule = feature("LODESTONE") ? require2("./deepLink/registerProtocol.js") : null;
import { getIsInteractive, getLastInteractionTime } from "../bootstrap/state.js";
import {
  cleanupNpmCacheForAnthropicPackages,
  cleanupOldMessageFilesInBackground,
  cleanupOldVersionsThrottled
} from "./cleanup.js";
import { cleanupOldVersions } from "./nativeInstaller/index.js";
import { autoUpdateMarketplacesAndPluginsInBackground } from "./plugins/pluginAutoupdate.js";
const RECURRING_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1e3;
const DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION = 10 * 60 * 1e3;
function startBackgroundHousekeeping() {
  void initMagicDocs();
  void initSkillImprovement();
  if (feature("EXTRACT_MEMORIES")) {
    extractMemoriesModule.initExtractMemories();
  }
  initAutoDream();
  void autoUpdateMarketplacesAndPluginsInBackground();
  if (feature("LODESTONE") && getIsInteractive()) {
    void registerProtocolModule.ensureDeepLinkProtocolRegistered();
  }
  let needsCleanup = true;
  async function runVerySlowOps() {
    if (getIsInteractive() && getLastInteractionTime() > Date.now() - 1e3 * 60) {
      setTimeout(
        runVerySlowOps,
        DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION
      ).unref();
      return;
    }
    if (needsCleanup) {
      needsCleanup = false;
      await cleanupOldMessageFilesInBackground();
    }
    if (getIsInteractive() && getLastInteractionTime() > Date.now() - 1e3 * 60) {
      setTimeout(
        runVerySlowOps,
        DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION
      ).unref();
      return;
    }
    await cleanupOldVersions();
  }
  setTimeout(
    runVerySlowOps,
    DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION
  ).unref();
  if (process.env.USER_TYPE === "ant") {
    const interval = setInterval(() => {
      void cleanupNpmCacheForAnthropicPackages();
      void cleanupOldVersionsThrottled();
    }, RECURRING_CLEANUP_INTERVAL_MS);
    interval.unref();
  }
}
export {
  startBackgroundHousekeeping
};
