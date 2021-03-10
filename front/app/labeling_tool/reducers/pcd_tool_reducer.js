import {
  SET_TARGET_CANDIDATE_ID,
  SET_TOPIC,
} from '../actions/pcd_tool_action';

const initialState = {
  targetCandidate: -1,
  topics: {},
};

export default function pcdToolReducer(state = initialState, action = {}) {
  let newState = {};
  switch (action.type) {
    case SET_TARGET_CANDIDATE_ID:
      newState = {
        targetCandidate: action.target
      };
      break;
    case SET_TOPIC: {
        const topics = Object.assign({}, state.topics);
        topics[action.topic] = action.value;
        newState = {
          topics: topics
        };
      }
      break;
    default:
      return state;
  }
  return Object.assign({}, state, newState);
}
