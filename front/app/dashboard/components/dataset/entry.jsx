import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import DatasetTable from 'automan/dashboard/components/dataset/table';
import { mainStyle } from 'automan/assets/main-style';

class DatasetPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      target: -1,
      datasetId: null
    };
  }
  render() {
    const { classes } = this.props;
    return (
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <DatasetTable target={-1} />
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(mainStyle)(DatasetPage);
