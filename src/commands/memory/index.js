const memory = {
  type: "local-jsx",
  name: "memory",
  description: "编辑 pigger 记忆文件",
  load: () => import("./memory.js")
};
var stdin_default = memory;
export {
  stdin_default as default
};
