const config = {
  aliases: ["settings"],
  type: "local-jsx",
  name: "config",
  description: "Open config panel",
  load: () => import("./config.js")
};
var stdin_default = config;
export {
  stdin_default as default
};
