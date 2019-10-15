import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import CameraAlt from '@material-ui/icons/CameraAlt';
import Cancel from '@material-ui/icons/Cancel';
import Close from '@material-ui/icons/Close';
import CloudUpload from '@material-ui/icons/CloudUpload';
import CardHeader from '@material-ui/core/CardHeader';

import { mainStyle } from 'automan/assets/main-style';

import AzureBlobClient from 'automan/services/storages/azure_blob';
import LocalStorageClient from 'automan/services/storages/local_storage';

class OriginalDataForm extends React.Component {
  constructor(props) {
    super(props);
    this.requesting = false;
    this.state = {
      uploadFiles: [],
      storage: { storage_type: null },
      storages: [],
      storage_type: 'None',
      targetFileIndex: null,
      isUploaded: false
    };
  }
  componentDidMount() {
    if (!this.props.currentProject) {
      return;
    }
    this.requestStorages();
  }
  componentDidUpdate(prevProps){
    if (!this.props.currentProject || this.state.storages.length > 0) {
      return;
    }
    this.requestStorages();
  }
  requestStorages() {
    let url = `/projects/${this.props.currentProject.id}/storages/`;
    if(this.requesting) {
      return;
    }
    this.requesting = true;
    RequestClient.get(
      url,
      null,
      data => {
        this.setState({ storages: data.records });
        if (data.records.length > 0) {
          this.setState({ storage: data.records[0] });
        }
      },
      () => {}
    );
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
  handleChangeStorage = event => {
    this.setState({ storage: event.target.value });
  };
  handleClickCancel = event => {
    // TODO: implement
  };
  handleClickTargetCancel = event => {
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
    let that = this;
    if (index > 0) {
      let prevIndex = index - 1;
      let originalId = this.state.uploadFiles[prevIndex].id;
      let url =
        `/projects/${that.props.currentProject.id}` +
        `/originals/${originalId}/`;
      RequestClient.put(url, { status: 'uploaded' }, data => {}, () => {});
    }
    if (that.state.uploadFiles.length == index) {
      that.setState({ isUploaded: true });
      return;
    }
    that.setState({ targetFileIndex: index });
    let targetFile = that.state.uploadFiles[index];
    let registerInfo = {
      name: targetFile.fileInfo.name,
      size: targetFile.fileInfo.size,
      file_type: 'rosbag',
      file_codec: 'gz',
      storage_id: that.state.storage.id
    };
    let storageInfo;
    console.log(registerInfo);
    RequestClient.post(
      '/projects/' + that.props.currentProject.id + '/originals/',
      registerInfo,
      data => {
        storageInfo = JSON.parse(data);
        this.updateFileStateKeyValue(index, 'id', storageInfo.id);
      },
      () => {}
    )
      .then(() => {
        storageInfo.storage_type = 'LOCAL_NFS'; // FIXME
        if (storageInfo.storage_type == 'AZURE') {
          AzureBlobClient.upload(
            targetFile.fileInfo,
            storageInfo.access_info,
            that.progressUpdate,
            that.nextFileUpload,
            index,
            storageInfo.id
          );
        } else if (storageInfo.storage_type == 'LOCAL_NFS') {
          let requestPath =
            `/projects/${this.props.currentProject.id}` +
            `/originals/${storageInfo.id}/file_upload/`;
          LocalStorageClient.upload(
            requestPath,
            targetFile.fileInfo,
            that.progressUpdate,
            that.nextFileUpload,
            index
          );
        } else {
          alert(storageInfo.storage_type + ' is not supported.');
        }
      })
      .then(() => {});
  };
  handleClickUpload = event => {
    if (this.state.uploadFiles.length == 0) {
      alert('No raw data is selected.');
    }
    this.nextFileUpload(0);
  };
  hide = () => {
    this.setState({
      uploadFiles: [],
      targetFileIndex: null,
      isUploaded: false
    });
    this.props.hide()
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
                  onClick={this.handleClickTargetCancel}
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
    const storageMenu = this.state.storages.map(function(storage, index) {
      return (
        <MenuItem key={index} value={storage}>
          {storage.storage_type}
        </MenuItem>
      );
    });
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
        <CardHeader action={closeButton} title="Upload form" />
        <DialogContent>
          <form className={classes.container}>
            <FormControl className={classes.formControl}>
              <InputLabel htmlFor="storage">storage</InputLabel>
              <Select
                value={this.state.storage}
                onChange={this.handleChangeStorage}
              >
                {storageMenu}
              </Select>
            </FormControl>
            <br />
            <FormControl className={classes.formControl}>
              <label>ORIGINAL FILE</label>
              <input type="hidden" name="original_files" value="" />
              <input
                type="hidden"
                id="original_uploaded_at"
                name="original_uploaded_at"
                value="0"
              />
            </FormControl>
          </form>

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
              accept=".bag, .rosbag"
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
                <span>Raws Table</span>
              </Button>
            ) : (
                <Button disabled={isInitialized} onClick={this.handleClickUpload}>
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

OriginalDataForm.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'OriginalDataForm' }),
  connect(
    mapStateToProps,
    null
  )
)(OriginalDataForm);
