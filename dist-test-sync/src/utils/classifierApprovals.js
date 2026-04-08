import { feature } from "../../__generated__/bun-bundle.js";
import { createSignal } from "./signal.js";
const CLASSIFIER_APPROVALS = /* @__PURE__ */ new Map();
const CLASSIFIER_CHECKING = /* @__PURE__ */ new Set();
const classifierChecking = createSignal();
function setClassifierApproval(toolUseID, matchedRule) {
  if (!feature("BASH_CLASSIFIER")) {
    return;
  }
  CLASSIFIER_APPROVALS.set(toolUseID, {
    classifier: "bash",
    matchedRule
  });
}
function getClassifierApproval(toolUseID) {
  if (!feature("BASH_CLASSIFIER")) {
    return void 0;
  }
  const approval = CLASSIFIER_APPROVALS.get(toolUseID);
  if (!approval || approval.classifier !== "bash") return void 0;
  return approval.matchedRule;
}
function setYoloClassifierApproval(toolUseID, reason) {
  if (!feature("TRANSCRIPT_CLASSIFIER")) {
    return;
  }
  CLASSIFIER_APPROVALS.set(toolUseID, { classifier: "auto-mode", reason });
}
function getYoloClassifierApproval(toolUseID) {
  if (!feature("TRANSCRIPT_CLASSIFIER")) {
    return void 0;
  }
  const approval = CLASSIFIER_APPROVALS.get(toolUseID);
  if (!approval || approval.classifier !== "auto-mode") return void 0;
  return approval.reason;
}
function setClassifierChecking(toolUseID) {
  if (!feature("BASH_CLASSIFIER") && !feature("TRANSCRIPT_CLASSIFIER")) return;
  CLASSIFIER_CHECKING.add(toolUseID);
  classifierChecking.emit();
}
function clearClassifierChecking(toolUseID) {
  if (!feature("BASH_CLASSIFIER") && !feature("TRANSCRIPT_CLASSIFIER")) return;
  CLASSIFIER_CHECKING.delete(toolUseID);
  classifierChecking.emit();
}
const subscribeClassifierChecking = classifierChecking.subscribe;
function isClassifierChecking(toolUseID) {
  return CLASSIFIER_CHECKING.has(toolUseID);
}
function deleteClassifierApproval(toolUseID) {
  CLASSIFIER_APPROVALS.delete(toolUseID);
}
function clearClassifierApprovals() {
  CLASSIFIER_APPROVALS.clear();
  CLASSIFIER_CHECKING.clear();
  classifierChecking.emit();
}
export {
  clearClassifierApprovals,
  clearClassifierChecking,
  deleteClassifierApproval,
  getClassifierApproval,
  getYoloClassifierApproval,
  isClassifierChecking,
  setClassifierApproval,
  setClassifierChecking,
  setYoloClassifierApproval,
  subscribeClassifierChecking
};
