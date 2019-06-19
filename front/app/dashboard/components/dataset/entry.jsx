import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Add from '@material-ui/icons/Add';

import DatasetTable from 'automan/dashboard/components/dataset/table';
import { mainStyle } from 'automan/assets/main-style';

import JobForm from 'automan/dashboard/components/dataset/form';

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      target: -1,
      datasetId: null,
      formOpen: false
    };
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
        <JobForm formOpen={this.state.formOpen} hide={this.hide} />
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <DatasetTable target={-1} />
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
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(mainStyle)(DatasetPage);
