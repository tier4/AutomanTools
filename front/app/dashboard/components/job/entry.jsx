import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import JobTable from 'automan/dashboard/components/job/table';
import { mainStyle } from 'automan/assets/main-style';

class JobPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      target: -1,
      jobId: null
    };
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <JobTable onClickJob={this.handleClickJob} target={-1} />
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(mainStyle)(JobPage);
