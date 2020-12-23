
import {
  SET_TARGET_LABEL,
  SET_TARGET_PCD_STATE,
  SET_FRAME_INFO
} from '../actions/annotation_action';

const initialState = {
  targetState: null,
  targetLabel: {
    label: null
  },
  frameInfo: []
};

export default function annotationReducer(state = initialState, action = {}) {
  let newState = {};
  switch (action.type) {
    case SET_TARGET_LABEL:
      newState = {
        targetLabel: {
          label: action.label
        }
      };
      break;
    case SET_TARGET_PCD_STATE:
      newState = {
        targetState: action.state
      };
      break;
    case SET_FRAME_INFO:
      const newInfo = state.frameInfo.slice();
      newInfo[action.num] = action.info;
      newState = {
        frameInfo: newInfo
      };
      break;
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
