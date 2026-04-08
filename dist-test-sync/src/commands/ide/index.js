const ide = {
  type: "local-jsx",
  name: "ide",
  description: "Manage IDE integrations and show status",
  argumentHint: "[open]",
  load: () => import("./ide.js")
};
var stdin_default = ide;
export {
  stdin_default as default
};
