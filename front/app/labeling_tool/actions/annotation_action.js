const PREFIX = 'annotation/'
export const SET_TARGET_LABEL = PREFIX + 'set_target_label';
export const SET_TARGET_PCD_STATE = PREFIX + 'set_target_pcd_state';


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
