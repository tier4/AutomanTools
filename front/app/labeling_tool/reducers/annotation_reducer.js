
import {
  SET_TARGET_LABEL,
  SET_TARGET_PCD_STATE
} from '../actions/annotation_action';

const initialState = {
  targetState: null,
  targetLabel: null
};

export default function annotationReducer(state = initialState, action = {}) {
  let newState = {};
  switch (action.type) {
    case SET_TARGET_LABEL:
      newState = {
        targetLabel: action.label
      };
      break;
    case SET_TARGET_PCD_STATE:
      newState = {
        targetState: action.state
      };
      break;
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
