const PREFIX = 'annotation/'
export const SET_TARGET_LABEL = PREFIX + 'set_target_label';


export function setTargetLabel(target) {
  return dispatch => dispatch({
    type: SET_TARGET_LABEL,
    label: target
  });
}
