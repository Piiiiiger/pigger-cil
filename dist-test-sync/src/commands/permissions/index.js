const permissions = {
  type: "local-jsx",
  name: "permissions",
  aliases: ["allowed-tools"],
  description: "Manage allow & deny tool permission rules",
  load: () => import("./permissions.js")
};
var stdin_default = permissions;
export {
  stdin_default as default
};
