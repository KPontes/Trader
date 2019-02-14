//state argument is not the application level state,
//but only the state this reducer is responsible for
//the null attribution is a ES6 syntax means if state=undefined, set it to null
//as undefined causes an error thrown
export default function(state = null, action) {
  switch (action.type) {
    case "TOKEN_SELECTED":
      return action.payload;
  }
  //if the action does not matter
  return state;
}
