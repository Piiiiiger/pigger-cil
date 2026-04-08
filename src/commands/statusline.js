import { AGENT_TOOL_NAME } from "../tools/AgentTool/constants.js";
const statusline = {
  type: "prompt",
  description: "Set up pigger's status line UI",
  contentLength: 0,
  // Dynamic content
  aliases: [],
  name: "statusline",
  progressMessage: "setting up statusLine",
  allowedTools: [AGENT_TOOL_NAME, "Read(~/**)", "Edit(~/.pigger/settings.json)"],
  source: "builtin",
  disableNonInteractive: true,
  async getPromptForCommand(args) {
    const prompt = args.trim() || "Configure my statusLine from my shell PS1 configuration";
    return [{
      type: "text",
      text: `Create an ${AGENT_TOOL_NAME} with subagent_type "statusline-setup" and the prompt "${prompt}"`
    }];
  }
};
var stdin_default = statusline;
export {
  stdin_default as default
};
