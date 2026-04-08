import { useContext } from "react";
import StdinContext from "../components/StdinContext.js";
const useStdin = () => useContext(StdinContext);
var stdin_default = useStdin;
export {
  stdin_default as default
};
