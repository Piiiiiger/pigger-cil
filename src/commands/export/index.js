const exportCommand = {
  type: "local-jsx",
  name: "export",
  description: "Export the current conversation to a file or clipboard",
  argumentHint: "[filename]",
  load: () => import("./export.js")
};
var stdin_default = exportCommand;
export {
  stdin_default as default
};
