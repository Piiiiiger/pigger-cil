const sleep = {
  name: "sleep",
  description: "Delay for a specified amount of time",
  args: {
    name: "duration",
    description: "Duration to sleep (seconds or with suffix like 5s, 2m, 1h)",
    isOptional: false
  }
};
var stdin_default = sleep;
export {
  stdin_default as default
};
