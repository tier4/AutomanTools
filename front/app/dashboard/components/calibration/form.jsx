import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
//import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
//import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
//import MenuItem from '@material-ui/core/MenuItem';
//import Select from '@material-ui/core/Select';
import Toolbar from '@material-ui/core/Toolbar';
import CameraAlt from '@material-ui/icons/CameraAlt';
import Cancel from '@material-ui/icons/Cancel';
import Close from '@material-ui/icons/Close';
import CloudUpload from '@material-ui/icons/CloudUpload';

import { mainStyle } from 'automan/assets/main-style';

import LocalStorageClient from 'automan/services/storages/local_storage';

class CalibrationForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      uploadFiles: [],
      targetFileIndex: null,
      isUploaded: false
    };
  }
  handleInputFileChange = event => {
    this.setState({
      uploadFiles: [
        ...this.state.uploadFiles,
        ...[...event.target.files].map(file => {
          return {
            fileInfo: file,
            progress: 0
          };
        })
      ]
    });
  };
  handleChangeStorage = event => {
    this.setState({ storage: event.target.value });
  };
  handleClickCancel = event => {
    // TODO: implement
  };
  handleClickTargetCancel = event => {
    // TODO: implement
  };
  progressUpdate = progress => {
    console.log(progress);
    this.updateFileStateKeyValue(
      this.state.targetFileIndex,
      'progress',
      progress
    );
  };
  updateFileStateKeyValue = (index, key, value) => {
    let uploadFiles = Object.assign([], this.state.uploadFiles);
    uploadFiles[index][key] = value;
    this.setState({ uploadFiles: uploadFiles });
  };
  nextFileUpload = index => {
    let that = this;
    if (that.state.uploadFiles.length == index) {
      that.setState({ isUploaded: true });
      return;
    }
    that.setState({ targetFileIndex: index });
    let targetFile = that.state.uploadFiles[index];
    //let name = targetFile.fileInfo.name;
    //let size = targetFile.fileInfo.size;
    let requestPath = `/projects/${this.props.currentProject.id}/calibrations/`;
    LocalStorageClient.upload(
      requestPath,
      targetFile.fileInfo,
      that.progressUpdate,
      that.nextFileUpload,
      index
    );
  };
  handleClickUpload = event => {
    if (this.state.uploadFiles.length == 0) {
      alert('No raw data is selected.');
    }
    this.nextFileUpload(0);
  };
  initialize = () => {
    this.setState({
      open: false,
      uploadFiles: [],
      targetFileIndex: null,
      isUploaded: false
    });
  };
  show = () => {
    this.setState({ open: true });
  };
  hide = () => {
    this.initialize();
  };
  render() {
    const { classes } = this.props;
    const { uploadFiles, isUploaded } = this.state;
    const isInitialized = this.state.uploadFiles.length == 0;
    const filesContent = (
      <div>
        {uploadFiles.map((f, index) => {
          return (
            <Grid key={index} container spacing={24}>
              <Grid item xs={4}>
                <p>{f.fileInfo.name}</p>
              </Grid>
              <Grid item xs={6}>
                <LinearProgress variant="determinate" value={f.progress} />
              </Grid>
              <Grid item xs={2}>
                <Button
                  disabled={f.progress == 100}
                  onClick={this.handleClickCancel}
                >
                  <Cancel />
                  <span>Cancel</span>
                </Button>
              </Grid>
            </Grid>
          );
        })}
      </div>
    );
    return (
      <Dialog
        fullScreen
        open={this.props.formOpen}
        onClose={this.props.hide}
        aria-labelledby="form-dialog-title"
      >
        <AppBar>
          <Toolbar>
            <IconButton
              color="inherit"
              onClick={this.props.hide}
              aria-label="Close"
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>
        <div className={classes.drawerHeader} />
        <DialogContent>
          <label>CALIBRATION FILE</label>
          <form
            id="fileupload"
            method="post"
            name="fileupload"
            action="/file_upload/"
            encType="multipart/form-data"
          >
            <input
              type="hidden"
              id="uploaded_at"
              name="uploaded_at"
              value="0"
            />
            <input
              type="file"
              name="file"
              accept=".yml,.yaml"
              multiple
              onChange={this.handleInputFileChange}
            />

            <Button
              disabled={isUploaded || isInitialized}
              onClick={this.handleClickTargetCancel}
            >
              <Cancel />
              <span>Cancel</span>
            </Button>

            {filesContent}
            {isUploaded ? (
              <Button onClick={this.props.hide}>
                <CameraAlt />
                <span>Calibrations Table</span>
              </Button>
            ) : (
              <Button disabled={isInitialized} onClick={this.handleClickUpload}>
                <CloudUpload />
                <span>Upload</span>
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    );
  }
}

CalibrationForm.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'CalibrationForm' }),
  connect(
    mapStateToProps,
    null
  )
)(CalibrationForm);
