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
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import LinearProgress from '@material-ui/core/LinearProgress';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import CameraAlt from '@material-ui/icons/CameraAlt';
import Cancel from '@material-ui/icons/Cancel';
import Close from '@material-ui/icons/Close';
import CloudUpload from '@material-ui/icons/CloudUpload';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';

import { mainStyle } from 'automan/assets/main-style';

import AzureBlobClient from 'automan/services/storages/azure_blob';
import LocalStorageClient from 'automan/services/storages/local_storage';
import AWSS3StorageClient from 'automan/services/storages/aws_s3';

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
      message: null,
      uploadState: 'init'
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
  handleSubFileChange = index => event => {
    this.updateFileStateKeyValue(index, 'subFile', event.target.files[0]);
  };
  handleInputFileChange = event => {
    this.setState({
      uploadFiles: [
        ...this.state.uploadFiles,
        ...[...event.target.files].map(file => {
          return {
            name: file.name,
            fileInfo: file,
            subFile: null,
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
      uploadState: 'init'
    });
  };
  progressUpdate = progress => {
    this.updateFileStateKeyValue(
      this.state.targetFileIndex,
      'progress',
      progress
    );
  };
  updateFileStateKeyValue = (index, key, value) => {
    const uploadFiles = this.state.uploadFiles.slice();
    uploadFiles[index][key] = value;
    this.setState({ uploadFiles: uploadFiles });
  };
  uploadFileSet = async () => {
    const length = this.state.uploadFiles.length;
    for (let index=0; index<length; ++index) {
      this.setState({ targetFileIndex: index });
      const targetFile = this.state.uploadFiles[index];

      const key = await this.uploadFile(index, targetFile.fileInfo);
      this.updateFileStateKeyValue(index, 'name', key);
      const original = await this.registerUploadedFile(index, targetFile, key);

      if (targetFile.subFile != null) {
        const subFileName = targetFile.fileInfo.name + '.metadata.yaml';
        const subFile = new File([targetFile.subFile], subFileName);
        const subkey = await this.uploadFile(index, subFile);
        this.updateFileStateKeyValue(index, 'subname', subkey);
        await this.registerUploadedSubFile(index, targetFile, subkey, original);
      }
    }
  };
  uploadFile = (index, targetFile) => {
    const storage_type = this.state.storage.storage_type;
    const projectId = this.props.currentProject.id;
    if (storage_type === 'AWS_S3') {
      const uploadInfo = {
        storage_id: this.state.storage.id,
        key: projectId + '/bags/' + targetFile.name
      }
      return new Promise((res, rej) => {
        RequestClient.post(
          `/projects/${projectId}/storages/upload/`,
          uploadInfo,
          data => res(data),
          err => {
            rej({message: `${err.message} in "${targetFile.name}".`});
          }
        );
      }).then(data => new Promise((res, rej) => {
        AWSS3StorageClient.upload(
          data.result.url,
          targetFile,
          this.progressUpdate,
          () => res(uploadInfo.key),
          index
        );
      }));
    } else if (storage_type === 'LOCAL_NFS') {
      return new Promise((res, rej) => {
        const requestPath =
          `/projects/${projectId}/originals/file_upload/`;
        LocalStorageClient.upload(
          requestPath,
          targetFile,
          this.progressUpdate,
          () => res(targetFile.name),
          index
        );
      });
    }

    return Promise.reject({
      message: `"${storage_type}" is not supported.`
    });
  }
  registerUploadedFile = (index, targetFile, key) => new Promise((res, rej) => {
    const registerInfo = {
      name: key,
      size: targetFile.fileInfo.size,
      file_type: this.requiredSubFile(targetFile.fileInfo.name) ? 'rosbag2' : 'rosbag',
      file_codec: 'gz',
      storage_id: this.state.storage.id
    };
    RequestClient.post(
      `/projects/${this.props.currentProject.id}/originals/`,
      registerInfo,
      data => res(data),
      e => rej(e)
    );
  });
  registerUploadedSubFile = (index, targetFile, key, original) => new Promise((res, rej) => {
    const registerInfo = {
      original: original.id,
      name: key,
      size: targetFile.subFile.size,
      file_type: 'yaml',
      file_codec: 'gz',
      storage_id: this.state.storage.id
    };
    RequestClient.post(
      `/projects/${this.props.currentProject.id}/originals/subfile/`,
      registerInfo,
      data => res(data),
      e => rej(e)
    );
  });
  handleClickUpload = event => {
    if (this.state.uploadFiles.length == 0) {
      alert('No raw data is selected.');
    }
    this.setState({
      message: null,
      uploadState: 'uploading'
    });

    this.uploadFileSet().then(() => {
      this.setState({
        uploadState: 'uploaded'
      });
    }, err => {
      this.setState({
        message: err.message,
        uploadState: 'init'
      });
    });
  };
  hide = () => {
    this.props.hide(this.state.uploadState === 'uploaded');
    this.setState({
      uploadFiles: [],
      targetFileIndex: null,
      message: null,
      uploadState: 'init'
    });
  };
  requiredSubFile = (fname) => {
    return fname.slice(-4) === '.db3';
  };
  hasAllSubFile() {
    return this.state.uploadFiles.every(f => (
      !this.requiredSubFile(f.fileInfo.name)
      || f.subFile != null
    ));
  }
  render() {
    const { classes } = this.props;
    const { uploadFiles, uploadState } = this.state;
    const isInitialized = this.state.uploadFiles.length == 0
        || !this.hasAllSubFile();
    const filesContent = (
      <div>
        {uploadFiles.map((f, index) => {
          return (
            <Paper
              key={index}
              elevation={2}
              className={classes.dialogPaper}
            >
              <Grid container alignItems="center">
                <Grid item xs={4}>
                  <p>{f.fileInfo.name}</p>
                  {this.requiredSubFile(f.fileInfo.name) ? (
                    <p>
                      {'Add a metadata file'}
                      <input
                        type="file"
                        name="file"
                        accept=".yaml"
                        onChange={this.handleSubFileChange(index)}
                      />
                    </p>
                  ) : null}
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
            </Paper>
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
              accept=".bag, .rosbag, .db3"
              multiple
              onChange={this.handleInputFileChange}
            />
            {filesContent}
          </form>
          {this.state.message != null ? (
            <Typography color="error">
              {this.state.message}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <div>
            {uploadState === 'uploaded' ? (
              <Button onClick={this.hide}>
                <CameraAlt />
                <span>Raws Table</span>
              </Button>
            ) : (
                <Button
                  disabled={isInitialized || uploadState === 'uploading'}
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
