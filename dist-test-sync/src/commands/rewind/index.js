const rewind = {
  description: `Restore the code and/or conversation to a previous point`,
  name: "rewind",
  aliases: ["checkpoint"],
  argumentHint: "",
  type: "local",
  supportsNonInteractive: false,
  load: () => import("./rewind.js")
};
var stdin_default = rewind;
export {
  stdin_default as default
};
