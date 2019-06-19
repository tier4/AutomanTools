import {
  CURRENT_USER,
  IS_LOGGED_IN,
  USER_PERMISSIONS
} from 'automan/dashboard/actions/userAction';

const initialState = {
  currentUser: null,
  isLoggedIn: true,
  permissions: null
};

export default function userReducer(state = initialState, action = {}) {
  switch (action.type) {
    case CURRENT_USER:
      return Object.assign({}, state, {
        currentUser: action.currentUser
      });
    case IS_LOGGED_IN:
      return Object.assign({}, state, {
        isLoggedIn: action.isLoggedIn
      });
    case USER_PERMISSIONS:
      return Object.assign({}, state, {
        permissions: action.permissions
      });
    default:
      return state;
  }
}
