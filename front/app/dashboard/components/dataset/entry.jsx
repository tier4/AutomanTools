import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import AnnotationForm from 'automan/dashboard/components/dataset/annotationForm'
import DatasetTable from 'automan/dashboard/components/dataset/table';
import { mainStyle } from 'automan/assets/main-style';

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset_id: null,
      formOpen: false,
      needUpdate: false
    };
  }
  show = (dataset_id) => {
    this.setState({
      dataset_id: dataset_id,
      formOpen: true
    });
  }
  hide = () => {
    this.setState({ formOpen: false });
  };
  deleteDataset = (dataset_id) => {
    RequestClient.delete(
      '/projects/' + this.props.currentProject.id
      + '/datasets/' + dataset_id + '/',
      null,
      res => {
        this.setState({ needUpdate: true });
      }
    );
  };
  handleUpdate = () => {
    this.setState({ needUpdate: false });
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={24}>
        <AnnotationForm
          hide={this.hide}
          formOpen={this.state.formOpen}
          dataset_id={this.state.dataset_id}
        />
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <DatasetTable
              show={this.show}
              deleteDataset={this.deleteDataset}
              needUpdate={this.state.needUpdate}
              handleUpdate={this.handleUpdate}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

DatasetPage.propTypes = {
  classes: PropTypes.object.isRequired
};
const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'DatasetPage' }),
  connect(
    mapStateToProps,
    null
  )
)(DatasetPage);