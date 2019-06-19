import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
//import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Add from '@material-ui/icons/Add';
// to popup
import Dialog from '@material-ui/core/Dialog';
import CardHeader from '@material-ui/core/CardHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';
// to form
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';

import AnnotationTable from 'automan/dashboard/components/annotation/table';
import { mainStyle } from 'automan/assets/main-style';

class AnnotationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formOpen: false,
      datasets: [],
      selectIdx: 0,
      name: ''
    };
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
  handleClickOpenForm = () => {
    RequestClient.get(
      '/projects/' + this.props.currentProject.id + '/datasets/',
      null,
      res => {
        this.setState({
          formOpen: true,
          datasets: res.records
        });
      },
      e => {
        // TODO: display error infomation
        console.log('ERROR', e);
        this.setState({ formOpen: false });
      }
    );
  };
  handleClickAddAnnotation = () => {
    let name = this.state.name;
    if (name == null || name.length === 0) {
      // TODO: display error info
      console.log('Name is too short');
      return;
    }
    this.setState({ error_string: '' });
    const data = {
      name: name,
      dataset_id: this.state.datasets[this.state.selectIdx].id
    };
    RequestClient.post(
      '/projects/' + this.props.currentProject.id + '/annotations/',
      data,
      info => {
        this.setState({ formOpen: false });
      },
      e => {
        // TODO: display error infomation
        console.log('ERROR', e);
        this.setState({ formOpen: false });
      }
    );
  };
  handleChangeSelect = e => {
    this.setState({ selectIdx: e.target.value });
  };
  handleChangeName = e => {
    this.setState({ name: e.target.value });
  };
  render() {
    const { classes } = this.props;
    // popup form
    const items = this.state.datasets.map((dataset, index) => {
      return (
        <MenuItem value={index} key={dataset.id}>
          {dataset.name}
        </MenuItem>
      );
    });
    const nameForm = (
      <FormControl>
        <TextField
          label="Annotation Name"
          value={this.state.name}
          onChange={this.handleChangeName}
        />
      </FormControl>
    );
    const datasetForm = (
      <FormControl>
        <InputLabel htmlFor="dataset">Dataset</InputLabel>
        <Select
          autoFocus
          value={this.state.selectIdx}
          onChange={this.handleChangeSelect}
        >
          {items}
        </Select>
      </FormControl>
    );
    // popup
    const popupClose = () => {
      this.setState({ formOpen: false });
    };
    const closeButton = (
      <Button onClick={popupClose}>
        <Close />
      </Button>
    );
    const popup = (
      <Dialog open={this.state.formOpen} onClose={popupClose}>
        <CardHeader action={closeButton} title={'Add Annotation'} />
        <DialogContent>
          {nameForm}
          {datasetForm}
          <Button
            onClick={this.handleClickAddAnnotation}
            className={classes.button}
          >
            <Send /> Add
          </Button>
        </DialogContent>
      </Dialog>
    );
    return (
      <Grid container spacing={24}>
        {popup}
        <Grid item xs={12}>
          <Paper className={classes.root}>
            <AnnotationTable onClickAnnotation={this.handleClickAnnotation} />
          </Paper>
          <Fab
            color="primary"
            aria-label="Add"
            className={classes.fab}
            onClick={this.handleClickOpenForm}
          >
            <Add />
          </Fab>
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
