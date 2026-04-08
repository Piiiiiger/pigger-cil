const measureElement = (node) => ({
  width: node.yogaNode?.getComputedWidth() ?? 0,
  height: node.yogaNode?.getComputedHeight() ?? 0
});
var stdin_default = measureElement;
export {
  stdin_default as default
};
