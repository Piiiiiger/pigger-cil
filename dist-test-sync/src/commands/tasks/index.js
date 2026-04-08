const tasks = {
  type: "local-jsx",
  name: "tasks",
  aliases: ["bashes"],
  description: "List and manage background tasks",
  load: () => import("./tasks.js")
};
var stdin_default = tasks;
export {
  stdin_default as default
};
