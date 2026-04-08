import { isEnvTruthy } from "../../utils/envUtils.js";
const doctor = {
  name: "doctor",
  description: "Diagnose and verify your pigger installation and settings",
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_DOCTOR_COMMAND),
  type: "local-jsx",
  load: () => import("./doctor.js")
};
var stdin_default = doctor;
export {
  stdin_default as default
};
