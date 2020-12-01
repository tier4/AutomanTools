import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import LinearProgress from '@material-ui/core/LinearProgress';
import CameraAlt from '@material-ui/icons/CameraAlt';
import Cancel from '@material-ui/icons/Cancel';
import Close from '@material-ui/icons/Close';
import CloudUpload from '@material-ui/icons/CloudUpload';
import CardHeader from '@material-ui/core/CardHeader';

import { mainStyle } from 'automan/assets/main-style';
import LocalStorageClient from 'automan/services/storages/local_storage';

class CalibrationForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadFiles: [],
      targetFileIndex: null,
      isUploading: false,
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
    event.target.value = '';
  };
  handleClickCancel = event => {
    this.setState({
      uploadFiles: [],
      targetFileIndex: null,
      isUploaded: false
    });
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
    if (this.state.uploadFiles.length == index) {
      this.setState({
        isUploaded: true,
        isUploading: false
      });
      return;
    }
    this.setState({ targetFileIndex: index });
    let targetFile = this.state.uploadFiles[index];
    let requestPath = `/projects/${this.props.currentProject.id}/calibrations/`;
    LocalStorageClient.upload(
      requestPath,
      targetFile.fileInfo,
      this.progressUpdate,
      this.nextFileUpload,
      index
    );
  };
  handleClickUpload = event => {
    if (this.state.uploadFiles.length == 0) {
      alert('No raw data is selected.');
    }
    this.setState({ isUploading: true });
    this.nextFileUpload(0);
  };
  hide = () => {
    this.props.hide(this.state.isUploaded);
    this.setState({
      uploadFiles: [],
      targetFileIndex: null,
      isUploaded: false
    });
  };
  render() {
    const { uploadFiles, isUploaded } = this.state;
    const isInitialized = this.state.uploadFiles.length == 0;
    const isUploading = this.state.isUploading;
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
    const closeButton = (
      <Button
        onClick={() => {
          this.hide();
        }}
      >
        <Close />
      </Button>
    );
    return (
      <Dialog
        open={this.props.formOpen}
        onClose={this.hide}
        aria-labelledby="form-dialog-title"
        maxWidth="sm"
        fullWidth={true}
      >
        <CardHeader action={closeButton} title="Calibration upload form" />
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
            {filesContent}
          </form>
        </DialogContent>
        <DialogActions>
          <div>
            {isUploaded ? (
              <Button onClick={this.hide}>
                <CameraAlt />
                <span>Calibrations Table</span>
              </Button>
            ) : (
                <Button
                  disabled={isInitialized || isUploading}
                  onClick={this.handleClickUpload}
                >
                  <CloudUpload />
                  <span>Upload</span>
                </Button>
              )}
          </div>
        </DialogActions>
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
