export function selectUser(user) {
  //selectUser is an action creator. It needs to return an action.
  //an object with a type property
  return {
    type: "USER_SELECTED",
    payload: user
  };
}

export function selectToken(token) {
  return {
    type: "TOKEN_SELECTED",
    payload: token
  };
}
