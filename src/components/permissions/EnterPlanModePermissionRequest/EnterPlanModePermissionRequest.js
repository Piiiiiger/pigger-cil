import { jsx, jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import { handlePlanModeTransition } from "../../../bootstrap/state.js";
import { Box, Text } from "../../../ink.js";
import { logEvent } from "../../../services/analytics/index.js";
import { useAppState } from "../../../state/AppState.js";
import { isPlanModeInterviewPhaseEnabled } from "../../../utils/planModeV2.js";
import { Select } from "../../CustomSelect/index.js";
import { PermissionDialog } from "../PermissionDialog.js";
function EnterPlanModePermissionRequest(t0) {
  const $ = _c(18);
  const {
    toolUseConfirm,
    onDone,
    onReject,
    workerBadge
  } = t0;
  const toolPermissionContextMode = useAppState(_temp);
  let t1;
  if ($[0] !== onDone || $[1] !== onReject || $[2] !== toolPermissionContextMode || $[3] !== toolUseConfirm) {
    t1 = function handleResponse2(value) {
      if (value === "yes") {
        logEvent("tengu_plan_enter", {
          interviewPhaseEnabled: isPlanModeInterviewPhaseEnabled(),
          entryMethod: "tool"
        });
        handlePlanModeTransition(toolPermissionContextMode, "plan");
        onDone();
        toolUseConfirm.onAllow({}, [{
          type: "setMode",
          mode: "plan",
          destination: "session"
        }]);
      } else {
        onDone();
        onReject();
        toolUseConfirm.onReject();
      }
    };
    $[0] = onDone;
    $[1] = onReject;
    $[2] = toolPermissionContextMode;
    $[3] = toolUseConfirm;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const handleResponse = t1;
  let t2;
  if ($[5] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx(Text, { children: "pigger 想进入计划模式，以便先做探索并设计实现方案。" });
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  let t3;
  if ($[6] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
    t3 = /* @__PURE__ */ jsxs(Box, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "在计划模式中，pigger 会：" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " · 更完整地探索代码库" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " · 识别现有实现模式" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " · 设计实现策略" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " · 先给出计划，再等你确认" })
    ] });
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
    t4 = /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsx(Text, { dimColor: true, children: "在你确认计划之前，不会进行任何代码修改。" }) });
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
    t5 = {
      label: "是，进入计划模式",
      value: "yes"
    };
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  let t6;
  if ($[9] === /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel")) {
    t6 = [t5, {
      label: "否，直接开始实现",
      value: "no"
    }];
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  let t7;
  if ($[10] !== handleResponse) {
    t7 = () => handleResponse("no");
    $[10] = handleResponse;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  let t8;
  if ($[12] !== handleResponse || $[13] !== t7) {
    t8 = /* @__PURE__ */ jsxs(Box, { flexDirection: "column", marginTop: 1, paddingX: 1, children: [
      t2,
      t3,
      t4,
      /* @__PURE__ */ jsx(Box, { marginTop: 1, children: /* @__PURE__ */ jsx(Select, { options: t6, onChange: handleResponse, onCancel: t7 }) })
    ] });
    $[12] = handleResponse;
    $[13] = t7;
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  let t9;
  if ($[15] !== t8 || $[16] !== workerBadge) {
    t9 = /* @__PURE__ */ jsx(PermissionDialog, { color: "planMode", title: "进入计划模式？", workerBadge, children: t8 });
    $[15] = t8;
    $[16] = workerBadge;
    $[17] = t9;
  } else {
    t9 = $[17];
  }
  return t9;
}
function _temp(s) {
  return s.toolPermissionContext.mode;
}
export {
  EnterPlanModePermissionRequest
};
