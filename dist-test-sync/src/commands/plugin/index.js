const plugin = {
  type: "local-jsx",
  name: "plugin",
  aliases: ["plugins", "marketplace"],
  description: "Manage pigger plugins",
  immediate: true,
  load: () => import("./plugin.js")
};
var stdin_default = plugin;
export {
  stdin_default as default
};
