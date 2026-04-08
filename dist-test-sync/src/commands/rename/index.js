const rename = {
  type: "local-jsx",
  name: "rename",
  description: "Rename the current conversation",
  immediate: true,
  argumentHint: "[name]",
  load: () => import("./rename.js")
};
var stdin_default = rename;
export {
  stdin_default as default
};
