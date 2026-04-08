const alias = {
  name: "alias",
  description: "Create or list command aliases",
  args: {
    name: "definition",
    description: "Alias definition in the form name=value",
    isOptional: true,
    isVariadic: true
  }
};
var stdin_default = alias;
export {
  stdin_default as default
};
