const btw = {
  type: "local-jsx",
  name: "btw",
  description: "Ask a quick side question without interrupting the main conversation",
  immediate: true,
  argumentHint: "<question>",
  load: () => import("./btw.js")
};
var stdin_default = btw;
export {
  stdin_default as default
};
