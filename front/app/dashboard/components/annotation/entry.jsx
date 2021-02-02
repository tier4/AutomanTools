import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import AnnotationTable from 'automan/dashboard/components/annotation/table';
import { mainStyle } from 'automan/assets/main-style';

class AnnotationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      needUpdate: false
    }
  }
  deleteAnnotation = (annotation_id) => {
    RequestClient.delete(
      '/projects/' + this.props.currentProject.id
      + '/annotations/' + annotation_id + '/',
      null,
      res => {
        this.setState({ needUpdate: true });
      }
    );
  };
  handleUpdate = () => {
    this.setState({ needUpdate: false });
  }
  handleClickAnnotation = annotationId => {
    if (this.props.currentProject.klassset.count === 0) {
      window.alert('ClassSet is not registered.');
    } else {
      window.open(
        '/application/' +
        this.props.currentProject.id +
        '/annotations/' +
        annotationId +
        '/labeling_tool/',
        '_blank'
      );
    }
  };
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <AnnotationTable
              onClickAnnotation={this.handleClickAnnotation}
              deleteAnnotation={this.deleteAnnotation}
              handleUpdate={this.handleUpdate}
              needUpdate={this.state.needUpdate}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

AnnotationPage.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'AnnotationPage' }),
  connect(
    mapStateToProps,
    null
  )
)(AnnotationPage);
