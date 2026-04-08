const clear = {
  type: "local",
  name: "clear",
  description: "Clear conversation history and free up context",
  aliases: ["reset", "new"],
  supportsNonInteractive: false,
  // Should just create a new session
  load: () => import("./clear.js")
};
var stdin_default = clear;
export {
  stdin_default as default
};
