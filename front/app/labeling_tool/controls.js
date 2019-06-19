import RequestClient from 'automan/services/request-client'

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
  gui = new dat.GUI(/*{autoPlace: false}*/);
  //Controls.update();
  //$('').append(gui.domElement);
};


const initToolBar = function() {
};
const initSideBar = function() {
};

// export object
export default class Controls {
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



