const exit = {
  type: "local-jsx",
  name: "exit",
  aliases: ["quit"],
  description: "Exit the REPL",
  immediate: true,
  load: () => import("./exit.js")
};
var stdin_default = exit;
export {
  stdin_default as default
};
