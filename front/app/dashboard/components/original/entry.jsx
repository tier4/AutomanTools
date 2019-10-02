import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import CloudUpload from '@material-ui/icons/CloudUpload';

import OriginalTable from 'automan/dashboard/components/original/table.jsx';
import OriginalDataForm from 'automan/dashboard/components/original/form.jsx';
import ExtractorForm from 'automan/dashboard/components/original/extractorForm.jsx';
import { mainStyle } from 'automan/assets/main-style';

class OriginalPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      extractorFormOpen: false,
      extractorSnackbar: false,
      analyzerSnackbar: false,
      original_id: 0,
      message: null
    };
  }
  show = () => {
    this.setState({ formOpen: true });
  };
  hide = () => {
    this.setState({
      formOpen: false,
      analyzerSnackbar: false,
      extractorFormOpen: false,
      extractorSnackbar: false
    });
  };
  analyzerSubmit = (original_id) => {
    const data = {
      job_type: 'ANALYZER',
      job_config: { ['original_id']: original_id }
    };
    let url = `/projects/${this.props.currentProject.id}/jobs/`;
    this.setState({ message: 'Requesting...' });
    RequestClient.post(
      url,
      data,
      res => {this.setState({ message: null });},
      mes => {
        this.setState({
          error: mes.message,
          message: null
        });
      }
    );
    this.setState({ analyzerSnackbar: true });
  };
  extractorFormShow = (original_id) => {
    this.setState({ original_id: original_id });
    this.setState({ extractorFormOpen: true });
  }
  extractorSnackbarShow = () => {
    this.setState({ extractorSnackbar: true });
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <OriginalTable
              formOpen={this.state.analyzerSnackbar}
              extractorSnackbar={this.state.extractorSnackbar}
              extractorFormShow={this.extractorFormShow}
              analyzerSubmit={this.analyzerSubmit}
              hide={this.hide}
            />
          </Paper>
          <Fab
            color="primary"
            aria-label="Upload"
            className={classes.fab}
            onClick={() => {
              this.show();
            }}
          >
            <CloudUpload />
          </Fab>
          <OriginalDataForm formOpen={this.state.formOpen} hide={this.hide} />
          <ExtractorForm
            formOpen={this.state.extractorFormOpen}
            hide={this.hide}
            original_id={this.state.original_id}
            extractorSnackbarShow={this.extractorSnackbarShow}
          />
        </Grid>
      </Grid>
    );
  }
}

OriginalPage.propTypes = {
  classes: PropTypes.object.isRequired
};
const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'OriginalPage' }),
  connect(
    mapStateToProps,
    null
  )
)(OriginalPage);
