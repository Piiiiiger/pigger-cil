const releaseNotes = {
  description: "View release notes",
  name: "release-notes",
  type: "local",
  supportsNonInteractive: true,
  load: () => import("./release-notes.js")
};
var stdin_default = releaseNotes;
export {
  stdin_default as default
};
