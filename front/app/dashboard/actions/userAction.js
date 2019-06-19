export const IS_LOGGED_IN = 'user/isLoggedIn';
export const CURRENT_USER = 'user/get';
export const USER_PERMISSIONS = 'user/permissions';

export function getCurrentUser() {
  return dispatch => {
    RequestClient.get(
      '/accounts/me/',
      null,
      data => {
        dispatch({
          type: CURRENT_USER,
          currentUser: data
        });
      },
      () => {
        location.href = '/error';
      }
    );
  };
}

export function updateLoginStatus() {
  return dispatch => {
    const jwt = localStorage.getItem('automan_jwt');
    const isLoggedIn = jwt ? true : false;
    dispatch({
      type: IS_LOGGED_IN,
      isLoggedIn: isLoggedIn
    });
  };
}

export function getPermissions(projectId) {
  return dispatch => {
    dispatch({
      type: USER_PERMISSIONS,
      permissions: null
    });
    RequestClient.get(
      '/projects/' + projectId + '/permissions/',
      null,
      data => {
        dispatch({
          type: USER_PERMISSIONS,
          permissions: data.permissions
        });
      },
      () => {
        location.href = '/';
      }
    );
  };
}
