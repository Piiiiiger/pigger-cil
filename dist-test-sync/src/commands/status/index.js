const status = {
  type: "local-jsx",
  name: "status",
  description: "Show pigger status including version, model, account, API connectivity, and tool statuses",
  immediate: true,
  load: () => import("./status.js")
};
var stdin_default = status;
export {
  stdin_default as default
};
