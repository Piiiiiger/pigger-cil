var define_MACRO_default = { VERSION: "0.0.1", PACKAGE_URL: "pigger", README_URL: null, FEEDBACK_CHANNEL: null, BUILD_TIME: "2026-03-31T13:59:20.008Z", ISSUES_EXPLAINER: "use /feedback to submit a bug report or feature request", NATIVE_PACKAGE_URL: null, VERSION_CHANGELOG: null };
const call = async () => {
  return {
    type: "text",
    value: define_MACRO_default.BUILD_TIME ? `${define_MACRO_default.VERSION} (built ${define_MACRO_default.BUILD_TIME})` : define_MACRO_default.VERSION
  };
};
const version = {
  type: "local",
  name: "version",
  description: "Print the version this session is running (not what autoupdate downloaded)",
  isEnabled: () => process.env.USER_TYPE === "ant",
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call })
};
var stdin_default = version;
export {
  stdin_default as default
};
