export const LIST_PROJECT = 'project/list';
export const CURRENT_PROJECT = 'project/get';

export function getCurrentProject(projectId) {
  return dispatch => {
    if (projectId == null) {
      dispatch({
        type: CURRENT_PROJECT,
        currentProject: null
      });
      return;
    }
    RequestClient.get(
      '/projects/' + projectId + '/',
      null,
      data => {
        dispatch({
          type: CURRENT_PROJECT,
          currentProject: data
        });
      },
      err => {
        let mes = `Bad Project ID [${projectId}]. ` + err.message;
        dispatch({
          type: CURRENT_PROJECT,
          currentProject: null,
          errorMessage: mes
        });
      }
    );
  };
}

export function listProject() {
  return dispatch => {
    RequestClient.get(
      '/projects/',
      null,
      res => {
        dispatch({
          type: LIST_PROJECT,
          totalCount: res.count,
          projects: res.records
        });
      },
      err => {
        dispatch({
          type: LIST_PROJECT,
          projects: [],
          totalCount: null
          // errorMessage: mes
        });
      }
    );
  };
}
