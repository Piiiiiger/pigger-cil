import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../../__generated__/bun-bundle.js";
import { shouldAutoEnableClaudeInChrome } from "../../utils/claudeInChrome/setup.js";
import { registerBatchSkill } from "./batch.js";
import { registerClaudeInChromeSkill } from "./claudeInChrome.js";
import { registerDebugSkill } from "./debug.js";
import { registerKeybindingsSkill } from "./keybindings.js";
import { registerLoremIpsumSkill } from "./loremIpsum.js";
import { registerRememberSkill } from "./remember.js";
import { registerSimplifySkill } from "./simplify.js";
import { registerSkillifySkill } from "./skillify.js";
import { registerStuckSkill } from "./stuck.js";
import { registerUpdateConfigSkill } from "./updateConfig.js";
import { registerVerifySkill } from "./verify.js";
function initBundledSkills() {
  registerUpdateConfigSkill();
  registerKeybindingsSkill();
  registerVerifySkill();
  registerDebugSkill();
  registerLoremIpsumSkill();
  registerSkillifySkill();
  registerRememberSkill();
  registerSimplifySkill();
  registerBatchSkill();
  registerStuckSkill();
  if (feature("KAIROS") || feature("KAIROS_DREAM")) {
    const { registerDreamSkill } = require2("./dream.js");
    registerDreamSkill();
  }
  if (feature("REVIEW_ARTIFACT")) {
    const { registerHunterSkill } = require2("./hunter.js");
    registerHunterSkill();
  }
  if (feature("AGENT_TRIGGERS")) {
    const { registerLoopSkill } = require2("./loop.js");
    registerLoopSkill();
  }
  if (feature("AGENT_TRIGGERS_REMOTE")) {
    const {
      registerScheduleRemoteAgentsSkill
    } = require2("./scheduleRemoteAgents.js");
    registerScheduleRemoteAgentsSkill();
  }
  if (feature("BUILDING_CLAUDE_APPS")) {
    const { registerClaudeApiSkill } = require2("./claudeApi.js");
    registerClaudeApiSkill();
  }
  if (shouldAutoEnableClaudeInChrome()) {
    registerClaudeInChromeSkill();
  }
  if (feature("RUN_SKILL_GENERATOR")) {
    const { registerRunSkillGeneratorSkill } = require2("./runSkillGenerator.js");
    registerRunSkillGeneratorSkill();
  }
}
export {
  initBundledSkills
};
