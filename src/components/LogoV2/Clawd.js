import { jsx, jsxs } from "react/jsx-runtime";
import { Box, Text } from "../../ink.js";
const WHALE_POSES = {
  default: {
    top: "   ^-----^    ",
    middle: "  / (oo) \\__~",
    bottom: "  \\_m_/_/     "
  },
  "look-left": {
    top: "  ^-----^     ",
    middle: " / (oo) \\__~ ",
    bottom: " \\_m_/_/      "
  },
  "look-right": {
    top: "    ^-----^   ",
    middle: "   / (oo) \\__~",
    bottom: "   \\_m_/_/    "
  },
  "arms-up": {
    top: "\\ ^-----^ /   ",
    middle: "  / (oo) \\__~",
    bottom: "  \\_m_/_/     "
  }
};
function Clawd({ pose = "default" } = {}) {
  const art = WHALE_POSES[pose];
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(Text, { color: "clawd_body", children: art.top }),
    /* @__PURE__ */ jsx(Text, { color: "clawd_body", children: art.middle }),
    /* @__PURE__ */ jsx(Text, { color: "clawd_body", children: art.bottom })
  ] });
}
export {
  Clawd
};
