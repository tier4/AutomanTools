import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import TextField from '@material-ui/core/TextField';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import {NavigateNext, NavigateBefore} from '@material-ui/icons';

import KlassSet from 'automan/labeling_tool/klass_set';
import Annotation from 'automan/labeling_tool/annotation';

import ImageLabelTool from 'automan/labeling_tool/image_label_tool';
import PCDLabelTool from 'automan/labeling_tool/pcd_label_tool';

import RequestClient from 'automan/services/request-client'


// toolbar status
const appBarHeight = 54;
// sidebar status
const drawerWidth = 160;
const toolHeight = 300;
const listHead = 20;
const controlsStyle = {
  drawer: {
    width: drawerWidth,
    marginTop: appBarHeight,
    overflow: 'auto'
  },
  list: {
    overflow: 'auto',
    height: '100%',
    position: 'relative'
  },
  listHead: {
    backgroundColor: '#eee',
    color: '#000',
    height: listHead,
    lineHeight: listHead+'px'
  },
  listItem: {
    height: listHead
  },
  selectedListItem: {
  },
  appBar: {
    width: '100%',
    height: appBarHeight
  },
  gridContainer: {
    height: appBarHeight,
  },
  gridItem: {
    textAlign: 'center',
  },
  frameNumberParts: {
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 200
  },
  frameNumber: {
    width: 100
  },
  toolControls: {
    height: toolHeight,
    textAlign: 'center'
  },
  activeTool: {
    border: 'solid 1px #000'
  },
  labelList: {
    height: `calc(40%)`
  },
  klassSetList: {
    textAlign: 'center',
    margin: 'auto',
    //height: `calc(25%)`
  },
  colorPane: {
    width: 18,
    height: 18,
    borderRadius: 2
  },
  content: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth*2}px)`,
    height: `calc(100% - ${appBarHeight}px)`,
    overflow: 'hidden',
    backgroundColor: '#000'
  }
};
/*
let ImageLabelTool, PCDLabelTool, LabelTool;


// dat.GUI menu tool
let gui = null;
const getLabel = function() {
  return LabelTool.getTargetLabel();
};
const guiRef = {
  label: {
    get klass() {
      let label = getLabel();
      if (label == null) { return null; }
      return label.getKlassName();
    },
    set klass(name) {
      let label = getLabel();
      if (label == null) { return null; }
      let klass = KlassSet.getByName(name);
      if (klass == null) { return null; }
      Annotation.changeKlass(label, klass);
    },
  },
  image: {
    getBBox() {
      let label = getLabel();
      if (label == null) { return null; }
      return label.bbox[ImageLabelTool.candidateId];
    },
    // getters 
    get posX() {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.min.x;
    },
    get posY() {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.min.y;
    },
    get sizeX() {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.getSize().x;
    },
    get sizeY() {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.getSize().y;
    },
    // setters
    set posX(v) {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return; }
      bbox.dragStart();
      console.log(JSON.stringify({x: v, prev: bbox.box.min.x}));
      bbox.dragMove(v - bbox.box.min.x, 0);
      bbox.dragEnd();
    },
    set posY(v) {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return; }
      bbox.dragStart();
      bbox.dragMove(0, v - bbox.box.min.y);
      bbox.dragEnd();
    },
    set sizeX(v) {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return; }
      let sx = bbox.box.getSize().x;
      bbox.dragStart();
      bbox.setMaxX(v - sx);
      bbox.dragEnd();
    },
    set sizeY(v) {
      let bbox = guiRef.image.getBBox();
      if (bbox == null) { return; }
      let sy = bbox.box.getSize().y;
      bbox.dragStart();
      bbox.setMaxY(v - sy);
      bbox.dragEnd();
    },
  },
  pcd: {
    getBBox() {
      let label = getLabel();
      if (label == null) { return null; }
      return label.bbox[PCDLabelTool.candidateId];
    },
    // getters
    get posX() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.pos.x;
    },
    get posY() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.pos.y;
    },
    get posZ() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.pos.z;
    },
    get sizeX() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.size.x;
    },
    get sizeY() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.size.y;
    },
    get sizeZ() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      return bbox.box.size.z;
    },
    get yaw() {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      let v = (bbox.box.yaw/Math.PI*180) % 360;
      if (v < -180) { v += 360; }
      else if (v > 180) { v -= 360; }
      return v;
    },
    // setters
    set posX(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.pos.x = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set posY(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.pos.y = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set posZ(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.pos.z = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set sizeX(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.size.x = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set sizeY(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.size.y = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set sizeZ(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.size.z = v;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
    set yaw(v) {
      let bbox = guiRef.pcd.getBBox();
      if (bbox == null) { return 0; }
      bbox.box.yaw = v*Math.PI/180;
      bbox.updateCube();
      PCDLabelTool.redrawRequest();
    },
  },
};
// Add image controller
let imageFolder = null;
const initGUIImage = function(gui, targetLabel) {
  if (imageFolder != null) {
    gui.removeFolder(imageFolder);
    imageFolder = null;
  }
  if (targetLabel==null || !targetLabel.has(ImageLabelTool.candidateId) ) {
    return;
  }
  const folder = gui.addFolder('Image');
  imageFolder = folder;
  folder.open();
  const fpos = folder.addFolder('Position');
  fpos.open();
  fpos.add(guiRef.image, 'posX').name('x').min(0).max(1000).step(1).listen(); // TODO: get max pos
  fpos.add(guiRef.image, 'posY').name('y').min(0).max(1000).step(1).listen();
  const fsize = folder.addFolder('Size');
  fsize.open();
  fsize.add(guiRef.image, 'sizeX').name('x').max(1000).min(10).step(1).listen(); // TODO: use minSize
  fsize.add(guiRef.image, 'sizeY').name('y').max(1000).min(10).step(1).listen();
};
// Add pcd controller
let pcdFolder = null;
const initGUIPCD = function(gui, targetLabel) {
  if (pcdFolder != null) {
    gui.removeFolder(pcdFolder);
    pcdFolder = null;
  }
  if (targetLabel==null || !targetLabel.has(PCDLabelTool.candidateId) ) {
    return;
  }
  const folder = gui.addFolder('PCD');
  pcdFolder = folder;
  folder.open();
  const fpos = folder.addFolder('Position');
  fpos.open();
  fpos.add(guiRef.pcd, 'posX').name('x').max(30).min(-30).step(0.01).listen();
  fpos.add(guiRef.pcd, 'posY').name('y').max(30).min(-30).step(0.01).listen();
  fpos.add(guiRef.pcd, 'posZ').name('z').max(30).min(-30).step(0.01).listen();
  const fsize = folder.addFolder('Size');
  fsize.open();
  fsize.add(guiRef.pcd, 'sizeX').name('x').max(10).min(0.5).step(0.1).listen();
  fsize.add(guiRef.pcd, 'sizeY').name('y').max(10).min(0.5).step(0.1).listen();
  fsize.add(guiRef.pcd, 'sizeZ').name('z').max(10).min(0.5).step(0.1).listen();
  const frotate = folder.addFolder('Rotation');
  frotate.open();
  frotate.add(guiRef.pcd, 'yaw').name('yaw').max(180).min(-180).step(1).listen();
};
// Add tool 
let toolFolder = null;
const toolRef = {
  toggleType: () => {
    LabelTool.toggleDataType();
    const tool = LabelTool.getTool();
    toolRef.toggleTypeItem.name('Tool[' + tool.name + ']');
  },
  toggleTypeItem: null,
  save: () => {
    LabelTool.saveFrame().then(()=>{
      console.log('saved');
    }, (err)=>{
      console.log('save error', err);
    });
  },
  pcdMode: null,
  changeMode: () => {
    let name = PCDLabelTool.changeMode();
    toolRef.pcdMode.name('Mode['+name+']');
  },
  load: () => {
    LabelTool.reloadFrame().then(()=>{
      console.log('reloaded');
    }, (err)=>{
      console.log('reload error', err);
    });
  },
  deleteLabel: () => {
    const targetLabel = LabelTool.getTargetLabel();
    if (targetLabel != null) {
      LabelTool.removeLabel(targetLabel);
    }
  }
};
const initGUITool = function(gui, targetLabel) {
  if (toolFolder != null) {
    gui.removeFolder(toolFolder);
    toolFolder = null;
  }
  const folder = gui.addFolder('Tool');
  toolFolder = folder;
  folder.open();
  const tool = LabelTool.getTool();
  toolRef.toggleTypeItem = folder.add(toolRef, 'toggleType').name('Tool[' + tool.name + ']');
  folder.add(toolRef, 'save').name('Save');
  folder.add(toolRef, 'load').name('Load');
  if (LabelTool.getTool() == PCDLabelTool) {
    const mode = PCDLabelTool.getMode();
    toolRef.pcdMode = folder.add(toolRef, 'changeMode').name('Mode[' + mode + ']');
  }
  // delete
  if (targetLabel != null) {
    folder.add(toolRef, 'deleteLabel').name('Delete');
  }
};
const initGUI = function() {
  gui = new dat.GUI({autoPlace: false});
  //Controls.update();
  //$('').append(gui.domElement);
};


const initToolBar = function() {
};
const initSideBar = function() {
};

// export object
class Controls {
  constructor(labelTool, imageLabelTool, pcdLabelTool) {
    this.labelTool = labelTool;
    this.imageLabelTool = imageLabelTool;
    this.pcdLabelTool = pcdLabelTool;
    LabelTool = labelTool;
    ImageLabelTool = imageLabelTool;
    PCDLabelTool = pcdLabelTool;
  }
  init() {
    initGUI();
    initToolBar();
    initSideBar();
    return Promise.resolve();
  }
  update() {
    this.GUI.update();
    this.SideBar.update();
  }
  error(e) {
    if (e instanceof Error) {
      console.error(e);
    } else {
      console.error(arguments);
    }
  }
  GUI = {
    update() {
      const targetLabel = LabelTool.getTargetLabel();
      initGUITool(gui, targetLabel);
      initGUIImage(gui, targetLabel);
      initGUIPCD(gui, targetLabel);
    }
  }
  ToolBar = {
    update() {
    }
  }
  SideBar = {
    update() {
    }
  }
};
*/
class Controls extends React.Component {
  labelTool = null;
  annotation = null;
  getAnnotation = (tgt) => { this.annotation = tgt; }
  klassSet = null;
  getKlassSet = (tgt) => { this.klassSet= tgt; }
  // progress
  frameLength = 0;
  // navigation
  //pageBox = null;
  //nextFrameButton = null;
  //prevFrameButton = null;
  //frameSkipText = null;
  content = null;
  // tool status
  tools = [];
  toolNames = [];
  toolComponents = [];

  constructor(props) {
    super(props);
    this.state = {
      frameNumber: 0,
      skipFrameCount: 1,
      activeTool: 0
    };
    this.labelTool = props.labelTool;

    this.frameLength = this.labelTool.frameLength;
    this.initTools();
  }
  initTools() {
    // load labeling tools
    const LABEL_TYPES = {
      BB2D: {
        tools: [ImageLabelTool, PCDLabelTool],
        names: ['2D', '3D']
      },
      BB2D3D: {
        tools: [ImageLabelTool, PCDLabelTool],
        names: ['2D', '3D']
      }
    };
    const type = LABEL_TYPES[this.labelTool.labelType];
    if (type == null) {
      console.error('Tool type error [' + this.labelTool.labelType + ']');
      return;
    }
    this.toolNames = type.names;
    this.toolComponents = [];
    this.tools = type.tools.map((tool, idx) => {
      const ref = React.createRef();
      const Component = tool;
      const component = (
        <Component
          key={idx}
          ref={ref}
          labelTool={this.labelTool}
          controls={this}
        />
      );
      this.toolComponents.push(component);
      return ref;
    });
    console.log(this.tools, this.toolComponents);
  }
  init() {
    return Promise.all([
      this.annotation.init(this.klassSet),
      this.klassSet.init()
    ]);
  }
  resize() {
    // TODO: resize all
    const w = $(window);
    const size = {
      width: w.width() - drawerWidth * 2,
      height: w.height() - appBarHeight
    };
    this.tools.forEach((tool) => {
      tool.current.handles.resize(size);
    });
  }
  initEvent() {
    $(window)
      .keydown(e => {
        console.log(`window keydown(code = ${e.keyCode})`);
        if (e.keyCode == 8 || e.keyCode == 46) {
          // Backspace or Delete
          const label = this.getTargetLabel();
          if (label != null) {
            this.removeLabel(label);
          }
        } else if (e.keyCode == 39) {
          this.nextFrame();
        } else if (e.keyCode == 37) {
          this.previousFrame();
        } else {
          this.getTool().handles.keydown(e);
        }
      })
      .keyup(e => {
        this.getTool().handles.keyup(e);
      });

    window.addEventListener('resize', () => {
      this.resize();
    });

    // header setup
    /*
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
    */
  }
  isLoaded() {
    // *********
  }

  selectKlass(kls) {
    if (!this.labelTool.isLoaded()) {
      return false;
    }
    let newKls = this.klassSet.setTarget(kls);
    if (newKls !== null) {
      const label = this.annotation.getTarget();
      if (label !== null) {
        this.annotation.changeKlass(label, newKls);
        // update ??
      }
    } else {
      return false;
    }
    return true;
    // *********
  }
  getTargetKlass() {
    return this.klassSet.getTarget();
  }
  getKlass(name) {
    return this.klassSet.getByName(name);
  }
  selectLabel(label) {
    if (!this.labelTool.isLoaded()) {
      return false;
    }
    let newLabel;
    newLabel = this.annotation.setTarget(label);
    if (newLabel !== null) {
      this.klassSet.setTarget(newLabel.klass);
    }
    //update
    return true;
    // *********
  }
  getTargetLabel() {
    return this.annotation.getTarget();
  }
  createLabel(klass, param) {
    if (!this.labelTool.isLoaded()) {
      return null;
    }
    let newLabel = null;
    try {
      newLabel = this.annotation.create(klass, param);
    } catch (e) {
      // error
      console.log(e);
      return null;
    }
    this.annotation.setTarget(newLabel);
    this.klassSet.setTarget(newLabel.klass);
    // update ??
    return newLabel;
    // *********
  }
  removeLabel(label) {
    if (!this.labelTool.isLoaded()) {
      return false;
    }
    try {
      this.annotation.remove(label);
    } catch (e) {
      // error
      return false;
    }
    // update
    return true;
    // *********
  }

  getTools() {
    return this.tools.map(ref => ref.current);
  }
  setTool(idx) {
    const activeTool = this.state.activeTool
    if (activeTool === idx) {
      return;
    }
    const prevTool = this.tools[activeTool].current;
    const nextTool = this.tools[idx].current;
    this.setState({activeTool: idx});
    prevTool.setActive(false);
    nextTool.setActive(true);
    // update ??
    // *********
  }
  getTool() {
    return this.tools[this.state.activeTool].current;
  }
  getToolFromCandidateId(id) {
    const filtered = this.getTools().filter(tool =>
      tool.isTargetCandidate(id)
    );
    if (filtered.length != 1) {
      //controls.error('candidate id error');
      return null;
    }
    return filtered[0];
    // *********
  }

  nextFrame(count) {
    if (count == undefined) {
      count = this.state.skipFrameCount;
    }
    this.moveFrame(count);
  }
  previousFrame(count) {
    if (count == undefined) {
      count = this.state.skipFrameCount;
    }
    this.moveFrame(-count);
  }
  moveFrame(cnt) {
    // TODO: check type of'cnt'
    let newFrame = this.state.frameNumber + cnt;
    newFrame = Math.max(newFrame, 0);
    newFrame = Math.min(this.frameLength - 1, newFrame);
    if (window.isFinite(newFrame)) {
      return this.setFrameNumber(newFrame);
    }
    return false;
    // *********
  }
  isLoading = false;
  setFrameNumber(num) {
    num = parseInt(num);
    if (isNaN(num) || num < 0 || this.frameLength <= num) {
      return false;
    }
    if (this.state.frameNumber === num) {
      return true;
    }

    this.loadFrame(num).then(
      () => {
      },
      () => {
      }
    );
    return true;
  }
  
  saveFrame() {
    return this.annotation.save();
  }
  loadFrame(num) {
    if (this.isLoading) {
      return Promise.reject('duplicate loading');
    }
    this.selectLabel(null);

    this.isLoading = true;
    if (num == null) {
      num = this.state.frameNumber;
    }

    this.isLoading = true;
    console.log('start loadFrame('+num+')');
    return this.labelTool.loadBlobURL(num)
      .then(() => {
        console.log('  start annotation load');
        return this.annotation.load(num);
      })
      .then(() => {
        console.log('  start tool load');
        return Promise.all(
          this.getTools().map(
            tool => tool.load(num)
          )
        );
      })
      .then(() => {
        console.log('load end');
        this.isLoading = false;
        this.setState({frameNumber: num});
      });
  }
  getFrameNumber() {
    return this.state.frameNumber;
    // *********
  }
  

  componentDidMount() {
    this.labelTool.candidateInfo.forEach(info => {
      this.getTools().forEach(tool => {
        if (tool.dataType === info.data_type) {
          if (tool.candidateId >= 0) {
            return;
          }
          tool.candidateId = info.candidate_id; // TODO: multi candidate_id
          this.labelTool.filenames[tool.candidateId] = [];
        }
      });
    });
    
    this.tools[this.state.activeTool].current.setActive(true);

    this.resize();

    this.init().then(() => {
      this.props.onload(this);
    });
  }

  // events
  onClickNextFrame = (e) => {
    this.nextFrame();
  };
  onClickPrevFrame = (e) => {
    this.previousFrame();
  };
  onFrameBlurOrFocus = (e) => {
    e.target.value = '';
  };
  onFrameKeyPress = (e) => {
    // only when enter
    if (e.charCode == 13) {
      let value = +(e.target.value);
      this.moveFrame(value);
      e.target.value = '';
      e.preventDefault();
      return;
    }
  };

  renderKlassSet(classes) {
    return (
      <KlassSet
        labelTool={this.labelTool}
        controls={this}
        classes={classes}
        getRef={this.getKlassSet}
      />
    );
  }
  renderLabels(classes) {
    return (
      <Annotation
        labelTool={this.labelTool}
        controls={this}
        classes={classes}
        getRef={this.getAnnotation}
      />
    );
  }
  renderLeftBar(classes) {
    const toolButtons = [];
    this.toolNames.forEach((name, idx) => {
      const cls = this.state.activeTool === idx ? classes.activeTool : '';
      const button = (
        <Button
          onClick={() => this.setTool(idx)}
          key={idx}
          className={cls}
        >
          {name}
        </Button>
      );
      toolButtons.push(button);
    });
    return (
      <Drawer
        anchor="left"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
        <div className={classes.toolControls}>
          Tools
          <Divider />
          <Grid container alignItems="center">
            <Grid item xs={12}>
              {toolButtons}
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Button>Save</Button>
              <Button>Reload</Button>
            </Grid>
            <Grid item xs={12}>
              <Button>Copy</Button>
              <Button>Paste</Button>
            </Grid>
            <Grid item xs={12}>
              <Button>Undo</Button>
              <Button>Redo</Button>
            </Grid>
          </Grid>
        </div>
        <Divider />
        <div className={classes.labelList}>
          {this.renderLabels(classes)}
        </div>
      </Drawer>
    );
  }
  render() {
    console.log('rerender');
    const classes = this.props.classes;
    let frameNumberForm = (
      <div className={classes.frameNumberParts}>
        <IconButton
          color="inherit"
          onClick={this.onClickPrevFrame}
        >
          <NavigateBefore />
        </IconButton>
        <TextField
          name="Frame"
          type="text"
          placeholder={(this.state.frameNumber+1)+'/'+this.frameLength}
          onBlur={this.onFrameBlurOrFocus}
          onFocus={this.onFrameBlurOrFocus}
          onKeyPress={this.onFrameKeyPress}
          className={classes.frameNumber}
          margin="normal"
        />
        <IconButton
          color="inherit"
          onClick={this.onClickNextFrame}
        >
          <NavigateNext />
        </IconButton>
      </div>
    );
    let appBar = (
      <AppBar
        position="relative"
        className={classes.appBar}
      >
        <Grid
          container
          alignItems="center"
          className={classes.gridContainer}
        >
          <Grid item xs={3} className={classes.gridItem}>
            {frameNumberForm}
          </Grid>
          <Grid item xs={9}>
            {this.renderKlassSet(classes)}
          </Grid>
        </Grid>
      </AppBar>
    );
    
    let editBar = (
      <Drawer
        anchor="right"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
        test
      </Drawer>
    );
    return (
      <div>
        {appBar}
        {this.renderLeftBar(classes)}
        <main
          className={classes.content}
        >
          {this.toolComponents}
        </main>
        {editBar}
      </div>
    );
  }
}
export default withStyles(controlsStyle)(Controls);

