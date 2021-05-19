
import React from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { addTool } from './actions/tool_action';
import { setTopic } from './actions/pcd_tool_action';
import { setTargetState } from './actions/annotation_action';

import BoxFrameObject from './pcd_tool/box_frame_object';
import PCDBBox from './pcd_tool/pcd_bbox';
import EditBar from './pcd_tool/edit_bar';

// 3d eidt arrow
const arrowColors = [0xff0000, 0x00ff00, 0x0000ff],
      AXES = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];

const ZERO2 = new THREE.Vector2(0, 0);
const EDIT_OBJ_SIZE = 0.5;

class PCDLabelTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this._wrapperElement = React.createRef();
    this._mainElement = React.createRef();
    this._wipeElement = React.createRef();
    this._projectionZElement = React.createRef();
    this._projectionXElement = React.createRef();
    this._projectionYElement = React.createRef();
    this._toolButtons = (
      <Button
        key={0}
        onClick={this.setHeight}
      >
        Set Height
      </Button>
    );
    props.dispatchAddTool(props.idx, this);
  }
  componentDidMount() {
    this.init();
  }
  getButtons() {
    return this._toolButtons;
  }
  getEditor() {
    return <EditBar candidateId={this.candidateId}/>
  }
  render() {
    const projectionStyle = {
      padding: 2,
      backgroundColor: '#ccc'
    };
    this.setVisibleTo(this._currentPointMesh);
    this.setVisibleTo(this._currentWipePointMesh);
    this.setCalibration(this._currentPointMesh);
    this.setCalibration(this._currentWipePointMesh);
    return (
      <div
        ref={this._wrapperElement}
        style={{position: 'relative'}}
      >
        <div ref={this._mainElement} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: '#fff',
        }}>
          <div
            style={projectionStyle}
            ref={this._projectionZElement}
          />
          <div
            style={projectionStyle}
            ref={this._projectionXElement}
          />
          <div
            style={projectionStyle}
            ref={this._projectionYElement}
          />
        </div>
        <div
          ref={this._wipeElement}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            borderTop: 'solid 2px #fff',
            borderRight: 'solid 2px #fff'
          }}
          onClick={() => this.props.controls.previousFrame()}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#fff',
              padding: '0px 7px'
            }}
          >
            Prev
          </div>
        </div>
      </div>
    );
  }

  // private
  _canvasSize = { width: 2, height: 1 };
  _wrapper = null;
  _main = null;
  _wipe = null;
  _loaded = true;
  _scene = null;
  _renderer = null;
  _camera = null;
  _cameraControls = null;
  //cameraExMat = new THREE.Matrix4();
  // PCD objects
  _pcdLoader = null;
  _pointMeshes = [];
  _wipePointMeshes = [];
  _currentWipePointMesh = null;
  _currentPointMesh = null;
  // to mouse position
  _groundPlane = null;
  _sceneAxis = null;
  _zPlane = null;
  // control mode
  _modeMethods = createModeMethods(this);
  _modeStatus = {
    mode: 'edit',
    busy: false,
    nextFunc: null,
    nextMode: null
  };
  _redrawFlag = true;
  _isBirdView = true;
  // to mode 'move'
  _editArrowGroup = null;
  _editArrows = null;
  // to mode 'resize'
  _editFaceCube = null;
  // to mode 'edit'
  _creatingBBox = {
    startPos: null,
    endPos: null,
    box: null
  };

  // public
  name = 'PCD';
  dataType = 'PCD';
  candidateId = -1;
  candidateIds = [];
  setCandidateId(id) {
    this.candidateId = id;
    this.addOtherCandidateId(id);
  }
  addOtherCandidateId(id) {
    this.candidateIds.push(id);
    this.props.dispatchSetTopic(id, true);
  }
  pcdBBoxes = new Set();

  isLoaded() {
    return this._loaded;
  }
  isTargetCandidate(id) {
    if (this.candidateId == id) { return true; }
    return this.candidateIds.some(i => i == id);
  }
  init() {
    if ( !Detector.webgl ) {
      Detector.addGetWebGLMessage();
      throw 'WebGL error'; // TODO: be Error()
      return;
    }
    this._initThree();
    this._initCamera();
    this._initDom();
    this._initEvent();
    this._initArrow();
    this._initEditObj();

    this._animate();
  }
  isLoadedFrame(frame) {
    return this._pointMeshes[frame] != null;
  }
  setCalibration(meshes) {
    if (meshes == null) {
      return;
    }
    const candidateInfo = this.props.candidateInfo;
    for (let id of this.candidateIds) {
      const info = candidateInfo.filter(info => info.id == id)[0];
      if (info != null && info.calibration_info != null) {
        const mesh = meshes[id];
        const v = info.calibration_info;
        const prevPos = mesh.position.clone();
        const prevRot = mesh.rotation.clone();
        mesh.position.set(v.x, v.y, v.z);
        mesh.rotation.set(v.roll, v.pitch, v.yaw);
        if (!prevPos.equals(mesh.position) ||
            !prevRot.equals(mesh.rotation)) {
          this.redrawRequest();
        }
      }
    }
  }
  setVisibleTo(meshes, val) {
    if (meshes == null) {
      return;
    }
    if (typeof val === 'boolean') {
      for (let id of this.candidateIds) {
        meshes[id].visible = val;
      }
    } else {
      const visibles = this.props.topics;
      for (let id of this.candidateIds) {
        meshes[id].visible = visibles[id];
      }
    }
    this.redrawRequest();
  }
  setPointMesh(frame, mesh, candidateId) {
    if (this._pointMeshes[frame] == null) {
      this._pointMeshes[frame] = {};
    }

    this._pointMeshes[frame][candidateId] = mesh;
    mesh.visible = false;
    this._scene.add(mesh);
    const wipeMesh = mesh.clone();
    if (this._wipePointMeshes[frame] == null) {
      this._wipePointMeshes[frame] = {};
    }
    this._wipePointMeshes[frame][candidateId] = wipeMesh;
    this._wipeScene.add(wipeMesh);
    return wipeMesh;
  }
  pcdUnload(frame) {
    if (!this.isLoadedFrame(frame)) {
      return;
    }
    const pointMeshes = this._pointMeshes[frame];
    const wipeMeshes = this._wipePointMeshes[frame];
    for (let id of this.candidateIds) {
      const mesh = pointMeshes[id]
      const wipeMesh = wipeMeshes[id];
      this._scene.remove(mesh);
      this._wipeScene.remove(wipeMesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
      wipeMesh.material.dispose();
      wipeMesh.geometry.dispose();
    }
    this._pointMeshes[frame] = null;
    this._wipePointMeshes[frame] = null;
  }
  pcdLoadById(frame, id) {
    const url = this.props.labelTool.getURL('frame_blob', id, frame);
    return new Promise((resolve, reject) => {
      this._pcdLoader.load(url, mesh => {
        const wipeMesh = this.setPointMesh(frame, mesh, id);
        resolve({
          id, mesh, wipeMesh
        });
      }, () => { // in progress
      }, (e) => { // error
        reject(e);
      });
    });
  }
  pcdLoad(frame) {
    if (this.isLoadedFrame(frame)) {
      return Promise.resolve({
        meshes: this._pointMeshes[frame],
        wipeMeshes: this._wipePointMeshes[frame]
      });
    }

    const loaderes = [];
    for (let id of this.candidateIds) {
      loaderes.push(this.pcdLoadById(frame, id));
    }
    return Promise.all(loaderes).then((results) => {
      const meshes = {}, wipeMeshes = {};
      for (let result of results) {
        const id = result.id
        meshes[id] = result.mesh;
        wipeMeshes[id] = result.wipeMesh;
      }
      return { meshes, wipeMeshes };
    });
  }
  loadWipe(frame) {
    const curr = this._currentWipePointMesh;
    this.setVisibleTo(curr, false);
    this._currentWipePointMesh = null;
    const wipeFrame = frame - 1;
    if (wipeFrame < 0) {
      return Promise.resolve();
    }
    return this.pcdLoad(wipeFrame).then(({ wipeMeshes }) => {
      this._currentWipePointMesh = wipeMeshes;
      this.setCalibration(wipeMeshes);
      this.setVisibleTo(wipeMeshes);
    });
  }
  loadMain(frame) {
    const curr = this._currentPointMesh;
    this.setVisibleTo(curr, false);
    return this.pcdLoad(frame).then(({ meshes }) => {
      this._currentPointMesh = meshes;
      this.setCalibration(meshes);
      this.setVisibleTo(meshes);
    });
  }
  load(frame) {
    this._loaded = false;

    return Promise.all([
      this.loadWipe(frame),
      this.loadMain(frame)
    ]).finally(() => {
      if (this._currentWipePointMesh != null) {
        this._wipe.show();
      } else {
        this._wipe.hide();
      }
      this._redrawFlag = true;
      this._loaded = true;
    });
  }
  unload(frame) {
    this.pcdUnload(frame);
  }
  handles = {
    resize: size => {
      this._canvasSize = size;
      const camera = this._camera;
      if (camera instanceof THREE.OrthographicCamera) {
        const y = camera.right * size.height / size.width;
        camera.top = y;
        camera.bottom = -y;
      } else {
        camera.aspect = size.width / size.height;
      }
      camera.updateProjectionMatrix();
      this._renderer.setSize(size.width, size.height);
      const wipeScale = 0.32;
      this._wipeRenderer.setSize(size.width * wipeScale, size.height * wipeScale);

      const projectionScale = 0.32;
      for (let renderer of this._projectionRendereres) {
        renderer.setSize(
          size.width * projectionScale,
          size.height * projectionScale
        );
      }
      this._redrawFlag = true;
    },
    keydown: (e) => {
      if (e.keyCode === 16) { // shift
        this.modeChangeRequest('view');
      }
    },
    keyup: (e) => {
      if (e.keyCode === 16) { // shift
        if (this._modeStatus.mode === 'view') {
          this.modeChangeRequest('edit');
        }
      }
    }
  };
  setActive(isActive) {
    if ( isActive ) {
      this._wrapper.show();
      this._redrawFlag = true;
    } else {
      this._wrapper.hide();
    }
  }
  createWipeBBox(content, klass) {
    const box = PCDBBox.fromContentToObj(content);
    const meshFrame = new BoxFrameObject();
    meshFrame.setParam(box.pos, box.size, box.yaw);
    meshFrame.setColor(klass.getColor());
    meshFrame.addTo(this._wipeScene);
    // TODO: add class
    return {
      box: box,
      meshFrame: meshFrame,
      select(flag) {
        this.meshFrame.setStatus(flag, false);
        this.meshFrame.setBold(flag);
        this.meshFrame.setParam(this.box.pos, this.box.size, this.box.yaw);
      }
    };
  }
  createBBox(content) {
    return new PCDBBox(this, content);
  }
  disposeWipeBBox(bbox) {
    bbox.meshFrame.removeFrom(this._wipeScene);
    this.redrawRequest();
  }
  disposeBBox(bbox) {
    bbox.remove();
  }
  updateTarget(prev, next) {
    const id = this.candidateId;
    if (prev != null && prev.has(id)) {
      prev.bbox[id].updateSelected(false);
      this._redrawFlag = true;
    }
    if (next != null && next.has(id)) {
      next.bbox[id].updateSelected(true);
      this._redrawFlag = true;
    }
    this.setArrow(next && next.bbox[id]);
  }
  // button actions
  setHeight = () => {
    let bboxes;
    const tgt = this.props.controls.getTargetLabel();
    if (tgt !== null) {
      bboxes = [tgt.bbox[this.candidateId]];
    } else {
      bboxes = Array.from(this.pcdBBoxes);
    }
    const keys = Object.keys(this._currentPointMesh); // TODO: check all
    const posArray = this._currentPointMesh[keys[0]].geometry.getAttribute('position').array;
    let changedLabel = null;
    let existIncludePoint = false;
    for (let i=0; i<bboxes.length; ++i) {
      const bbox = bboxes[i];
      let maxZ = -Infinity, minZ = Infinity;
      const boxx = bbox.box.pos.x,
            boxy = bbox.box.pos.y,
            boxsx = bbox.box.size.x,
            boxsy = bbox.box.size.y,
            yaw = bbox.box.yaw;
      for (let j=0; j<posArray.length; j+=3) {
        const dx = posArray[j+0] - boxx,
              dy = posArray[j+1] - boxy;
        const x = Math.abs( dx*Math.cos(yaw) + dy*Math.sin(yaw)),
              y = Math.abs(-dx*Math.sin(yaw) + dy*Math.cos(yaw));
        if (2*x < boxsx && 2*y < boxsy) {
          existIncludePoint = true;
          const z = posArray[j+2];
          maxZ = Math.max(maxZ, z);
          minZ = Math.min(minZ, z);
        }
      }
      if (!existIncludePoint) {
        continue;
      }

      const zCenter = (maxZ + minZ) / 2,
            zHeight = maxZ - minZ;
      const changeFlag = bbox.box.size.z !== zHeight || bbox.box.pos.z !== zCenter;
      if (changeFlag) {
        changedLabel = bbox.label.createHistory(changedLabel);
        bbox.setZ(zCenter, zHeight);
        bbox.updateCube(true);
      }
    }
    if (changedLabel !== null) {
      changedLabel.addHistory();
      this.redrawRequest();
    }
  };
  // to controls
  redrawRequest() {
    this._redrawFlag = true;
  }
  getMode() {
    return this._modeStatus.mode;
  }
  changeMode() {
    let idx = modeNames.indexOf(this._modeStatus.mode); 
    if (idx < 0) { return; }
    idx = (idx + 1) % modeNames.length;
    this.modeChange(modeNames[idx]);
    return modeNames[idx];
  }
  _initThree() {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this._canvasSize.width, this._canvasSize.height);
    this._renderer = renderer;
    this._scene = scene;

    const GRID_SIZE = 100;
    const gridPlane = new THREE.GridHelper(GRID_SIZE, GRID_SIZE/5);
    gridPlane.rotation.x = Math.PI/2;
    gridPlane.position.x = 0;
    gridPlane.position.y = 0;
    gridPlane.position.z = -1;
    this._gridPlane = gridPlane;
    this._scene.add(gridPlane);

    

    const pcdLoader = new THREE.PCDLoader();
    this._pcdLoader = pcdLoader;


    // wipe
    const wipeScene = new THREE.Scene();
    const wipeRenderer = new THREE.WebGLRenderer({ antialias: true });
    wipeRenderer.setClearColor(0x000000);
    wipeRenderer.setPixelRatio(window.devicePixelRatio);
    wipeRenderer.setSize(this._canvasSize.width*0.22, this._canvasSize.height*0.22);
    this._wipeRenderer = wipeRenderer;
    this._wipeScene = wipeScene;

    // projections
    this._projectionRendereres = [0, 1, 2].map(idx => {
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(this._canvasSize.width*0.22, this._canvasSize.height*0.22);
      return renderer;
    });
  }
  _initCamera() {
    // TODO: read YAML and set camera?
    let camera;
    const NEAR = 1, FAR = 2000;
    const aspect = this._canvasSize.width / this._canvasSize.height;
    if(this._isBirdView){
      const x = 40, y = x / aspect;
      camera = new THREE.OrthographicCamera(-x, x, y, -y, NEAR, FAR);
      camera.position.set (0,0,450);
      camera.lookAt (new THREE.Vector3(0,0,0));
    }else{
      camera = new THREE.PerspectiveCamera( 90, aspect, NEAR, FAR);
      camera.position.set(0,0,0.5);
    }
    camera.rotation.order = 'ZXY';
    camera.up.set(0,0,1);
    this._scene.add( camera );

    const controls = new THREE.OrbitControls(camera, this._renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    controls.target.set( 1, 0, 0);
    controls.update();

    this._camera = camera;
    this._cameraControls = controls;

    const poses = [
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(0, 50, 0),
      new THREE.Vector3(50, 0, 0)
    ];
    this._projectionCenter = new THREE.Vector3(0, 0, 0);
    this._projectionCameras = [0,1,2].map(idx => {
      const x = 10, y = x / aspect;
      const camera = new THREE.OrthographicCamera(-x, x, y, -y, 5, FAR);
      const p = poses[idx];
      camera.position.set(p.x, p.y, p.z);
      camera.up.set(0, 0, 1);
      camera.rotation.order = 'ZXY';
      camera.lookAt(this._projectionCenter);
      this._scene.add(camera);
      return camera;
    });

    this._projectionCameraControls = [0,1,2].map(idx => {
      const projectionCamera = this._projectionCameras[idx]
      const projectionRenderer = this._projectionRendereres[idx]
      const projectionControls = new THREE.OrbitControls(projectionCamera, projectionRenderer.domElement);
      projectionControls.zoomSpeed = 0.3;
      projectionControls.panSpeed = 0.2;
      projectionControls.enableZoom = true;
      projectionControls.enablePan = true;
      projectionControls.enableRotate = false;
      projectionControls.enableDamping = false;
      projectionControls.dampingFactor = 0.3;
      projectionControls.minDistance = 0.3;
      projectionControls.maxDistance = 0.3 * 100;
      projectionControls.noKey = true;
      projectionControls.enabled = true;
      projectionControls.target.set( 1, 0, 0);
      projectionControls.update();
      return projectionControls;
    });
  }
  _initDom() {
    const wrapper = $(this._wrapperElement.current);
    this._wrapper = wrapper;
    wrapper.hide();

    const main = $(this._mainElement.current);
    main.append(this._renderer.domElement);
    this._main = main;

    const wipe = $(this._wipeElement.current);
    wipe.append(this._wipeRenderer.domElement);
    this._wipe = wipe;

    const projectionZ = $(this._projectionZElement.current);
    projectionZ.append(this._projectionRendereres[0].domElement);
    const projectionX = $(this._projectionXElement.current);
    projectionX.append(this._projectionRendereres[1].domElement);
    const projectionY = $(this._projectionYElement.current);
    projectionY.append(this._projectionRendereres[2].domElement);
    this._projections = [
      projectionZ, projectionX, projectionY
    ];
  }
  _initEvent() {
    const modeStatus = this._modeStatus;
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000, visible: false
    });
    const groundGeo = new THREE.PlaneGeometry(1e5, 1e5);
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.position.x = 0;
    groundPlane.position.y = 0;
    groundPlane.position.z = -1;
    this._groundPlane = groundPlane;
    const zPlane = new THREE.Mesh(groundGeo, groundMat);
    zPlane.rotation.x = Math.PI / 2;
    zPlane.rotation.order = 'ZXY';
    this._zPlane = zPlane;


    
    // mouse events
    const mainViewObj = {
      type: 'main',
      id: 'main',
      elem: this._main,
      camera: this._camera,
      renderer: this._renderer
    };
    this._main.contextmenu((e) => {
      e.preventDefault();
    }).mousedown((e) => {
      if (e.button !== 0) { return; } // not left click
      this.getModeMethod().mouseDown(e, mainViewObj);
    }).mouseup((e) => {
      if (e.button !== 0) { return; } // not left click
      if ( !modeStatus.busy ) { return; }
      this.getModeMethod().mouseUp(e, mainViewObj);
      this.modeBusyChange(false);
    }).mousemove((e) => {
      this.getModeMethod().mouseMove(e, mainViewObj);
    });

    for (let i=0; i<3; ++i) {
      const viewObj = {
        type: 'projection',
        projection: 'zxy'[i],
        id: ['proj-z', 'proj-x', 'proj-y'][i],
        elem: this._projections[i],
        camera: this._projectionCameras[i],
        renderer: this._projectionRendereres[i]
      };
      this._projections[i].contextmenu((e) => {
        e.preventDefault();
      }).mousedown((e) => {
        if (e.button !== 0) { return; } // not left click
        this.getModeMethod().mouseDown(e, viewObj);
      }).mouseup((e) => {
        if (e.button !== 0) { return; } // not left click
        if (!modeStatus.busy) { return; }
        this.getModeMethod().mouseUp(e, viewObj);
        this.modeBusyChange(false);
      }).mousemove((e) => {
        this.getModeMethod().mouseMove(e, viewObj);
      })
    }

    document.addEventListener('mouseup', (e) => {
      if (e.button !== 0) { return; } // not left click
      if (!modeStatus.busy) { return; }
      this.getModeMethod().mouseUp(e, null);
      this.modeBusyChange(false);
    });

    this.getModeMethod().changeTo();
  }
  _initEditObj() {
    // face edit cube
    const faceCubeGeo = new THREE.CubeGeometry(1, 1, 1);
    const faceCubeMat= new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide,
      transparent: true, opacity: 0.5
    });
    const faceCube = new THREE.Mesh(faceCubeGeo, faceCubeMat);
    faceCube.rotation.order = 'ZXY';
    faceCube.visible = false;
    this._editFaceCube  = faceCube;
    this._scene.add(faceCube);

    const sceneAxis = new THREE.AxisHelper(3);
    this._sceneAxis = sceneAxis;
    this._scene.add(sceneAxis);
  }
  _initArrow() {
    const size = 3,
          head = size / 2,
          headWidth = head / 2;
    this._editArrows = [
      new THREE.ArrowHelper(AXES[0], new THREE.Vector3(0,0,0), size, arrowColors[0], head, headWidth),
      //new THREE.ArrowHelper(AXES[1], new THREE.Vector3(0,0,0), size, arrowColors[1], head, headWidth),
      //new THREE.ArrowHelper(AXES[2], new THREE.Vector3(0,0,0), size, arrowColors[2], head, headWidth),
    ];
    const group = new THREE.Group();
    this._editArrows.forEach(arrow => { group.add(arrow); });
    group.visible = false;
    this._editArrowGroup = group;
    this._scene.add(group);
  }
  _animate() {
    const id = window.requestAnimationFrame(()=>{this._animate()});
    this.getModeMethod().animate();

    if ( this._redrawFlag ) {
      try {
        this._renderer.render(
            this._scene,
            this._camera);
        this._wipeRenderer.render(
            this._wipeScene,
            this._camera);
        const tgt = this.props.controls &&
          this.props.controls.getTargetLabel();
        const tgtBBox = tgt != null ?
          tgt.bbox[this.candidateId] : null;
        if (tgtBBox != null) {
          tgtBBox.setThin(true);
        }
        for (let i=0; i<3; ++i) {
          this._projectionRendereres[i].render(
            this._scene,
            this._projectionCameras[i]
          );
        }
        if (tgtBBox != null) {
          tgtBBox.setThin(false);
        }
      } catch(e) {
        console.error(e);
        window.cancelAnimationFrame(id);
        return;
      }
      this._redrawFlag = false;
    }
  }
  aspectToSize(minx, miny, aspect) {
    let scale = minx;
    const scaledMiny = miny * 1.3;
    if (scale < scaledMiny * aspect) {
      scale = scaledMiny * aspect;
    }
    return [scale, scale / aspect];
  }
  setProjectionCamera(pos, dir, size) {
    if (this._modeStatus.busy) {
      this._modeStatus.nextFunc = () => {
        this.setProjectionCamera(pos, dir, size);
        this._redrawFlag = true;
      };
      return;
    }
    this._projectionCenter = pos.clone();
    const cameraDis = 5;
    const lenx = size ? size.x * 1.2 / 2 + cameraDis : 50;
    const leny = size ? size.y * 1.2 / 2 + cameraDis : 50;
    const poses = [
      [0, 0, 50],
      [lenx * Math.cos(dir), lenx * Math.sin(dir), 0],
      [leny * Math.sin(dir), -leny * Math.cos(dir), 0],
    ];
    const canvasSize = this._canvasSize;
    const aspect = canvasSize.width / canvasSize.height;
    const sizes = size && [
      this.aspectToSize(size.x, size.y, aspect),
      this.aspectToSize(size.y, size.z, aspect),
      this.aspectToSize(size.x, size.z, aspect)
    ];
    const far = size && [
      2000, size.x * 1.2, size.y * 1.2
    ];
    this._projectionCameras[0].up.set(
      -Math.sin(dir), Math.cos(dir), 0
    );
    this._projectionCameras[1].up.set(0, 0, 1);
    this._projectionCameras[2].up.set(0, 0, 1);
    for (let i=0; i<3; ++i) {
      const p = poses[i];
      const camera = this._projectionCameras[i];
      camera.position.set(
        pos.x + p[0], pos.y + p[1], pos.z + p[2]
      );
      camera.lookAt(pos);
      if (sizes) {
        const s = sizes[i];
        camera.left = -s[0];
        camera.right = s[0];
        camera.top = s[1];
        camera.bottom = -s[1];
        camera.far = far[i] + cameraDis;
        camera.updateProjectionMatrix();
      }
    }
  }
  setArrow(bbox, direction) {
    if (bbox == null) {
      this._editArrowGroup.visible = false;
    } else {
      let pos = bbox, dir = direction;
      let size = null;
      if (bbox instanceof PCDBBox) {
        pos = bbox.box.pos;
        dir = bbox.box.yaw;
        size = bbox.box.size;
      }
      this._editArrowGroup.visible = true;
      this._editArrowGroup.position.set(pos.x, pos.y, pos.z);
      this._editArrowGroup.rotation.z = dir;
      this.setProjectionCamera(pos, dir, size);
      const state = {pos, size, dir};
      this.props.dispatchSetTargetState(state);
    }
  }
  setMouseType(name) {
    this._main.css('cursor', name);
    for (let p of this._projections) {
      p.css('cursor', name);
    }
  }
  resetMouseType() {
    this._main.css('cursor', 'crosshair');
    for (let p of this._projections) {
      p.css('cursor', 'crosshair');
    }
  }
  

  // mode methods
  getModeMethod(){
    return this._modeMethods[this._modeStatus.mode];
  }
  modeChangeRequest(nextMode) {
    if ( this._modeStatus.busy ) {
      this._modeStatus.nextMode = nextMode;
    } else {
      this.modeChange(nextMode);
    }
  }
  modeBusyChange(val) {
    const modeStatus = this._modeStatus;
    const prev = modeStatus.busy;
    modeStatus.busy = val;
    if (prev && !val) {
      if (modeStatus.nextFunc != null) {
        modeStatus.nextFunc();
        modeStatus.nextFunc = null;
      }
      if (modeStatus.nextMode != null) {
        setTimeout(() => {
          this.modeChange(modeStatus.nextMode);
          modeStatus.nextMode = null;
        }, 0);
      }
    }
  }
  modeChange(nextMode) {
    const mode = this._modeStatus.mode;
    if (mode === nextMode) { return; }
    const nextMethod = this._modeMethods[nextMode];
    if (nextMethod == null) {
      // TODO: show internal error
      throw 'Mode error';
    }
    this._modeMethods[mode].changeFrom();
    nextMethod.changeTo();
    this._modeStatus.mode = nextMode;
    // TODO: maybe change
    //Controls.GUI.update();
  }

  // 3d geo methods
  getMousePos(e, v) {
    const offset = v.elem.offset();
    const size = v.renderer.getSize();
    return new THREE.Vector2(
       (e.clientX - offset.left) / size.width * 2 - 1,
      -(e.clientY - offset.top) / size.height * 2 + 1
    );
  }
  getRay(e, v) {
    const pos = this.getMousePos(e, v);
    const camera = v.camera;
    let ray;
    if ( this._isBirdView ) {
      ray = new THREE.Raycaster();
      ray.setFromCamera(pos, camera);
    } else {
      const vec = new THREE.Vector3(pos.x, pos.y, 1);
      vec.unproject(camera);
      ray = new THREE.Raycaster(camera.position, vec.sub(camera.position).normalize());
    }
    return ray;
  }
  getIntersectPos(e, v) {
    if (v == null) {
      return null;
    }
    const ray = this.getRay(e, v);
    const intersectPos = ray.intersectObject(this._groundPlane);
    if (intersectPos.length > 0) {
      return intersectPos[0].point;
    }
    return null;
  }
  getZPos(e, v, p) {
    const ray = this.getRay(e, v);
    const zPlane = this._zPlane;
    const pos = v.type === 'projection' ?
      this._projectionCenter : p;
    zPlane.rotation.z = v.camera.rotation.z;
    zPlane.position.x = pos.x;
    zPlane.position.y = pos.y;
    zPlane.position.z = 0;
    zPlane.updateMatrixWorld();
    const intersectPos = ray.intersectObject(zPlane);
    if (intersectPos.length > 0) {
      return intersectPos[0].point;
    }
    return null;
  }

  creatingBoxUpdate() {
    const data = this._creatingBBox;
    const sp = data.startPos,
          ep = data.endPos;
    const cx = (sp.x + ep.x) / 2,
          cy = (sp.y + ep.y) / 2,
          dx = sp.x - ep.x,
          dy = sp.y - ep.y;
    let phi = this._camera.rotation.z;
    const rx = Math.cos(phi),
          ry = Math.sin(phi);
    let w = dx*rx + dy*ry,
        h = dx*ry - dy*rx;
    if (Math.abs(w) > Math.abs(h)) {
      h = Math.abs(h);
      if (w < 0) {
        phi = (phi + Math.PI) % (Math.PI * 2);
        w = -w;
      }
    } else {
      w = Math.abs(w);
      if (h < 0) {
        phi = (phi + Math.PI / 2) % (Math.PI * 2);
        h = -h;
      } else {
        phi = (phi + Math.PI * 3 / 2) % (Math.PI * 2);
      }
      [w, h] = [h, w];
    }
    const pos = new THREE.Vector3(cx, cy, -0.5),
          size = new THREE.Vector3(w, h, 1.0);
    data.box.setParam(pos, size, phi);
    this.setArrow(pos, phi);
  }

};


const modeNames = [
    'edit', 'view'
  ];
// TODO: move select methods to one place
function createModeMethods(pcdTool) {
  const modeMethods = {
    'edit': {
      prevHover: null,
      mode: null,
      startParam: null,
      animate: function() {
      },
      mouseDown: function(e, v) {
        let pos = pcdTool.getIntersectPos(e, v);
        if (this.prevHover !== null && (this.prevHover.type === 'top' ||
            v.id === 'proj-x' || v.id === 'proj-y')) {
          pos = pcdTool.getZPos(e, v, this.prevHover.bbox.box.pos);
        }

        if (pos != null && this.prevHover !== null) {
          this.mode = 'move';
          const startParam = {
            size: this.prevHover.bbox.box.size.clone(),
            pos: this.prevHover.bbox.box.pos.clone(),
            yaw: this.prevHover.bbox.box.yaw,
            mouse: pos.clone()
          };
          if (this.prevHover.type === 'edge') {
            pcdTool.setMouseType('grabbing');
            const p = startParam.pos,
                  s = startParam.size;
            const sign = new THREE.Vector2(
              ...[
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1]
              ][this.prevHover.idx]
            );
            const diag = new THREE.Vector2(s.x, s.y)
              .multiply(sign)
              .rotateAround(ZERO2, startParam.yaw);
            startParam.fix = new THREE.Vector2(
              p.x - diag.x / 2,
              p.y - diag.y / 2
            );
            startParam.diag = diag;
            startParam.diagYaw = Math.atan2(diag.y, diag.x);
          }
          this.startParam = startParam;
          pcdTool.modeBusyChange(true);
          pcdTool.props.controls.selectLabel(this.prevHover.bbox.label);
          this.prevHover.bbox.label.createHistory();
          return;
        }

        if (pos != null && v.type == 'main') {
          pcdTool._creatingBBox.startPos = pos;
          pcdTool.modeBusyChange(true);
          this.mode = 'create';
          pcdTool.props.controls.selectLabel(null);
          return;
        }
        this.mode = null;
      },
      resetHoverObj: function() {
        pcdTool._editFaceCube.visible = false;
      },
      setHoverObjZ: function(bbox, normal) {
        const cube = pcdTool._editFaceCube;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        const w = EDIT_OBJ_SIZE;
        cube.rotation.set(0, 0, yaw);
        const p = bbox.box.pos;
        cube.position.set(
          p.x,
          p.y,
          p.z + normal.z * (bbox.box.size.z + w) / 2
        );
        cube.scale.set(size.x, size.y, w);
        cube.visible = true;
        pcdTool.redrawRequest();
      },
      setHoverObj: function(bbox, normal) {
        const cube = pcdTool._editFaceCube;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        // set rotation
        cube.rotation.set(
          0, //normal.y*Math.PI/2,
          0, //normal.x*Math.PI/2,
          yaw
        );
        const w = EDIT_OBJ_SIZE;
        const cubeOffset = new THREE.Vector3(
          normal.x * w / 2,
          normal.y * w / 2,
          0
        );
        const cubeSize = new THREE.Vector3(
          normal.x ? w : size.x,
          normal.y ? w : size.y,
          size.z
        );
        // set pos
        const p = bbox.box.pos.clone()
                .add(
                    bbox.box.size.clone()
                        .multiply(normal)
                        .divideScalar(2)
                        .add(cubeOffset)
                        .applyAxisAngle(AXES[2], yaw)
                );
        cube.position.set(p.x, p.y, p.z);
        // set pos
        /*
        const nn = normal.clone().multiply(normal);
        const width = (new THREE.Vector3(size.z, size.x, size.x))
                      .dot(nn),
              height= (new THREE.Vector3(size.y, size.z, size.y))
                      .dot(nn);
        plane.scale.set(width, height, 1);
        */
        cube.scale.set(
          cubeSize.x,
          cubeSize.y,
          cubeSize.z
        );
        // set status
        cube.visible = true;
        pcdTool.redrawRequest();
      },
      resetHover: function() {
        this.resetHoverObj();
        if (this.prevHover == null) {
          return;
        }
        const bbox = this.prevHover.bbox;
        bbox.hover(false);
        pcdTool.redrawRequest();
        this.prevHover = null;
      },
      EDGE_NORMALS: [
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0),
      ],
      mouseMoveEdgeIntersectCheck: function(bboxes, ray, v) {
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j=0; j<4; ++j) {
            const edge = bbox.cube.edges[j];
            const intersectPos = ray.intersectObject(edge);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                  this.prevHover.type === 'edge' &&
                  this.prevHover.bbox === bbox &&
                  this.prevHover.idx === j) { return true; }
              this.resetHover();
              pcdTool.setMouseType('grab');
              const normal = this.EDGE_NORMALS[j];
              this.setHoverObj(bbox, normal);
              this.prevHover = {
                type: 'edge',
                viewObj: v,
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      CORNER_NORMALS: [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, -1, 0),
      ],
      TOP_NORMALS: [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ],
      mouseMoveCornerIntersectCheck: function(bboxes, ray, v) {
        let directions = [0, 1, 2, 3];
        if (v.type === 'projection') {
          if (v.projection === 'x') {
            directions = [1, 3];
          } else if (v.projection === 'y') {
            directions = [0, 2];
          }
        }
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j of directions) {
            const corner = bbox.cube.corners[j];
            const intersectPos = ray.intersectObject(corner);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                  this.prevHover.type === 'corner' &&
                  this.prevHover.bbox === bbox &&
                  this.prevHover.idx === j) { return true; }
              this.resetHover();
              pcdTool.setMouseType('ew-resize');
              const normal = this.CORNER_NORMALS[j];
              this.setHoverObj(bbox, normal);
              this.prevHover = {
                type: 'corner',
                viewObj: v,
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      mouseMoveTopIntersectCheck: function(bboxes, ray, v) {
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j=0; j<2; ++j) {
            const corner = bbox.cube.zFace[j];
            const intersectPos = ray.intersectObject(corner);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                  this.prevHover.type === 'top' &&
                  this.prevHover.bbox === bbox &&
                  this.prevHover.idx === j) { return true; }
              this.resetHover();
              pcdTool.setMouseType('ns-resize');
              const normal = this.TOP_NORMALS[j];
              this.setHoverObjZ(bbox, normal);
              this.prevHover = {
                type: 'top',
                viewObj: v,
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      mouseMoveIntersectCheck: function(bboxes, ray, v) {
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          const intersectPos = ray.intersectObject(bbox.cube.mesh);
          if (intersectPos.length > 0) {
            if (this.prevHover &&
                this.prevHover.type === 'box' &&
                this.prevHover.bbox === bbox) { return true; }
            this.resetHover();
            bbox.hover(true);
            pcdTool.setMouseType('all-scroll');
            this.prevHover = {
              type: 'box',
              viewObj: v,
              bbox: bbox
            };
            pcdTool.redrawRequest();
            return true;
          }
        }
        return false;
      },
      // resize and rotate
      mouseMoveRotateResize: function(bbox, prev, dx, dy) {
        const dp = new THREE.Vector2(dx, dy).add(prev.diag);
        const yaw = Math.atan2(dp.y, dp.x) - prev.diagYaw + prev.yaw;
        let size = dp.clone().rotateAround(ZERO2, -yaw);
        size.x = Math.abs(size.x);
        size.y = Math.abs(size.y);
        size = bbox.setSize2(size.x, size.y);
        const dpLen = dp.length();
        const pos = dp.multiplyScalar(size.length())
          .divideScalar(dpLen * 2).add(prev.fix);
        bbox.box.pos.set(pos.x, pos.y, bbox.box.pos.z);
        bbox.box.yaw = yaw;
      },
      // resize one side size
      mouseMoveResizeXP: function(bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x+dx, prevSize.y)
            .divideScalar(2);
        bbox.box.pos.add(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeXN: function(bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x-dx, prevSize.y)
            .divideScalar(2);
        bbox.box.pos.sub(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeYP: function(bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x, prevSize.y+dy)
            .divideScalar(2);
        bbox.box.pos.add(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeYN: function(bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x, prevSize.y-dy)
            .divideScalar(2);
        bbox.box.pos.sub(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      // resize z size
      mouseMoveResizeZP: function(bbox, prev, dz) {
        const prevSize = prev.size;
        const dsize = bbox.setSizeZ(prevSize.z + dz) / 2;
        bbox.box.pos.add(new THREE.Vector3(0, 0, dsize));
      },
      mouseMoveResizeZN: function(bbox, prev, dz) {
        const prevSize = prev.size;
        const dsize = bbox.setSizeZ(prevSize.z - dz) / 2;
        bbox.box.pos.sub(new THREE.Vector3(0, 0, dsize));
      },
      mouseMove: function(e, v) {
        if (this.mode === 'move') {
          if (this.prevHover != null &&
              this.prevHover.viewObj.id !== v.id) {
            return;
          }
          const bbox = this.prevHover.bbox;
          const prev = this.startParam;

          const pos = (this.prevHover.type === 'top' ||
              v.id === 'proj-x' || v.id === 'proj-y') ?
              pcdTool.getZPos(e, v, prev.pos) :
              pcdTool.getIntersectPos(e, v);
          if (pos == null) {
            return;
          }
          const dx = pos.x - prev.mouse.x;
          const dy = pos.y - prev.mouse.y;
          const dz = pos.z - prev.mouse.z;

          if (this.prevHover.type === 'box') {
            if (v.id === 'proj-x' || v.id === 'proj-y') {
              bbox.box.pos.set(prev.pos.x+dx, prev.pos.y+dy, prev.pos.z+dz);
            } else {
              bbox.box.pos.set(prev.pos.x+dx, prev.pos.y+dy, prev.pos.z);
            }
          } else if (this.prevHover.type === 'edge') {
            this.mouseMoveRotateResize(bbox, prev, dx, dy);

            const idx = this.prevHover.idx;
            const normal = this.EDGE_NORMALS[idx];
            this.setHoverObj(bbox, normal);
          } else if (this.prevHover.type === 'corner') {
            const yaw = bbox.box.yaw;
            let dp = new THREE.Vector2(dx, dy);
            dp = dp.rotateAround(ZERO2, -yaw);
            const idx = this.prevHover.idx;
            [
              this.mouseMoveResizeXP,
              this.mouseMoveResizeYP,
              this.mouseMoveResizeXN,
              this.mouseMoveResizeYN
            ][idx](bbox, prev, dp.x, dp.y);

            const normal = this.CORNER_NORMALS[idx];
            this.setHoverObj(bbox, normal);
          } else if (this.prevHover.type === 'top') {
            const idx = this.prevHover.idx;
            [
              this.mouseMoveResizeZP,
              this.mouseMoveResizeZN
            ][idx](bbox, prev, dz);

            const normal = this.TOP_NORMALS[idx];
            this.setHoverObjZ(bbox, normal);
          }
          bbox.updateCube(true);
          pcdTool.redrawRequest();
          return;
        }

        if (pcdTool._creatingBBox.startPos != null) {
          if (this.prevHover != null &&
              this.prevHover.viewObj.id !== v.id) {
            return;
          }
          this.resetHover();
          const pos = pcdTool.getIntersectPos(e, v);
          if (pos == null) {
            return;
          }
          const bbox = pcdTool._creatingBBox;
          bbox.endPos = pos;
          const dist = bbox.endPos.distanceTo(bbox.startPos);
          if (bbox.box == null && dist > 0.01) {
            bbox.box = new BoxFrameObject();
            bbox.box.addTo(pcdTool._scene);
            bbox.box.setColor('#fff');
          }
          if (bbox.box != null) {
            pcdTool.creatingBoxUpdate();
            pcdTool.redrawRequest();
          }
          return;
        }

        const ray = pcdTool.getRay(e, v);
        const pcdBBoxes = Array.from(pcdTool.pcdBBoxes)
        let target = pcdBBoxes.filter(bbox => bbox.selected);
        if (target.length === 0) {
          target = pcdBBoxes;
        }
        if (this.mouseMoveIntersectCheck(target, ray, v)) {
          return;
        }
        if (this.mouseMoveCornerIntersectCheck(target, ray, v)) {
          return;
        }
        if (v.camera.rotation.x < Math.PI / 180 * 45) {
          if (this.mouseMoveEdgeIntersectCheck(target, ray, v)) {
            return;
          }
        } else {
          if (this.mouseMoveTopIntersectCheck(target, ray, v)) {
            return;
          }
        }
        this.resetHover();
        pcdTool.resetMouseType();
      },
      mouseUp: function(e, v) {
        const mode = this.mode;
        this.mode = null;

        if (mode === 'move') {
          const box = this.prevHover.bbox.box;
          if (!this.startParam.size.equals(box.size) ||
              !this.startParam.pos.equals(box.pos) ||
              this.startParam.yaw !== box.yaw) {
            this.prevHover.bbox.label.addHistory();
          }
        }
        if (mode === 'create') {
          const bbox = pcdTool._creatingBBox;
          if (bbox.box == null) {
            if (bbox.startPos != null) {
              bbox.startPos = null;
              bbox.endPos = null;
            }
            return;
          }
          const pos = pcdTool.getIntersectPos(e, v);
          if (pos != null) {
            bbox.endPos = pos;
          }
          pcdTool.creatingBoxUpdate();
          const boxPos = bbox.box.getPos();
          const boxSize = bbox.box.getSize();
          const boxYaw = bbox.box.getYaw();
          const pcdBBox = new PCDBBox(pcdTool, {
                [PCDBBox.NAME.POS_X]: boxPos.x,
                [PCDBBox.NAME.POS_Y]: boxPos.y,
                [PCDBBox.NAME.POS_Z]: -0.5,
                [PCDBBox.NAME.SIZE_X]: boxSize.x,
                [PCDBBox.NAME.SIZE_Y]: boxSize.y,
                [PCDBBox.NAME.SIZE_Z]: boxSize.z,
                [PCDBBox.NAME.YAW]: boxYaw,
              });
          // TODO: add branch use selecting label 
          const label = pcdTool.props.controls.createLabel(
            pcdTool.props.controls.getTargetKlass(),
            {[pcdTool.candidateId]: pcdBBox}
          );
          bbox.box.removeFrom(pcdTool._scene);
          pcdTool.redrawRequest();
          bbox.startPos = null;
          bbox.endPos = null;
          bbox.box = null;
        }
      },
      changeFrom: function() {
      },
      changeTo: function() {
        //pcdTool._main.css('cursor', 'crosshair');
      },
    },
    'view': {
      animate: function() {
        pcdTool.redrawRequest();
        pcdTool._cameraControls.update();
	for (let i=0; i<3; ++i) { pcdTool._projectionCameraControls[i].update() }
      },
      mouseDown: function(e, v) {
        pcdTool.modeBusyChange(true);
      },
      mouseMove: function(e, v) {
      },
      mouseUp: function(e, v) {
      },
      changeFrom: function() {
        pcdTool._cameraControls.enabled = false;
        for (let i=0; i<3; ++i) { pcdTool._projectionCameraControls[i].enabled = false; }
      },
      changeTo: function() {
        pcdTool._cameraControls.enabled = true;
        for (let i=0; i<3; ++i) { pcdTool._projectionCameraControls[i].enabled = true; }
        //pcdTool._main.css('cursor', 'all-scroll');
      },
    },
  };
  return modeMethods;
}

const mapStateToProps = state => ({
  controls: state.tool.controls,
  topics: state.pcdTool.topics,
  labelTool: state.tool.labelTool,
  candidateInfo: state.annotation.candidateInfo
});
const mapDispatchToProps = dispatch => ({
  dispatchSetTopic: (topic, val) => dispatch(setTopic(topic, val)),
  dispatchSetTargetState: (state) => dispatch(setTargetState(state)),
  dispatchAddTool: (idx, target) => dispatch(addTool(idx, target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(PCDLabelTool);


