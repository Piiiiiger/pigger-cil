const help = {
  type: "local-jsx",
  name: "help",
  description: "Show help and available commands",
  load: () => import("./help.js")
};
var stdin_default = help;
export {
  stdin_default as default
};
