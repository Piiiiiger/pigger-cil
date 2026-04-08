import { jsx } from "react/jsx-runtime";
import { feature } from "../../../__generated__/bun-bundle.js";
import { spawnSync } from "child_process";
import sample from "lodash-es/sample.js";
import { ExitFlow } from "../../components/ExitFlow.js";
import { isBgSession } from "../../utils/concurrentSessions.js";
import { gracefulShutdown } from "../../utils/gracefulShutdown.js";
import { getCurrentWorktreeSession } from "../../utils/worktree.js";
const GOODBYE_MESSAGES = ["Goodbye!", "See ya!", "Bye!", "Catch you later!"];
function getRandomGoodbyeMessage() {
  return sample(GOODBYE_MESSAGES) ?? "Goodbye!";
}
async function call(onDone) {
  if (feature("BG_SESSIONS") && isBgSession()) {
    onDone();
    spawnSync("tmux", ["detach-client"], {
      stdio: "ignore"
    });
    return null;
  }
  const showWorktree = getCurrentWorktreeSession() !== null;
  if (showWorktree) {
    return /* @__PURE__ */ jsx(ExitFlow, { showWorktree, onDone, onCancel: () => onDone() });
  }
  onDone(getRandomGoodbyeMessage());
  await gracefulShutdown(0, "prompt_input_exit");
  return null;
}
export {
  call
};
