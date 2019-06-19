import Annotation from 'automan/labeling_tool/annotation';
import ImageLabelTool from 'automan/labeling_tool/image_label_tool';
import PCDLabelTool from 'automan/labeling_tool/pcd_label_tool';
import Controls from 'automan/labeling_tool/controls';
import KlassSet from 'automan/labeling_tool/klass_set';

import RequestClient from 'automan/services/request-client';

let annotation, imageLabelTool, pcdLabelTool, controls, klassSet;

const toolStatus = {
  // informations
  projectId: null,       // from location
  projectInfo: null,     // from 'project'
  annotationId: null,    // from location
  annotationName: null,  // from 'annotation'
  datasetId: null,       // from 'annotation'
  originalId: null,      // from 'dataset'
  // navigation
  pageBox: null,
  nextFrameButton: null,
  prevFrameButton: null,
  frameSkipText: null,
  // file status
  filenames: {},
  // progress
  frameNumber: 0,
  frameLength: 0,
  skipFrameCount: 1,
  // tool status
  tools: [],
  activeTool: 0,
  labelType: null
};
const innerStatus = {
  loaded: true
};

// base-labeltool public methods
const LabelTool = {
  controls: null,
  isChanged() {
    return annotation.isChanged();
  },
  isLoaded() {
    return innerStatus.loaded &&
      annotation.isLoaded() &&
      toolStatus.tools.every(tool=>tool.isLoaded());
  },
  isEditable() {
    return LabelTool.isLoaded();
  },
  loadFrame(num) {
    // promise function!!
    if (!LabelTool.isLoaded()) {
      return Promise.reject('Duplicate loading');
    }

    // TODO: check 'num'
    // TODO: decide move or not
    let savePromise;
    if (LabelTool.isChanged()) {
      const TEXT_SAVE = 'Do you want to save?';
      const TEXT_MOVE = 'Do you want to move frame WITHOUT saving?';
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

    LabelTool.selectLabel(null);

    innerStatus.loaded = false;
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
  selectKlass(kls) {
    if (!LabelTool.isLoaded()) {
      return false;
    }
    let newKls = klassSet.setTarget(kls);
    if (newKls !== null) {
      const label = annotation.getTarget();
      if (label !== null) {
        annotation.changeKlass(label, newKls);
        controls.SideBar.update();
      }
    } else {
      return false;
    }
    return true;
  },
  getTargetKlass() {
    return klassSet.getTarget();
  },
  getKlass(name) {
    return klassSet.getByName(name);
  },
  selectLabel(label) {
    if (!LabelTool.isLoaded()) {
      return false;
    }
    let newLabel;
    newLabel = annotation.setTarget(label);
    if (newLabel !== null) {
      klassSet.setTarget(newLabel.klass);
    }
    controls.update();
    return true;
  },
  getTargetLabel() {
    return annotation.getTarget();
  },
  createLabel(klass, param) {
    if (!LabelTool.isLoaded()) {
      return null;
    }
    let newLabel = null;
    try {
      newLabel = annotation.create(klass, param);
    } catch (e) {
      controls.error(e);
      return null;
    }
    annotation.setTarget(newLabel);
    klassSet.setTarget(newLabel.klass);
    controls.update();
    return newLabel;
  },
  removeLabel(label) {
    if (!LabelTool.isLoaded()) {
      return false;
    }
    try {
      annotation.remove(label);
    } catch (e) {
      controls.error(e);
      return false;
    }
    controls.update();
    return true;
  },
  toggleDataType() {
    if (toolStatus.tools.length === 1) {
      return;
    }
    const prevTool = LabelTool.getTool();
    toolStatus.activeTool =
      (toolStatus.activeTool + 1) % toolStatus.tools.length;
    const nextTool = LabelTool.getTool();
    prevTool.setActive(false);
    nextTool.setActive(true);
    controls.update();
  },
  getStatus() {
    return toolStatus;
  },
  getLabelType() {
    return toolStatus.labelType;
  },
  getProjectInfo() {
    return toolStatus.projectInfo;
  },
  getTool() {
    return toolStatus.tools[toolStatus.activeTool];
  },
  getTools() {
    return toolStatus.tools;
  },
  getToolFromCandidateId(id) {
    const filtered = toolStatus.tools.filter(tool =>
      tool.isTargetCandidate(id)
    );
    if (filtered.length != 1) {
      controls.error('candidate error');
      return null;
    }
    return filtered[0];
  },
  getFrameNumber() {
    return toolStatus.frameNumber;
  },
  getURL(type, ...args) {
    type = type.toString().toLowerCase();
    const projectId = toolStatus.projectId;
    const annotationId = toolStatus.annotationId;
    const PROJECT_ROOT = '/projects/' + projectId + '/';
    const ANNOTATION_ROOT = PROJECT_ROOT + 'annotations/' + annotationId + '/';
    const DATASET_ROOT =
      PROJECT_ROOT + 'datasets/' + toolStatus.datasetId + '/';
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
          PROJECT_ROOT + 'originals/' + toolStatus.originalId + '/candidates/';
        if (dataType != null) {
          ret += '?data_type=' + dataType;
        }
        break;
      }
      case 'frame_labels':
        ret =
          `${ANNOTATION_ROOT}frames/${toolStatus.frameNumber + 1}` +
          '/objects/';
        break;
      case 'image_url': {
        const candidateId = args[0];
        ret =
          `${DATASET_ROOT}candidates/${candidateId}` +
          `/frames/${toolStatus.frameNumber + 1}/`;
        break;
      }
      case 'frame_blob': {
        const candidateId = args[0];
        ret = toolStatus.filenames[candidateId][toolStatus.frameNumber];
        break;
      }
      /*
           Add more request urls
        */
      default:
        const text = 'Url request error: type="' + type + '", args=' + args;
        controls.error(text);
    }
    return ret;
  }
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
            tools: [imageLabelTool]
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
    .then(
      () =>
        new Promise((resolve, reject) => {
          RequestClient.get(
            LabelTool.getURL('annotation'),
            null,
            res => {
              toolStatus.annotationName = res.name;
              toolStatus.datasetId = res.dataset_id;
              resolve();
            },
            err => {
              reject(err);
            }
          );
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          RequestClient.get(
            LabelTool.getURL('dataset'),
            null,
            res => {
              toolStatus.originalId = res.original_id;
              toolStatus.frameLength = res.frame_count;
              toolStatus.pageBox[0].placeholder =
                1 + '/' + toolStatus.frameLength;
              toolStatus.pageBox.val('');
              resolve();
            },
            err => {
              reject(err);
            }
          );
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          RequestClient.get(
            LabelTool.getURL('candidate_info'),
            null,
            res => {
              const tools = toolStatus.tools;
              res.records.forEach(info => {
                tools.forEach(tool => {
                  if (tool.dataType === info.data_type) {
                    if (tool.candidateId >= 0) {
                      return;
                    }
                    tool.candidateId = info.candidate_id; // TODO: multi candidate_id
                    toolStatus.filenames[tool.candidateId] = [];
                  }
                });
              });
              resolve();
            },
            err => {
              reject(err);
            }
          );
        })
    );
};

const initializeEvent = function() {
  $(window)
    .keydown(function(e) {
      if (e.keyCode == 8 || e.keyCode == 46) {
        // Backspace or Delete
        const label = LabelTool.getTargetLabel();
        if (label != null) {
          LabelTool.removeLabel(label);
        }
      } else if (e.keyCode == 39) {
        LabelTool.nextFrame();
      } else if (e.keyCode == 37) {
        LabelTool.previousFrame();
      } else {
        LabelTool.getTool().handles.keydown(e);
      }
    })
    .keyup(function(e) {
      LabelTool.getTool().handles.keyup(e);
    });

  window.addEventListener('resize', function() {
    // TODO: resize all
    toolStatus.tools.forEach(function(tool) {
      tool.handles.resize();
    });
  });

  // header setup
  toolStatus.nextFrameButton.keyup(function(e) {
    if (e.which === 32) {
      return false;
    }
  });
  toolStatus.nextFrameButton.click(() => {
    LabelTool.nextFrame();
  });
  toolStatus.prevFrameButton.click(() => {
    LabelTool.previousFrame();
  });
  toolStatus.frameSkipText.change(function() {
    let value = $(this).val();
    if (value == '') {
      value = 1;
    } else {
      value = parseInt(value);
    }
    value = Math.max(value, 1);
    toolStatus.skipFrameCount = value;
    $(this).val(value);
  });
  toolStatus.pageBox.keyup(e => {
    if (e.keyCode === 13) {
      LabelTool.setFrame(toolStatus.pageBox.val() - 1);
      toolStatus.pageBox.blur();
    }
  });
};

// init all when dom loaded
$(initializeAll);

export default LabelTool;
