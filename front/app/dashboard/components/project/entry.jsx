import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Create from '@material-ui/icons/Create';
import Person from '@material-ui/icons/Person';
import People from '@material-ui/icons/People';
import StorageIcon from '@material-ui/icons/Storage';
import Work from '@material-ui/icons/Work';

import KlasssetPart from 'automan/dashboard/components/project/klassset';
import Group from 'automan/dashboard/components/project/group';
import User from 'automan/dashboard/components/project/user';
import Storage from 'automan/dashboard/components/project/storage';

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired
};

const tabNames = ['project', 'annotation', 'storage', 'user', 'group'];

const styles = theme => ({
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper
  }
});

class Project extends React.Component {
  constructor(props) {
    super(props);
    const tabName = location.href.split('#')[1];

    this.state = {
      klasssetDialogOpen: false,
      tabIndex: tabNames.includes(tabName) ? tabNames.indexOf(tabName) : 0
    };
  }
  componentDidMount() {
    this.loadProjectInfo();
  }
  componentDidUpdate(prevProp) {
    if (
      !prevProp.currentProject ||
      prevProp.currentProject.id === this.props.currentProject.id
    ) {
      return;
    }
    this.loadProjectInfo();
  }
  loadProjectInfo() {
    if (!this.props.currentProject) {
      return;
    }
  }
  handleKlasssetDialogOpen = () => {
    this.setState({ klasssetDialogOpen: true });
  };
  handleChange = (event, tabIndex) => {
    const URIWOTab = location.href.split('#')[0];
    location.href = URIWOTab + '#' + tabNames[tabIndex];
    this.setState({ tabIndex });
  };
  render() {
    const { classes, currentProject, permissions } = this.props;
    const { tabIndex } = this.state;
    let projectName, projectDesc, projectLabelType, klassset;
    if (currentProject === null) {
      projectName = '<Loading>';
    } else {
      const project = currentProject;
      projectName = project.name;
      projectDesc = project.description;
      projectLabelType = project.label_type;
      klassset = project.klassset;
    }

    // TODO: use more tags
    const klasssetProps = { klassset: klassset };
    let klasssetContent = <KlasssetPart {...klasssetProps} />;
    let groupContent = <Group />;
    let userContent = <User />;
    let storageContent = <Storage />;
    let userTab;
    if (permissions !== null && permissions.includes('list_member')) {
      userTab = <Tab label="User" icon={<Person />} />;
    }
    let groupTab;
    if (permissions !== null && permissions.includes('list_member')) {
      groupTab = <Tab label="Group" icon={<People />} />;
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <AppBar position="static" color="default">
              <Tabs
                value={permissions !== null ? tabIndex : false}
                onChange={this.handleChange}
                variant="scrollable"
                scrollButtons="on"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Project" icon={<Work />} />
                <Tab label="Annotation" icon={<Create />} />
                <Tab label="Storage" icon={<StorageIcon />} />
                {userTab}
                {groupTab}
              </Tabs>
            </AppBar>
            {tabIndex === 0 && (
              <TabContainer>
                <h2>{projectName}</h2>
                <section>{projectDesc}</section>
                <h3>Label Type</h3>
                <section>{projectLabelType}</section>
              </TabContainer>
            )}
            {tabIndex === 1 && (
              <TabContainer>
                <h3>Annotation</h3>
                {klasssetContent}
              </TabContainer>
            )}
            {tabIndex === 2 && (
              <TabContainer>
                <h3>Storages</h3>
                {storageContent}
              </TabContainer>
            )}
            {tabIndex === 3 && (
              <TabContainer>
                <h3>Users</h3>
                {userContent}
              </TabContainer>
            )}
            {tabIndex === 4 && (
              <TabContainer>
                <h3>Groups</h3>
                {groupContent}
              </TabContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

Project.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject,
    permissions: state.userReducer.permissions
  };
};
export default compose(
  withStyles(styles, { name: 'Project' }),
  connect(
    mapStateToProps,
    null
  )
)(Project);
