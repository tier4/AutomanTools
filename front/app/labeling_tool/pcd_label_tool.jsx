
import React from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';


// 3d eidt arrow
const arrowColors = [0xff0000, 0x00ff00, 0x0000ff],
      hoverColors = [0xffaaaa, 0xaaffaa, 0xaaaaff],
      AXES = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];

const ZERO2 = new THREE.Vector2(0, 0);
const EDIT_OBJ_SIZE = 0.5;

export default class PCDLabelTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this._labelTool = props.labelTool;
    this._controls = props.controls;
    this._element = React.createRef();
    this._toolButtons = (
      <Button
        key={0}
        onClick={this.setHeight}
        disabled
      >
        Set Height
      </Button>
    );
  }
  componentDidMount() {
    this.init();
  }
  getButtons() {
    return this._toolButtons;
  }
  render() {
    return (
      <div ref={this._element} />
    );
  }

  // private
  _canvasSize = { width: 2, height: 1 };
  _labelTool = null;
  _wrapper = null;
  _loaded = true;
  _scene = null;
  _renderer = null;
  _camera = null;
  _cameraControls = null;
  //cameraExMat = new THREE.Matrix4();
  // PCD objects
  _pcdLoader = null;
  _pointMeshes = [];
  // to mouse position
  _groundPlane = null;
  // control mode
  _modeMethods = createModeMethods(this);
  _modeStatus = {
    mode: 'edit',
    busy: false,
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
  pcdBBoxes = new Set();

  isLoaded() {
    return this._loaded;
  }
  isTargetCandidate(id) {
    return this.candidateId == id;
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
  load(frame) {
    this._loaded = false;
    const url = this._labelTool.getURL('frame_blob', this.candidateId, frame);
    this._pointMeshes.forEach(mesh => { mesh.visible = false; });
    // use preloaded pcd mesh
    if (this._pointMeshes[frame] != null) {
      this._pointMeshes[frame].visible =true;
      this._redrawFlag = true;
      this._loaded = true;
      return Promise.resolve();
    }
    // load new pcd file
    return new Promise((resolve, reject) => {
      this._pcdLoader.load(url, (mesh) => {
        this._pointMeshes[frame] = mesh;
        this._scene.add(mesh);
        this._redrawFlag = true;
        this._loaded = true;
        resolve();
      }, () => { // in progress
      }, (e) => { // error
        this._loaded = true;
        reject(e);
      });
    });
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
  createBBox(content) {
    return new PCDBBox(this, content);
  }
  disposeBBox(bbox) {
    bbox.remove();
  }
  updateBBox(label) {
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
    /*
    const axisHelper = new THREE.AxisHelper(0.1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);
    */

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
    camera.up.set(0,0,1);
    window.camera = camera;
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
  }
  _initDom() {
    //const wrapper = $('#canvas3d'); // change dom id
    const wrapper = $(this._element.current);
    wrapper.append(this._renderer.domElement);
    this._wrapper = wrapper;
    wrapper.hide();
  }
  _initEvent() {
    const modeStatus = this._modeStatus;
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000, wireframe: false,
      transparent: true, opacity: 0.0
    });
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.position.x = 0;
    groundPlane.position.y = 0;
    groundPlane.position.z = -1;
    this._groundPlane = groundPlane;


    
    // mouse events
    this._wrapper.contextmenu((e) => {
      e.preventDefault();
    }).mousedown((e) => {
      if (e.button !== 0) { return; } // not left click
      this.getModeMethod().mouseDown(e);
    }).mouseup((e) => {
      if (e.button !== 0) { return; } // not left click
      if ( !modeStatus.busy ) { return; }
      this.getModeMethod().mouseUp(e);
      modeStatus.busy = false;
      if (modeStatus.nextMode != null) {
        setTimeout(() => {
          this.modeChange(modeStatus.nextMode);
          modeStatus.nextMode = null;
        }, 0);
      }
    }).mousemove((e) => {
      this.getModeMethod().mouseMove(e);
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
      } catch(e) {
        console.error(e);
        window.cancelAnimationFrame(id);
        return;
      }
      this._redrawFlag = false;
    }
  }
  setArrow(bbox) {
    if (bbox == null) {
      this._editArrowGroup.visible = false;
    } else {
      const pos = bbox.box.pos;
      this._editArrowGroup.visible = true;
      this._editArrowGroup.position.set(pos.x, pos.y, pos.z);
      this._editArrowGroup.rotation.z = bbox.box.yaw;
    }
  }
  setMouseType(name) {
    this._wrapper.css('cursor', name);
  }
  resetMouseType() {
    this._wrapper.css('cursor', 'crosshair');
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
  getMousePos(e) {
    const offset = this._wrapper.offset();
    const size = this._renderer.getSize();
    return new THREE.Vector2(
       (e.clientX - offset.left) / size.width * 2 - 1,
      -(e.clientY - offset.top) / size.height * 2 + 1
    );
  }
  getRay(e) {
    const pos = this.getMousePos(e);
    const camera = this._camera;
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
  getIntersectPos(e) {
    const ray = this.getRay(e);
    const intersectPos = ray.intersectObject(this._groundPlane);
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
          w = sp.x - ep.x,
          h = sp.y - ep.y;
    const phi = this._camera.rotation.z,
          rx = Math.cos(phi),
          ry = Math.sin(phi);
    data.box.position.set(cx, cy, -0.5);
    data.box.rotation.z = phi;
    data.box.scale.set(
        Math.abs(w*rx + h*ry),
        Math.abs(w*ry - h*rx),
        1.0);
  }

};

const BBoxParams = {
  geometry: new THREE.CubeGeometry(1.0, 1.0, 1.0),
  material: new THREE.MeshBasicMaterial({
    color: 0x008866,
    wireframe: true
  }),
  selectingMaterial: new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  }),
  hoverMaterial: new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true
  })

};
class PCDBBox {
  constructor(pcdTool, content) {
    this.pcdTool = pcdTool;
    this.label = null;
    this.selected = false;
    this.box = {
      pos: new THREE.Vector3(0,0,0),
      size: new THREE.Vector3(0,0,0),
      yaw: 0
    };
    if (content != null) {
      // init parameters
      this.fromContent(content);
    }
    this.initCube();
    this.pcdTool.pcdBBoxes.add(this);
    this.pcdTool.redrawRequest();
  }
  setSize2(x, y) {
    const res = this.setSize(x, y, this.box.size.z);
    return new THREE.Vector2(res.x, res.y);
  }
  setSize2d(x, y) {
    const prev = this.box.size.clone();
    const res = this.setSize(x, y, this.box.size.z);
    const ret = new THREE.Vector2(res.x-prev.x, res.y-prev.y)
      .rotateAround(ZERO2, this.box.yaw);
    return ret;
  }
  setSize(x, y, z) {
    const minSize = new THREE.Vector3(0.1, 0.1, 0.1);
    this.box.size.set(x, y, z).max(minSize);
    return this.box.size.clone();
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw "Label already set";
    }
    this.label = label;
  }
  updateSelected(selected) {
    this.selected = selected;
    if (selected) {
      this.cube.mesh.material = BBoxParams.selectingMaterial;
    } else {
      this.cube.mesh.material = BBoxParams.material;
    }
  }
  updateKlass() {
  }
  updateParam() {
    this.updateCube(true);
    this.pcdTool.redrawRequest();
  }
  remove() {
    // TODO: remove meshes
    //this.labelItem.remove();
    const mesh = this.cube.mesh;
    this.pcdTool._scene.remove(mesh);
    const group = this.cube.editGroup;
    this.pcdTool._scene.remove(group);
    this.pcdTool.redrawRequest();
    this.pcdTool.pcdBBoxes.delete(this);
  }
  toContent(obj) {
    // make object values by parameters
    obj['x_3d'] = this.box.pos.x;
    obj['y_3d'] = this.box.pos.y;
    obj['z_3d'] = this.box.pos.z;
    obj['width_3d'] = this.box.size.x;
    obj['height_3d'] = this.box.size.y;
    obj['length_3d'] = this.box.size.z;
    obj['rotation_y'] = this.box.yaw;
  }
  fromContent(content) {
    this.box.pos.x  = +content['x_3d'];
    this.box.pos.y  = +content['y_3d'];
    this.box.pos.z  = +content['z_3d'];
    this.box.size.x = +content['width_3d'];
    this.box.size.y = +content['height_3d'];
    this.box.size.z = +content['length_3d'];
    this.box.yaw    = +content['rotation_y'];
  }
  initCube() {
    const mesh = new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material);
    const box = this.box;
    this.pcdTool._scene.add(mesh);
    
    const group = new THREE.Group();
    const corners = [
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
    ];
    corners.forEach(m => group.add(m));
    const edges = [
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
    ];
    edges.forEach(m => group.add(m));
    group.visible = false;
    this.pcdTool._scene.add(group);

    this.cube = {
      mesh: mesh,
      corners: corners,
      edges: edges,
      editGroup: group
    };
    this.updateCube(false);
  }
  updateCube(changed) {
    const mesh = this.cube.mesh;
    const box = this.box;
    // TODO: check change flag
    // TODO: clamp() all
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    const group = this.cube.editGroup;
    group.position.set(box.pos.x, box.pos.y, box.pos.z);
    group.rotation.z = box.yaw;
    const w = EDIT_OBJ_SIZE;
    const corners = this.cube.corners;
    corners[0].position.set(box.size.x/2+w/2, 0, 0);
    corners[0].scale.set(w, box.size.y, box.size.z+w);
    corners[1].position.set(0, box.size.y/2+w/2, 0);
    corners[1].scale.set(box.size.x, w, box.size.z+w);
    corners[2].position.set(-box.size.x/2-w/2, 0, 0);
    corners[2].scale.set(w, box.size.y, box.size.z+w);
    corners[3].position.set(0, -box.size.y/2-w/2, 0);
    corners[3].scale.set(box.size.x, w, box.size.z+w);
    const edges = this.cube.edges;
    edges[0].position.set(box.size.x/2+w/2, box.size.y/2+w/2, 0);
    edges[0].scale.set(w, w, box.size.z+w);
    edges[1].position.set(-box.size.x/2-w/2, box.size.y/2+w/2, 0);
    edges[1].scale.set(w, w, box.size.z+w);
    edges[2].position.set(box.size.x/2+w/2, -box.size.y/2-w/2, 0);
    edges[2].scale.set(w, w, box.size.z+w);
    edges[3].position.set(-box.size.x/2-w/2, -box.size.y/2-w/2, 0);
    edges[3].scale.set(w, w, box.size.z+w);
    if ( changed ) {
      this.label.isChanged = true;
    }
    if (this.selected) {
      this.pcdTool.setArrow(this);
    }
  }
}



const modeNames = [
    'edit', 'view'
  ];
// TODO: move select methods to one place
function createModeMethods(pcdTool) {
  const modeMethods = {
    'edit': {
      prevPos: null,
      prevHover: null,
      mode: null,
      startParam: null,
      animate: function() {
      },
      mouseDown: function(e) {
        const pos = pcdTool.getIntersectPos(e);

        if (pos != null && this.prevHover !== null) {
          this.prevPos = pos;
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
          pcdTool._modeStatus.busy = true;
          pcdTool._controls.selectLabel(this.prevHover.bbox.label);
          this.prevHover.bbox.label.createHistory();
          return;
        }

        if (pos != null) {
          pcdTool._creatingBBox.startPos = pos;
          pcdTool._modeStatus.busy = true;
          this.mode = 'create';
          pcdTool._controls.selectLabel(null);
          return;
        }
        this.mode = null;
      },
      resetHoverObj: function() {
        pcdTool._editFaceCube.visible = false;
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
        if ( bbox.selected ) {
          bbox.cube.mesh.material = BBoxParams.selectingMaterial;
        } else {
          bbox.cube.mesh.material = BBoxParams.material;
        }
        pcdTool.redrawRequest();
        this.prevHover = null;
      },
      EDGE_NORMALS: [
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0),
      ],
      mouseMoveEdgeIntersectCheck: function(ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
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
      mouseMoveCornerIntersectCheck: function(ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j=0; j<4; ++j) {
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
      mouseMoveIntersectCheck: function(ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for(let i=0; i<bboxes.length; ++i) {
          const bbox = bboxes[i];
          const intersectPos = ray.intersectObject(bbox.cube.mesh);
          if (intersectPos.length > 0) {
            if (this.prevHover &&
                this.prevHover.type === 'box' &&
                this.prevHover.bbox === bbox) { return true; }
            this.resetHover();
            bbox.cube.mesh.material = BBoxParams.hoverMaterial;
            pcdTool.setMouseType('all-scroll');
            this.prevHover = {
              type: 'box',
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
      mouseMove: function(e) {
        if (this.mode === 'move') {
          const bbox = this.prevHover.bbox;
          const pos = pcdTool.getIntersectPos(e);
          if (pos == null) {
            return;
          }
          const prevPos = this.prevPos;
          const prev = this.startParam;
          const dx = (pos.x - prev.mouse.x);
          const dy = (pos.y - prev.mouse.y);
          if (this.prevHover.type === 'box') {
            bbox.box.pos.set(prev.pos.x+dx, prev.pos.y+dy, prev.pos.z);
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
          }
          bbox.updateCube(true);
          pcdTool.redrawRequest();
          this.prevPos = pos;
          return;
        }

        const ray = pcdTool.getRay(e);
        if (this.mouseMoveIntersectCheck(ray)) {
          return;
        }
        if (this.mouseMoveCornerIntersectCheck(ray)) {
          return;
        }
        if (this.mouseMoveEdgeIntersectCheck(ray)) {
          return;
        }
        this.resetHover();
        pcdTool.resetMouseType();

        if (pcdTool._creatingBBox.startPos == null) {
          return;
        }
        const pos = pcdTool.getIntersectPos(e);
        if (pos != null) {
          const bbox = pcdTool._creatingBBox;
          bbox.endPos = pos;
          const dist = bbox.endPos.distanceTo(bbox.startPos);
          if (bbox.box == null && dist > 0.01) {
            bbox.box =  new THREE.Mesh(
              BBoxParams.geometry, BBoxParams.material);
            pcdTool._scene.add(bbox.box);
          }
          if (bbox.box != null) {
            pcdTool.creatingBoxUpdate();
            pcdTool.redrawRequest();
          }
        }
      },
      mouseUp: function(e) {
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
          const pos = pcdTool.getIntersectPos(e);
          if (pos != null) {
            bbox.endPos = pos;
          }
          pcdTool.creatingBoxUpdate();
          const pcdBBox = new PCDBBox(pcdTool, {
                'x_3d': bbox.box.position.x,
                'y_3d': bbox.box.position.y,
                'z_3d': -0.5,
                'width_3d': bbox.box.scale.x,
                'height_3d': bbox.box.scale.y,
                'length_3d': bbox.box.scale.z,
                'rotation_y': bbox.box.rotation.z,
              });
          // TODO: add branch use selecting label 
          const label = pcdTool._controls.createLabel(
            pcdTool._controls.getTargetKlass(),
            {[pcdTool.candidateId]: pcdBBox}
          );
          pcdTool._scene.remove(bbox.box);
          pcdTool.redrawRequest();
          bbox.startPos = null;
          bbox.endPos = null;
          bbox.box = null;
        }
      },
      changeFrom: function() {
      },
      changeTo: function() {
        //pcdTool._wrapper.css('cursor', 'crosshair');
      },
    },
    'view': {
      animate: function() {
        pcdTool.redrawRequest();
        pcdTool._cameraControls.update();
      },
      mouseDown: function(e) {
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function(e) {
      },
      mouseUp: function(e) {
      },
      changeFrom: function() {
        pcdTool._cameraControls.enabled = false;
      },
      changeTo: function() {
        pcdTool._cameraControls.enabled = true;
        //pcdTool._wrapper.css('cursor', 'all-scroll');
      },
    },
  };
  return modeMethods;
}


