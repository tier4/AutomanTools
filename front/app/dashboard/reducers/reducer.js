import { combineReducers } from 'redux';
import projectReducer from 'automan/dashboard/reducers/projectReducer';
import userReducer from 'automan/dashboard/reducers/userReducer';

export default combineReducers({
  projectReducer,
  userReducer
});
