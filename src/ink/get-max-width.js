import { LayoutEdge } from "./layout/node.js";
const getMaxWidth = (yogaNode) => {
  return yogaNode.getComputedWidth() - yogaNode.getComputedPadding(LayoutEdge.Left) - yogaNode.getComputedPadding(LayoutEdge.Right) - yogaNode.getComputedBorder(LayoutEdge.Left) - yogaNode.getComputedBorder(LayoutEdge.Right);
};
var stdin_default = getMaxWidth;
export {
  stdin_default as default
};
