import { env } from "../utils/env.js";
const BLACK_CIRCLE = env.platform === "darwin" ? "⏺" : "●";
const BULLET_OPERATOR = "∙";
const TEARDROP_ASTERISK = "✻";
const UP_ARROW = "↑";
const DOWN_ARROW = "↓";
const LIGHTNING_BOLT = "↯";
const EFFORT_LOW = "○";
const EFFORT_MEDIUM = "◐";
const EFFORT_HIGH = "●";
const EFFORT_MAX = "◉";
const PLAY_ICON = "▶";
const PAUSE_ICON = "⏸";
const REFRESH_ARROW = "↻";
const CHANNEL_ARROW = "←";
const INJECTED_ARROW = "→";
const FORK_GLYPH = "⑂";
const DIAMOND_OPEN = "◇";
const DIAMOND_FILLED = "◆";
const REFERENCE_MARK = "※";
const FLAG_ICON = "⚑";
const BLOCKQUOTE_BAR = "▎";
const HEAVY_HORIZONTAL = "━";
const BRIDGE_SPINNER_FRAMES = [
  "·|·",
  "·/·",
  "·—·",
  "·\\·"
];
const BRIDGE_READY_INDICATOR = "·✔︎·";
const BRIDGE_FAILED_INDICATOR = "×";
export {
  BLACK_CIRCLE,
  BLOCKQUOTE_BAR,
  BRIDGE_FAILED_INDICATOR,
  BRIDGE_READY_INDICATOR,
  BRIDGE_SPINNER_FRAMES,
  BULLET_OPERATOR,
  CHANNEL_ARROW,
  DIAMOND_FILLED,
  DIAMOND_OPEN,
  DOWN_ARROW,
  EFFORT_HIGH,
  EFFORT_LOW,
  EFFORT_MAX,
  EFFORT_MEDIUM,
  FLAG_ICON,
  FORK_GLYPH,
  HEAVY_HORIZONTAL,
  INJECTED_ARROW,
  LIGHTNING_BOLT,
  PAUSE_ICON,
  PLAY_ICON,
  REFERENCE_MARK,
  REFRESH_ARROW,
  TEARDROP_ASTERISK,
  UP_ARROW
};
