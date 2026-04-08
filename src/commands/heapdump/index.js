const heapDump = {
  type: "local",
  name: "heapdump",
  description: "Dump the JS heap to ~/Desktop",
  isHidden: true,
  supportsNonInteractive: true,
  load: () => import("./heapdump.js")
};
var stdin_default = heapDump;
export {
  stdin_default as default
};
