const outputStyle = {
  type: "local-jsx",
  name: "output-style",
  description: "Deprecated: use /config to change output style",
  isHidden: true,
  load: () => import("./output-style.js")
};
var stdin_default = outputStyle;
export {
  stdin_default as default
};
