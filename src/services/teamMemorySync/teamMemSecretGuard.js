import { createRequire as __ccCreateRequire } from "node:module";
const require2 = __ccCreateRequire(import.meta.url);
import { feature } from "../../../__generated__/bun-bundle.js";
function checkTeamMemSecrets(filePath, content) {
  if (feature("TEAMMEM")) {
    const { isTeamMemPath } = require2("../../memdir/teamMemPaths.js");
    const { scanForSecrets } = require2("./secretScanner.js");
    if (!isTeamMemPath(filePath)) {
      return null;
    }
    const matches = scanForSecrets(content);
    if (matches.length === 0) {
      return null;
    }
    const labels = matches.map((m) => m.label).join(", ");
    return `Content contains potential secrets (${labels}) and cannot be written to team memory. Team memory is shared with all repository collaborators. Remove the sensitive content and try again.`;
  }
  return null;
}
export {
  checkTeamMemSecrets
};
