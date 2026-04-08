const hooks = {
  type: "local-jsx",
  name: "hooks",
  description: "View hook configurations for tool events",
  immediate: true,
  load: () => import("./hooks.js")
};
var stdin_default = hooks;
export {
  stdin_default as default
};
