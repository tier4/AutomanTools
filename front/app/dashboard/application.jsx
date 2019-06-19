import React from 'react';
import ReactDOM from 'react-dom';
import { compose, createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { withStyles, MuiThemeProvider } from '@material-ui/core/styles';
import classNames from 'classnames';
import { $ } from 'jquery';
window.$ = $;

import RequestClient from 'automan/services/request-client';
window.RequestClient = RequestClient;
import { theme } from 'automan/assets/theme';
import { mainStyle } from 'automan/assets/main-style';
import combineReducers from 'automan/dashboard/reducers/reducer';
//import projectReducer from 'automan/dashboard/reducers/projectReducer';
import {
  listProject,
  getCurrentProject
} from 'automan/dashboard/actions/projectAction';
import {
  updateLoginStatus,
  getPermissions
} from 'automan/dashboard/actions/userAction';
import Navigation from 'automan/dashboard/components/parts/navigation';
import MyPage from 'automan/dashboard/components/mypage/entry';
import Project from 'automan/dashboard/components/project/entry';
import CalibrationPage from 'automan/dashboard/components/calibration/entry';
import OriginalPage from 'automan/dashboard/components/original/entry';
import DatasetPage from 'automan/dashboard/components/dataset/entry';
import AnnotationPage from 'automan/dashboard/components/annotation/entry';
import JobPage from 'automan/dashboard/components/job/entry';

const noMatch = () => {
  return 'Wrong url';
};

const LocationListener = obj => {
  RequestClient.abortAll();
  return null;
};

class PagesRoute extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: true };
  }
  componentDidMount() {
    this.props.dispatchUpdateLoginStatus();
    this.props.dispatchListProject();
    this.setState({
      loadState: 'loaded'
    });
    const { match } = this.props;
    if (match.path !== '/:projectId') {
      this.props.dispatchCurrentProject(null);
    } else {
      this.props.dispatchCurrentProject(match.params.projectId);
      this.props.dispatchGetPermissions(match.params.projectId);
    }
  }
  // TODO: replace because unsafe method
  componentWillUpdate(nextProps) {
    const { match } = nextProps;
    if (match.path !== '/:projectId') {
      this.props.dispatchCurrentProject(null);
    } else if (
      !this.props.currentProject ||
      match.params.projectId != this.props.currentProject.id
    ) {
      this.props.dispatchCurrentProject(match.params.projectId);
      this.props.dispatchGetPermissions(match.params.projectId);
    }
  }
  updateNavOpen(bool) {
    this.setState({ open: bool });
  }
  logout() {
    localStorage.removeItem('automan_jwt');
    this.props.dispatchUpdateLoginStatus();
  }
  render() {
    const path = this.props.match.path;
    const { classes } = this.props;
    const pageProps = {
      historyPush: url => this.props.history.push(url)
    };
    const navigationProps = {
      open: this.state.open,
      classes: classes,
      updateNavOpen: isOpen => this.updateNavOpen(isOpen),
      logout: () => this.logout()
    };

    let content;
    if (!this.props.isLoggedIn) {
      content = location.href = '/accounts/login/?next=' + location.pathname;
    } else if (path === '/mypage/') {
      content = <MyPage {...pageProps} />;
    } else {
      switch (this.state.loadState) {
        case 'loaded':
          content = (
            <Switch>
              <Route exact path={path + '/mypage/'}>
                <MyPage {...pageProps} />
              </Route>
              <Route exact path={path + '/home/'}>
                <Project {...pageProps} />
              </Route>
              <Route exact path={path + '/calibrations/'}>
                <CalibrationPage {...pageProps} />
              </Route>
              <Route exact path={path + '/originals/'}>
                <OriginalPage {...pageProps} />
              </Route>
              <Route exact path={path + '/datasets/'}>
                <DatasetPage {...pageProps} />
              </Route>
              <Route exact path={path + '/annotations/'}>
                <AnnotationPage {...pageProps} />
              </Route>
              <Route exact path={path + '/jobs/'}>
                <JobPage {...pageProps} />
              </Route>
              <Route component={noMatch} />
            </Switch>
          );
          break;
        case 'wrong':
          content = (
            <div className="container">
              <h2>Error</h2>
              Message: {this.state.errorMessage}
            </div>
          );
          break;
        case 'loading':
          content = 'Loading project information';
          break;
        default:
          content = 'Error';
      }
    }
    return (
      <div style={{ display: 'flex' }}>
        <Navigation {...navigationProps} />
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: this.state.open
          })}
        >
          <div className={classes.drawerHeader} />
          {content}
        </main>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject,
    isLoggedIn: state.userReducer.isLoggedIn
  };
};
const mapDispatchToProps = dispatch => ({
  dispatchListProject: () => dispatch(listProject()),
  dispatchCurrentProject: projectId => dispatch(getCurrentProject(projectId)),
  dispatchUpdateLoginStatus: () => dispatch(updateLoginStatus()),
  dispatchGetPermissions: projectId => dispatch(getPermissions(projectId))
});
const connectedComponent = compose(
  withStyles(mainStyle, { name: 'pagesRoute' }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(PagesRoute);
const store = createStore(combineReducers, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter basename="/application/">
      <MuiThemeProvider theme={theme}>
        <Route component={LocationListener} />
        <Switch>
          <Route path="/mypage/" exact component={connectedComponent} />
          <Route path="/:projectId" component={connectedComponent} />
          <Route component={noMatch} />
        </Switch>
      </MuiThemeProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById('wrapper')
);
