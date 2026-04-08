const mcp = {
  type: "local-jsx",
  name: "mcp",
  description: "Manage MCP servers",
  immediate: true,
  argumentHint: "[enable|disable [server-name]]",
  load: () => import("./mcp.js")
};
var stdin_default = mcp;
export {
  stdin_default as default
};
