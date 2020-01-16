import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Add from '@material-ui/icons/Add';

import { getCurrentUser } from 'automan/dashboard/actions/userAction';
import ProjectForm from 'automan/dashboard/components/mypage/project_form';
import ProjectTable from 'automan/dashboard/components/mypage/project_table';

import { mainStyle } from 'automan/assets/main-style';

class MyPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      needUpdate: false
    };
    this.updateData();
  }
  deleteProject = (project_id) => {
    RequestClient.delete(
      '/projects/' + project_id + '/',
      null,
      res => {
        this.setState({ needUpdate: true });
      }
    );
  };
  show = () => {
    this.setState({ open: true });
  };
  hide = () => {
    this.setState({ open: false });
  };
  handlePostSubmit = () => {
    this.setState({ needUpdate: true });
    this.updateData();
    this.hide();
  };
  handleUpdate = () => {
    this.setState({ needUpdate: false });
  }
  updateData() {
    this.props.dispatchCurrentUser();
  }
  render() {
    const { classes, currentUser } = this.props;
    if (!currentUser) {
      return <p />;
    }
    return (
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <h2>My page</h2>
          <div />
          <div>
            <div>User Name: {currentUser.username}</div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <ProjectTable
              handleUpdate={this.handleUpdate}
              needUpdate={this.state.needUpdate}
              deleteProject={this.deleteProject}
            />
          </Paper>
          <Fab
            color="primary"
            aria-label="Add"
            className={classes.fab}
            onClick={() => {
              this.show();
            }}
          >
            <Add />
          </Fab>
          <ProjectForm
            show={this.show}
            hide={this.hide}
            open={this.state.open}
            handlePostSubmit={this.handlePostSubmit}
          />
        </Grid>
      </Grid>
    );
  }
}

MyPage.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    currentUser: state.userReducer.currentUser
  };
};
const mapDispatchToProps = dispatch => ({
  dispatchCurrentUser: () => dispatch(getCurrentUser())
});
export default compose(
  withStyles(mainStyle, { name: 'MyPage' }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(MyPage);
