const plan = {
  type: "local-jsx",
  name: "plan",
  description: "Enable plan mode or view the current session plan",
  argumentHint: "[open|<description>]",
  load: () => import("./plan.js")
};
var stdin_default = plan;
export {
  stdin_default as default
};
