var stdin_default = {
  type: "local-jsx",
  name: "usage",
  description: "Show plan usage limits",
  availability: ["claude-ai"],
  load: () => import("./usage.js")
};
export {
  stdin_default as default
};
