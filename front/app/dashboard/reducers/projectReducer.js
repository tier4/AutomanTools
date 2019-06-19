import {
  LIST_PROJECT,
  CURRENT_PROJECT
} from 'automan/dashboard/actions/projectAction';

const initialState = {
  projects: [],
  projectTotalCount: null,
  currentProject: null
};

export default function projectReducer(state = initialState, action = {}) {
  switch (action.type) {
    case LIST_PROJECT:
      return Object.assign({}, state, {
        projects: action.projects,
        projectTotalCount: action.totalCount
      });
    case CURRENT_PROJECT:
      return Object.assign({}, state, {
        currentProject: action.currentProject
      });
    default:
      return state;
  }
}
