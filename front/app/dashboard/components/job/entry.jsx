import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Paper from '@material-ui/core/Paper';
import Add from '@material-ui/icons/Add';
import Grid from '@material-ui/core/Grid';

import JobTable from 'automan/dashboard/components/job/table';
import JobForm from 'automan/dashboard/components/job/form';

import { mainStyle } from 'automan/assets/main-style';

class JobPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      target: -1,
      jobId: null
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
        <Grid item xs={12}>
          <JobForm formOpen={this.state.formOpen} hide={this.hide} />
          <Paper className={classes.root}>
            <JobTable onClickJob={this.handleClickJob} target={-1} />
          </Paper>
          <Fab
            color="primary"
            aria-label="Add"
            className={classes.fab}
            onClick={this.show}
          >
            <Add />
          </Fab>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(mainStyle)(JobPage);
