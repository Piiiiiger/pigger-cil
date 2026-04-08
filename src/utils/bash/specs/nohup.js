const nohup = {
  name: "nohup",
  description: "Run a command immune to hangups",
  args: {
    name: "command",
    description: "Command to run with nohup",
    isCommand: true
  }
};
var stdin_default = nohup;
export {
  stdin_default as default
};
