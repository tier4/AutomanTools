import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Add from '@material-ui/icons/Add';

import CalibrationTable from 'automan/dashboard/components/calibration/table.jsx';
import CalibrationForm from 'automan/dashboard/components/calibration/form.jsx';
import { mainStyle } from 'automan/assets/main-style';

class CalibrationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { formOpen: false };
  }
  show = () => {
    this.setState({ formOpen: true });
  };
  hide = () => {
    this.setState({ formOpen: false });
  };
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <CalibrationTable />
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
          <CalibrationForm formOpen={this.state.formOpen} hide={this.hide} />
        </Grid>
      </Grid>
    );
  }
}

CalibrationPage.propTypes = {
  classes: PropTypes.object.isRequired
};
export default compose(
  withStyles(mainStyle, { name: 'CalibrationPage' }),
  connect(
    null,
    null
  )
)(CalibrationPage);
