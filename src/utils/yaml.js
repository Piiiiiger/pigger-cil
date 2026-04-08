import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
function parseYaml(input) {
  if (typeof Bun !== "undefined") {
    return Bun.YAML.parse(input);
  }
  return require2("yaml").parse(input);
}
export {
  parseYaml
};
