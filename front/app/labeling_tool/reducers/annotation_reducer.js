
import {
  SET_TARGET_LABEL
} from '../actions/annotation_action';

const initialState = {
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
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
