const agents = {
  type: "local-jsx",
  name: "agents",
  description: "Manage agent configurations",
  load: () => import("./agents.js")
};
var stdin_default = agents;
export {
  stdin_default as default
};
