
import {
  SET_TOOL_ANNOTATION,
  SET_TOOL_KLASS_SET,
  SET_TOOL_HISTORY,
  SET_TOOL_CLIPBOARD,
  SET_TOOL_CONTROLS,
  SET_TOOL_LABEL_TOOL,
  ADD_TOOL_WITH_INDEX,
  SET_TOOL_LOCK,
} from '../actions/tool_action';

const initialState = {
  annotation: null,
  annotationLock: null,
  klassSet: null,
  history: null,
  clipboard: null,
  labelTool: null,
  tools: [],
  toolsCnt: 0
};

export default function toolReducer(state = initialState, action = {}) {
  let newState = {};
  switch (action.type) {
    case SET_TOOL_ANNOTATION:
      newState = {
        annotation: action.annotation
      };
      break;
    case SET_TOOL_KLASS_SET:
      newState = {
        klassSet: action.klassSet
      };
      break;
    case SET_TOOL_HISTORY:
      newState = {
        history: action.history
      };
      break;
    case SET_TOOL_CLIPBOARD:
      newState = {
        clipboard: action.clipboard
      };
      break;
    case SET_TOOL_CONTROLS:
      newState = {
        controls: action.controls
      };
      break;
    case SET_TOOL_LABEL_TOOL:
      newState = {
        labelTool: action.labelTool
      };
      break;
    case ADD_TOOL_WITH_INDEX:
      const newTools = state.tools.slice();
      newTools[action.idx] = action.tool;
      newState = {
        tools: newTools,
        toolsCnt: state.toolsCnt + 1
      }
      break;
    case SET_TOOL_LOCK:
      newState = {
        annotationLock: action.lockInfo
      };
      break;
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
