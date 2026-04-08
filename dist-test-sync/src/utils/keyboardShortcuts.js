const MACOS_OPTION_SPECIAL_CHARS = {
  "†": "alt+t",
  // Option+T -> thinking toggle
  π: "alt+p",
  // Option+P -> model picker
  ø: "alt+o"
  // Option+O -> fast mode
};
function isMacosOptionChar(char) {
  return char in MACOS_OPTION_SPECIAL_CHARS;
}
export {
  MACOS_OPTION_SPECIAL_CHARS,
  isMacosOptionChar
};
