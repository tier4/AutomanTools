import React from 'react';
import ReactDOM from 'react-dom';

import Controls from 'automan/labeling_tool/controls';

import RequestClient from 'automan/services/request-client';

let annotation, imageLabelTool, pcdLabelTool, controls, klassSet;

const toolStatus = {
};
const innerStatus = {
  loaded: true
};

// base-labeltool public methods
const LabelTool = {
  isEditable() {
    return LabelTool.isLoaded();
  },
  loadFrame(num) {
    let promise = new Promise((resolve, reject) => {
      savePromise
        .then(() => {
          toolStatus.frameNumber = num;
          toolStatus.pageBox[0].placeholder =
            (num + 1) + '/' + toolStatus.frameLength;
          toolStatus.pageBox.val('');

          // load something (image, pcd)
          return Promise.all(
            toolStatus.tools.map(
              tool =>
                new Promise((resolve, reject) => {
                  const candidateId = tool.candidateId;
                  const fname = toolStatus.filenames[candidateId][num];
                  if (typeof fname === 'string') {
                    resolve();
                    return;
                  }
                  RequestClient.get(
                    LabelTool.getURL('image_url', candidateId),
                    null,
                    res => {
                      RequestClient.getBinaryAsURL(
                        res,
                        blobUrl => {
                          toolStatus.filenames[candidateId][num] = blobUrl;
                          resolve();
                        },
                        e => {
                          reject(e);
                        }
                      );
                    },
                    e => {
                      reject(e);
                    }
                  );
                })
            )
          );
        })
        .then(() => {
          // load annotation
          let promises = toolStatus.tools.map(tool => tool.load());
          promises.push(annotation.load(num));
          return Promise.all(promises);
        })
        .then(
          () => {
            // all loaded
            controls.update();
            innerStatus.loaded = true;
            resolve();
          },
          e => {
            // check annotation load error
            controls.error(e);
            innerStatus.loaded = true;
            reject(e);
          }
        );
    });
    return promise;
  },
  reloadFrame() {
    // load annotation
    LabelTool.selectLabel(null);

    innerStatus.loaded = false;
    return annotation.load(toolStatus.frameNumber).then(
      () => {
        // annotation loaded
        controls.update();
        innerStatus.loaded = true;
      },
      e => {
        // check annotation load error
        controls.error(e);
        innerStatus.loaded = true;
        return Promise.reject(e);
      }
    );
  },
  saveFrame() {
    // promise function!!
    if (!LabelTool.isLoaded()) {
      return Promise.reject('Duplicate save');
    }
    return LabelTool.saveStatus()
      .then(() => annotation.save())
      .then(() => LabelTool.reloadFrame());
  },
  saveStatus() {
    // promise function!!
    if (!LabelTool.isLoaded()) {
      return Promise.reject('Duplicate save status');
    }
    return new Promise((resolve, reject) => {
      // save frameNumber
      resolve();
    });
  },
  nextFrame: function(count) {
    if (count == undefined) {
      count = toolStatus.skipFrameCount;
    }
    LabelTool.moveFrame(count);
  },
  previousFrame: function(count) {
    if (count == undefined) {
      count = toolStatus.skipFrameCount;
    }
    LabelTool.moveFrame(-count);
  },
  moveFrame(cnt) {
    // TODO: check type of'cnt'
    let newFrame = toolStatus.frameNumber + cnt;
    newFrame = Math.max(newFrame, 0);
    newFrame = Math.min(toolStatus.frameLength - 1, newFrame);
    if (isFinite(newFrame)) {
      return LabelTool.setFrame(newFrame);
    }
    return false;
  },
  resetBBoxes() {
    LabelTool.setFrame(toolStatus.frameNumber);
  },
  setFrame(num) {
    if (!LabelTool.isLoaded()) {
      return false;
    }
    // TODO: num check
    if (toolStatus.frameNumber !== num) {
      num = parseInt(num);
      if (isNaN(num) || num < 0 || toolStatus.frameLength <= num) {
        return false;
      }
      this.loadFrame(num).catch(e => {
        controls.error(e);
      });
    }
    return true;
  },
};

// base-labeltool internal functions
const initializeAll = function() {
  klassSet = new KlassSet(LabelTool);
  annotation = new Annotation(LabelTool);
  imageLabelTool = new ImageLabelTool(LabelTool);
  pcdLabelTool = new PCDLabelTool(LabelTool);
  controls = new Controls(LabelTool, imageLabelTool, pcdLabelTool);
  LabelTool.controls = controls;

  initializeBase()
    .then(() => {
      return Promise.all([klassSet.init(), annotation.init()]);
    })
    .then(
      () => {
        controls.init();
        toolStatus.tools.forEach(tool => {
          tool.init();
        });
        toolStatus.tools[toolStatus.activeTool].setActive(true);

        initializeEvent();

        LabelTool.loadFrame(0).then(() => {
          // TODO: some check
        });
      },
      e => {
        controls.error(e);
      }
    );
};
const initializeBase = function() {
  // promise function!!
  const pathItems = window.location.pathname.split('/');
  toolStatus.projectId = parseInt(pathItems[2]);
  toolStatus.annotationId = parseInt(pathItems[4]);

  toolStatus.pageBox = $('#page_num');
  toolStatus.nextFrameButton = $('#next-frame-button');
  toolStatus.prevFrameButton = $('#previous-frame-button');
  toolStatus.frameSkipText = $('#frame-skip');

  return new Promise((resolve, reject) => {
    RequestClient.get(
      LabelTool.getURL('project'),
      null,
      res => {
        toolStatus.projectInfo = res;

        // load labeling tools
        const LABEL_TYPES = {
          BB2D: {
            tools: [imageLabelTool, pcdLabelTool]
          },
          BB2D3D: {
            tools: [imageLabelTool, pcdLabelTool]
          }
        };
        const type = LABEL_TYPES[res.label_type];
        if (type == null) {
          reject('Tool type error [' + res.label_type + ']');
          return;
        }
        toolStatus.labelType = type;
        toolStatus.tools = type.tools;

        resolve();
      },
      err => {
        reject(err);
      }
    );
  })
    
};


// init all when dom loaded
//$(initializeAll);

export default class LabelTool_ extends React.Component {
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
  // progress
  loaded = false;
  // file status
  filenames = {};
  frameLength = -1;
  // error
  errorMessage = null;

  isLoaded() {
    return this.loaded;
  }
  loadFrame(num) {
    if (!this.isLoaded()) {
      return Promise.reject('Duplicate loading');
    }

    // TODO: check 'num'
    // TODO: decide move or not
    let savePromise;
    if (LabelTool.isChanged()) {
      const TEXT_SAVE = 'Do you want to save?';
      const TEXT_MOVE = 'Do you want to leave from this frame WITHOUT SAVING?';
      if ( window.confirm(TEXT_SAVE) ) {
        savePromise = annotation.save();
      } else if ( window.confirm(TEXT_MOVE) ) {
        savePromise = Promise.resolve();
      } else {
        return Promise.resolve();
      }
    } else {
      savePromise = Promise.resolve();
    }

    this.controls.selectLabel(null);

    this.loaded = false;
    return savePromise.then(() => {
      return this.controls.setFrameNumber(num);
    }).then(() => {
      return Promise.all(/* load all */);
    }).then(() => {
      this.loaded = true;
      return Promise.resolve();
    }).catch(e => {
      // error toast
      this.loaded = true;
      return Promise.reject();
    });
    // *********
  }
  reloadFrame() {
    this.loaded = false;


    return this.controls.loadFrame().then(
      () => {
         this.loaded = true;
      },
      e => {
         this.loaded = true;
         return Promise.reject(e);
      }
    );
    // *********
  }
  saveFrame() {
    if (!this.isLoaded()) {
      return Promise.reject('Duplicate save');
    }
    return this.saveStatus()
      .then(() => this.controls.save())
      .then(() => this.reloadFrame());
    // *********
  }
  saveStateus() {
    return Promise.resolve();
    // *********
  }
  

  getProjectInfo() {
    return this.projectInfo;
  }
  loadBlobURL(num) {
    // load something (image, pcd) by URL
    return Promise.all(
      this.controls.getTools().map(
        tool => {
          const candidateId = tool.candidateId;
          const fname = this.filenames[candidateId][num];
          if (typeof fname === 'string') {
            return Promise.resolve();
          }
          return (new Promise((resolve, reject) => {
            RequestClient.get(
              this.getURL('image_url', candidateId, num),
              null,
              res => {
                resolve(res);
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
          })
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
      PROJECT_ROOT + 'datasets/' + this.datasetId + '/';
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
          PROJECT_ROOT + 'originals/' + this.originalId + '/candidates/';
        if (dataType != null) {
          ret += '?data_type=' + dataType;
        }
        break;
      }
      case 'frame_labels':
        const frameNumber = args[0] + 1;
        ret = `${ANNOTATION_ROOT}frames/${frameNumber}/objects/`;
        break;
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
        break;
      }
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
      isInitialized: false
    };
    //this.klassSet = new KlassSet(this);
    //this.annotation = new Annotation(this, this.klassSet);
    //this.controls = React.createRef();
    
    this.initializeBase().then(() => {
      console.log('initialized (mountHandle is setted)');
      return new Promise((resolve, reject) => {
        this.mountHandle = () => {
          resolve();
        };
        this.setState({isInitialized: true});
      });
    }).then(() => {
      this.initializeEvent();

      return this.controls.loadFrame(0);
    }).catch(e => {
      this.errorMessage = e;
      console.error(e);
      // ******
    });
  }

  // get project information
  initProject() {
    console.log('initProject');
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
    console.log('initAnnotation');
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
    console.log('initDataset');
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.getURL('dataset'),
        null,
        res => {
          this.originalId = res.original_id;
          this.frameLength = res.frame_count;
          resolve();
        },
        err => {
          reject(err);
        }
      );
    });
  }
  initCandidateInfo() {
    console.log('initCandidateInfo');
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.getURL('candidate_info'),
        null,
        res => {
          this.candidateInfo = res.records;
          
          resolve();
        },
        err => {
          reject(err);
        }
      );
    });
  }
  initializeBase() {
    console.log('inittializeBase');
    const pathItems = window.location.pathname.split('/');
    this.projectId = parseInt(pathItems[2]);
    this.annotationId = parseInt(pathItems[4]);
    return this.initProject()
      .then(() => this.initAnnotation())
      .then(() => this.initDataset())
      .then(() => this.initCandidateInfo())
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
      return <div>Loading</div>;
    }
    return (
      <Controls
        labelTool={this}
        onload={this.controlsDidMount}
      />
    );
  }
};

