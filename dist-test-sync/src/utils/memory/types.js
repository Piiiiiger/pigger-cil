import { feature } from "../../../__generated__/bun-bundle.js";
const MEMORY_TYPE_VALUES = [
  "User",
  "Project",
  "Local",
  "Managed",
  "AutoMem",
  ...feature("TEAMMEM") ? ["TeamMem"] : []
];
export {
  MEMORY_TYPE_VALUES
};
