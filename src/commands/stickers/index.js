const stickers = {
  type: "local",
  name: "stickers",
  description: "Order pigger stickers",
  supportsNonInteractive: false,
  load: () => import("./stickers.js")
};
var stdin_default = stickers;
export {
  stdin_default as default
};
