import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Work from '@material-ui/icons/Work';
import Home from '@material-ui/icons/Home';
import CameraAlt from '@material-ui/icons/CameraAlt';
import Create from '@material-ui/icons/Create';
import CropRotate from '@material-ui/icons/CropRotate';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import PhotoLibrary from '@material-ui/icons/PhotoLibrary';
import Timer from '@material-ui/icons/Timer';
import { withStyles } from '@material-ui/core/styles';

import { styles } from 'automan/assets/sidebar';
//import projectReducer from 'automan/dashboard/reducers/projectReducer';

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: true
    };
  }
  handleClick() {
    this.setState({ open: !this.state.open });
  }
  render() {
    const { classes, projects, currentProject } = this.props;
    let projectItems = '';
    if (projects != null) {
      let tabName = location.href.split('#')[1];
      if (tabName == null) {
        tabName = '';
      } else {
        tabName = '#' + tabName;
      }
      projectItems = this.props.projects.map(project => (
        <ListItem
          button
          component={Link}
          to={`/${parseInt(project.id)}/home/${tabName}`}
          key={`${project.id}`}
          selected={currentProject !== null && project.id === currentProject.id}
          className={classes.nested}
        >
          <ListItemText primary={`${project.name}`} />
        </ListItem>
      ));
    }
    const mainListItems = (
      <div>
        <ListItem button onClick={this.handleClick.bind(this)}>
          <ListItemIcon>
            <Work />
          </ListItemIcon>
          <ListItemText primary="Projects" />
          {this.state.open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={this.state.open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {projectItems}
          </List>
        </Collapse>
      </div>
    );

    let secondaryListItems = '';
    let jobsListItems = '';
    let pageName = this.props.pageName;
    if (currentProject != null) {
      secondaryListItems = (
        <div>
          <ListSubheader inset className={classes.listSubHeader}>
            {currentProject.name}
          </ListSubheader>
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/home/`}
            selected={pageName === 'home'}
          >
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/calibrations/`}
            selected={pageName === 'calibrations'}
          >
            <ListItemIcon>
              <CropRotate />
            </ListItemIcon>
            <ListItemText primary="Calibration" />
          </ListItem>
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/originals/`}
            selected={pageName === 'originals'}
          >
            <ListItemIcon>
              <CameraAlt />
            </ListItemIcon>
            <ListItemText primary="Raw" />
          </ListItem>
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/datasets/`}
            selected={pageName === 'datasets'}
          >
            <ListItemIcon>
              <PhotoLibrary />
            </ListItemIcon>
            <ListItemText primary="Dataset" />
          </ListItem>
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/annotations/`}
            selected={pageName === 'annotations'}
          >
            <ListItemIcon>
              <Create />
            </ListItemIcon>
            <ListItemText primary="Annotation" />
          </ListItem>
        </div>
      );
      jobsListItems = (
        <div>
          <Divider />
          <ListItem
            button
            component={Link}
            to={`/${parseInt(currentProject.id)}/jobs/`}
            selected={
              window.document.location.pathname.split('/')[3] === 'jobs'
            }
          >
            <ListItemIcon>
              <Timer />
            </ListItemIcon>
            <ListItemText primary="Job" />
          </ListItem>
        </div>
      );
    }
    return (
      <div>
        <List>{mainListItems}</List>
        <Divider />
        <List>{secondaryListItems}</List>
        <List>{jobsListItems}</List>

      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    projects: state.projectReducer.projects,
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(styles, { name: 'Sidebar' }),
  connect(
    mapStateToProps,
    null
  )
)(Sidebar);
