const PREFIX = 'annotation/'
export const SET_TARGET_LABEL = PREFIX + 'set_target_label';
export const SET_TARGET_PCD_STATE = PREFIX + 'set_target_pcd_state';
export const SET_FRAME_INFO = PREFIX + 'set_frame_info';
export const SET_CANDIDATE_INFO = PREFIX + 'set_candidate_info';


export function setTargetLabel(target) {
  return dispatch => dispatch({
    type: SET_TARGET_LABEL,
    label: target
  });
}
export function setTargetState(state) {
  return dispatch => dispatch({
    type: SET_TARGET_PCD_STATE,
    state: state
  });
}
export function setFrameInfo(num, info) {
  return dispatch => dispatch({
    type: SET_FRAME_INFO,
    num, info
  });
}
export function setCandidateInfo(info) {
  return dispatch => dispatch({
    type: SET_CANDIDATE_INFO,
    info
  });
}
