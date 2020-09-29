const PREFIX = 'tool/'
export const SET_TOOL_ANNOTATION = PREFIX + 'set_annotation';
export const SET_TOOL_KLASS_SET = PREFIX + 'set_klass_set';
export const SET_TOOL_HISTORY = PREFIX + 'set_history';
export const SET_TOOL_CLIPBOARD = PREFIX + 'set_clipboard';
export const SET_TOOL_CONTROLS = PREFIX + 'set_controls';
export const SET_TOOL_LABEL_TOOL = PREFIX + 'set_label_tool';
export const ADD_TOOL_WITH_INDEX= PREFIX + 'add_tool';
export const SET_TOOL_LOCK = PREFIX + 'set_lock';


export function setAnnotation(target) {
  return {
    type: SET_TOOL_ANNOTATION,
    annotation: target
  };
}
export function setKlassSet(target) {
  return {
    type: SET_TOOL_KLASS_SET,
    klassSet: target
  };
}
export function setHistory(target) {
  return {
    type: SET_TOOL_HISTORY,
    history: target
  };
}
export function setClipboard(target) {
  return {
    type: SET_TOOL_CLIPBOARD,
    clipboard: target
  };
}
export function setControls(target) {
  return {
    type: SET_TOOL_CONTROLS,
    controls: target
  };
}
export function setLabelTool(target) {
  return {
    type: SET_TOOL_LABEL_TOOL,
    labelTool: target
  };
}
export function addTool(idx, target) {
  return {
    type: ADD_TOOL_WITH_INDEX,
    idx: idx,
    tool: target
  };
}
export function setLockInfo(lockInfo) {
  return {
    type: SET_TOOL_LOCK,
    lockInfo: lockInfo
  };
}
