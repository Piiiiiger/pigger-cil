const resume = {
  type: "local-jsx",
  name: "resume",
  description: "Resume a previous conversation",
  aliases: ["continue"],
  argumentHint: "[conversation id or search term]",
  load: () => import("./resume.js")
};
var stdin_default = resume;
export {
  stdin_default as default
};
