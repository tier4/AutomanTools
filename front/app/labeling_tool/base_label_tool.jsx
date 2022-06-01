import React from 'react';
import ReactDOM from 'react-dom';

import { compose } from 'redux';
import { connect } from 'react-redux';

import Controls from 'automan/labeling_tool/controls';
import LoadingProgress from 'automan/labeling_tool/base_tool/loading_progress';

import RequestClient from 'automan/services/request-client';
import { setLabelTool } from './actions/tool_action';
import { setFrameInfo, setCandidateInfo } from './actions/annotation_action';


class LabelTool extends React.Component {
  // components
  controls = null;
  // informations
  projectId = null;       // from location
  projectInfo = null;     // from 'project'
  annotationId = null;    // from location
  annotationName = null;  // from 'annotation'
  datasetId = null;       // from 'annotation'
  originalId = null;      // from 'dataset'
  labelType = null;
  // file status
  filenames = {};
  frameLength = -1;
  loadedFileSet = new Set();
  // error
  errorMessage = null;

  saveStateus() {
    return Promise.resolve();
    // *********
  }


  getProjectInfo() {
    return this.projectInfo;
  }
  prefetchManage(num) {
    const len = this.PREFETCH_LEN;
    const prefetchNum = [];
    for (let i = -len; i <= len; ++i) {
      const skipStep = this.controls.getFixedSkipFrameCount()
      const frameNumber = num + i * skipStep;
      if (this.controls.isFrameNumberValid(frameNumber)) prefetchNum.push(frameNumber);
    }
    const loaded = this.loadedFileSet;
    for (let it of prefetchNum) {
      if (!loaded.delete(it)) {
        this.loadBlobURL(it);
      }
    }
    for (let it of loaded) {
      this.unloadBlobURL(it);
    }
    this.loadedFileSet = new Set(prefetchNum);
  }
  unloadBlobURL(num) {
    this.controls.getTools().forEach(
      tool => {
        const candidateId = tool.candidateId;
        const fname = this.filenames[candidateId][num];
        if (typeof fname === 'string') {
          tool.unload(num);
        } else if (fname instanceof Promise) {
          fname.then();
        }
        this.filenames[candidateId][num] = null;
      }
    );
  }
  loadBlobURL(num) {
    // load something (image, pcd) by URL
    let candidateIds = [];
    this.controls.getTools().forEach(tool => {
      if (tool.candidateIds) {
        candidateIds = candidateIds.concat(tool.candidateIds);
      } else {
        candidateIds.push(tool.candidateId);
      }
    });
    return Promise.all(
      candidateIds.map(candidateId => {
          const fname = this.filenames[candidateId][num];
          if (typeof fname === 'string') {
            return Promise.resolve();
          } else if (fname instanceof Promise) {
            return fname;
          }
          const ret = (new Promise((resolve, reject) => {
            RequestClient.get(
              this.getURL('image_url', candidateId, num),
              null,
              res => {
                resolve(res['image_link']);
                this.props.dispatchSetFrameInfo(
                  num, { "time": res['frame'] }
                );
              },
              e => {
                reject(e);
              }
            );
          })).then(res => {
            return new Promise((resolve, reject) => {
              RequestClient.getBinaryAsURL(
                res,
                blobUrl => {
                  this.filenames[candidateId][num] = blobUrl;
                  resolve();
                },
                e => {
                  reject(e);
                }
              );
            });
          });
          this.filenames[candidateId][num] = ret;
          return ret;
        }
      )
    );
  }
  getURL(type, ...args) {
    type = type.toString().toLowerCase();
    const projectId = this.projectId;
    const annotationId = this.annotationId;
    const PROJECT_ROOT = '/projects/' + projectId + '/';
    const ANNOTATION_ROOT = PROJECT_ROOT + 'annotations/' + annotationId + '/';
    const DATASET_ROOT =
      `${PROJECT_ROOT}datasets/${this.datasetId}/`;
    const ORIGINAL_ROOT =
      `${PROJECT_ROOT}originals/${this.originalId}/`;
    let ret = null;
    switch (type) {
      case 'project':
        ret = PROJECT_ROOT;
        break;
      case 'annotation':
        ret = ANNOTATION_ROOT;
        break;
      case 'dataset':
        ret = DATASET_ROOT;
        break;
      case 'candidate_info': {
        const dataType = args[0];
        ret =
          PROJECT_ROOT + 'datasets/' + this.datasetId + '/candidates/';
        if (dataType != null) {
          ret += '?data_type=' + dataType;
        }
        break;
      }
      case 'set_candidate_info': {
        const candidateId = args[0];
        ret = `${ORIGINAL_ROOT}candidates/${candidateId}/`;
        break;
      }
      case 'frame_labels': {
        const frameNumber = args[0] + 1;
        ret = `${ANNOTATION_ROOT}frames/${frameNumber}/objects/`;
        break;
      }
      case 'closest_active_frame': {
        const frameNumber = args[0] + 1;
        ret = `${ANNOTATION_ROOT}frames/${frameNumber}/closest_active_frame/`;
        break;
      }
      case 'image_url': {
        const candidateId = args[0];
        const frameNumber = args[1] + 1;
        ret =
          `${DATASET_ROOT}candidates/${candidateId}` +
          `/frames/${frameNumber}/`;
        break;
      }
      case 'frame_blob': {
        const candidateId = args[0];
        const frameNumber = args[1] + 1;
        ret = this.filenames[candidateId][frameNumber-1];
        // TODO: string check
        break;
      }
      case 'unlock':
        ret = ANNOTATION_ROOT + 'unlock/';
        break;
      /*
           Add more request urls
        */
      default:
        const text = 'Url request error: type="' + type + '", args=' + args;
        this.controls.error(text);
    }
    return ret;
  }

  labelUpdate(label) {
    // *********
  }
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      isInitialized: false,
      loadingState: -1,
      loadingCnt: 0,
    };

    props.dispatchSetLabelTool(this);

    const pathItems = window.location.pathname.split('/');
    this.projectId = parseInt(pathItems[2]);
    this.annotationId = parseInt(pathItems[4]);

    this.initializeBase()
      .then(() => {
        return new Promise((resolve, reject) => {
          this.mountHandle = () => {
            resolve();
          };
          this.setState({isInitialized: true});
        });
      })
      .then(() => this.prefetchBlobs())
      .then(() => {
        this.initializeEvent();

        return this.controls.loadFrame(0);
      })
      .catch(e => {
        this.errorMessage = e;
        console.error(e);
        // ******
      });
  }
  PREFETCH_LEN = 5;
  prefetchBlobs() {
    const len = Math.min(
      this.PREFETCH_LEN,
      this.frameLength
    );
    const requests = [];
    this.setState({
      loadingState: 0,
      loadingCnt: this.frameLength,
    });
    for(let i=0; i<=len; ++i) {
      requests.push(
        this.loadBlobURL(i).then(() => {
          this.setState(state => ({
            loadingState: state.loadingState + 1
          }));
        })
      );
    }
    return Promise.all(requests).then(() => {
      this.setState({
        loadingState: -1
      });
    });
  }

  // get project information
  initProject() {
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.getURL('project'),
        null,
        res => {
          this.projectInfo = res;

          this.labelType = res.label_type;

          resolve();
        },
        err => {
          reject(err);
        }
      );
    })
  }
  initAnnotation() {
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.getURL('annotation'),
        null,
        res => {
          this.annotationName = res.name;
          this.datasetId = res.dataset_id;
          resolve();
        },
        err => {
          reject(err);
        }
      );
    });
  }
  initDataset() {
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.getURL('dataset'),
        null,
        res => {
          this.originalId = res.original_id;
          this.frameLength = res.frame_count;
          this.props.dispatchSetCandidateInfo(res.candidates);
          resolve();
        },
        err => {
          reject(err);
        }
      );
    });
  }
  initializeBase() {
    return this.initProject()
      .then(() => this.initAnnotation())
      .then(() => this.initDataset())
  }

  initializeEvent() {
    this.controls.initEvent();
  }
  isInitialized() {
    return this.state.isInitialized;
  }
  isLoaded() {
    return this.state.isLoaded;
  }
  controlsDidMount = (controls) => {
    this.controls = controls;
    this.mountHandle();
    this.setState({isLoaded: true});
  }
  render() {
    if (this.errorMessage !== null) {
      return (
        <div>
          {this.errorMessage}
        </div>
      );
    }
    if (!this.isInitialized()) {
      return (
        <LoadingProgress
          text="Tool initializing"
          progress={null}
        />
      );
    }
    return (
      <Controls
        labelTool={this}
        onload={this.controlsDidMount}
        loadingState={this.state.loadingState / this.state.loadingCnt}
      />
    );
  }
};

const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  frameNumber: state.annotation.frameNumber
});
const mapDispatchToProps = dispatch => ({
  dispatchSetLabelTool: target => dispatch(setLabelTool(target)),
  dispatchSetFrameInfo: (num, info) => dispatch(setFrameInfo(num, info)),
  dispatchSetCandidateInfo: (info) => dispatch(setCandidateInfo(info))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(LabelTool);

