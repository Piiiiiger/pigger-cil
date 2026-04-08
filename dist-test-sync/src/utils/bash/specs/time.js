const time = {
  name: "time",
  description: "Time a command",
  args: {
    name: "command",
    description: "Command to time",
    isCommand: true
  }
};
var stdin_default = time;
export {
  stdin_default as default
};
