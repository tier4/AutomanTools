
import {
  SET_TARGET_LABEL,
  SET_TARGET_PCD_STATE,
  SET_CANDIDATE_INFO,
  SET_FRAME_INFO
} from '../actions/annotation_action';

const initialState = {
  targetState: null,
  targetLabel: {
    label: null
  },
  candidateInfo: null,
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
    case SET_CANDIDATE_INFO:
      const info = [];
      for (let candidate of action.info) {
        const obj = Object.assign({}, candidate);
        const calib = candidate.calibration_info;
        if (typeof calib === 'string') {
          if (calib.length === 0) {
            obj.calibration_info = null;
          } else {
            obj.calibration_info = JSON.parse(calib);
          }
        }
        info.push(obj);
      }
      newState = {
        candidateInfo: info
      };
      break;
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
