
const PREFIX = 'pcd_tool/'
export const SET_TARGET_CANDIDATE_ID = PREFIX + 'set_target_candidate_id';
export const SET_TOPIC = PREFIX + 'set_topic';


export function setTargetCandidateId(target) {
  return dispatch => dispatch({
    type: SET_TARGET_CANDIDATE_ID,
    target: target
  });
}
export function setTopic(topic, val) {
  return {
    type: SET_TOPIC,
    topic: topic,
    value: val
  };
}

