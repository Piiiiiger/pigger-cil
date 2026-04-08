import memoize from "lodash-es/memoize.js";
import { join } from "path";
import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig
} from "./utils/config.js";
import { getCwd } from "./utils/cwd.js";
import { isDirEmpty } from "./utils/file.js";
import { getFsImplementation } from "./utils/fsOperations.js";
import { getMemoryFilePathCandidates } from "./utils/piggerPaths.js";
function getSteps() {
  const fs = getFsImplementation();
  const hasPiggerMd = getMemoryFilePathCandidates(getCwd(), "standard").some(
    (path) => fs.existsSync(path)
  );
  const isWorkspaceDirEmpty = isDirEmpty(getCwd());
  return [
    {
      key: "workspace",
      text: "让 pigger 创建一个新应用，或克隆一个仓库",
      isComplete: false,
      isCompletable: true,
      isEnabled: isWorkspaceDirEmpty
    },
    {
      key: "claudemd",
      text: "运行 /init，为当前项目生成供 pigger 使用的 PIGGER.md 说明文件",
      isComplete: hasPiggerMd,
      isCompletable: true,
      isEnabled: !isWorkspaceDirEmpty
    }
  ];
}
function isProjectOnboardingComplete() {
  return getSteps().filter(({ isCompletable, isEnabled }) => isCompletable && isEnabled).every(({ isComplete }) => isComplete);
}
function maybeMarkProjectOnboardingComplete() {
  if (getCurrentProjectConfig().hasCompletedProjectOnboarding) {
    return;
  }
  if (isProjectOnboardingComplete()) {
    saveCurrentProjectConfig((current) => ({
      ...current,
      hasCompletedProjectOnboarding: true
    }));
  }
}
const shouldShowProjectOnboarding = memoize(() => {
  const projectConfig = getCurrentProjectConfig();
  if (projectConfig.hasCompletedProjectOnboarding || projectConfig.projectOnboardingSeenCount >= 4 || process.env.IS_DEMO) {
    return false;
  }
  return !isProjectOnboardingComplete();
});
function incrementProjectOnboardingSeenCount() {
  saveCurrentProjectConfig((current) => ({
    ...current,
    projectOnboardingSeenCount: current.projectOnboardingSeenCount + 1
  }));
}
export {
  getSteps,
  incrementProjectOnboardingSeenCount,
  isProjectOnboardingComplete,
  maybeMarkProjectOnboardingComplete,
  shouldShowProjectOnboarding
};
