var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
import { useState } from "react";
import { major, minor, patch } from "semver";
function getSemverPart(version) {
  return `${major(version, { loose: true })}.${minor(version, { loose: true })}.${patch(version, { loose: true })}`;
}
function shouldShowUpdateNotification(updatedVersion, lastNotifiedSemver) {
  const updatedSemver = getSemverPart(updatedVersion);
  return updatedSemver !== lastNotifiedSemver;
}
function useUpdateNotification(updatedVersion, initialVersion = define_MACRO_default.VERSION) {
  const [lastNotifiedSemver, setLastNotifiedSemver] = useState(
    () => getSemverPart(initialVersion)
  );
  if (!updatedVersion) {
    return null;
  }
  const updatedSemver = getSemverPart(updatedVersion);
  if (updatedSemver !== lastNotifiedSemver) {
    setLastNotifiedSemver(updatedSemver);
    return updatedSemver;
  }
  return null;
}
export {
  getSemverPart,
  shouldShowUpdateNotification,
  useUpdateNotification
};
