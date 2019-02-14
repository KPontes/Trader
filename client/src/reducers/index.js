import { combineReducers } from "redux";
import ActiveUser from "./reducer_active_user";
import ActiveToken from "./reducer_active_token";

const rootReducer = combineReducers({
  activeUser: ActiveUser,
  activeToken: ActiveToken
});

export default rootReducer;
