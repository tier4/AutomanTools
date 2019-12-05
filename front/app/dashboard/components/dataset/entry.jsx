import React from 'react';
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
      formOpen: false
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
            <DatasetTable show={this.show}/>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(mainStyle)(DatasetPage);
