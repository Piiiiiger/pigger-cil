const stats = {
  type: "local-jsx",
  name: "stats",
  description: "Show your pigger usage statistics and activity",
  load: () => import("./stats.js")
};
var stdin_default = stats;
export {
  stdin_default as default
};
