import { feature } from "../../__generated__/bun-bundle.js";
let DENIALS = [];
const MAX_DENIALS = 20;
function recordAutoModeDenial(denial) {
  if (!feature("TRANSCRIPT_CLASSIFIER")) return;
  DENIALS = [denial, ...DENIALS.slice(0, MAX_DENIALS - 1)];
}
function getAutoModeDenials() {
  return DENIALS;
}
export {
  getAutoModeDenials,
  recordAutoModeDenial
};
