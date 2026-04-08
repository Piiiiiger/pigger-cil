import { useContext } from "react";
import AppContext from "../components/AppContext.js";
const useApp = () => useContext(AppContext);
var stdin_default = useApp;
export {
  stdin_default as default
};
