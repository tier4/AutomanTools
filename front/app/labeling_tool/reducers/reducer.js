import { combineReducers } from 'redux';
import annotation from './annotation_reducer';
import tool from './tool_reducer';
import pcdTool from './pcd_tool_reducer';

export default combineReducers({
  annotation,
  tool,
  pcdTool,
});
