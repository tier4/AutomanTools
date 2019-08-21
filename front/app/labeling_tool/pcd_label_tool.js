
const toolStatus = {
};

// 3d eidt arrow
const arrowColors = [0xff0000, 0x00ff00, 0x0000ff],
      hoverColors = [0xffaaaa, 0xaaffaa, 0xaaaaff],
      AXES = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];

export default class PCDLabelTool{
  // private
  _labelTool = null;
  _wrapper = null;
  _loaded = true;
  _scene = null;
  _renderer = null;
  _camera = null;
  _camera_scale = 50;
  _controls = null;
  //cameraExMat = new THREE.Matrix4();
  // PCD objects
  _pcdLoader = null;
  _pointMeshes = [];
  // to mouse position
  _groundPlane = null;
  // control mode
  _modeMethods = createModeMethods(this);
  _modeStatus = {
    mode: 'create',
    busy: false,
    nextMode: null
  };
  _redrawFlag = true;
  _isBirdView = true;
  // to mode 'move'
  _editArrowGroup = null;
  _editArrows = null;
  // to mode 'resize'
  _editFacePlane = null;
  // to mode 'create'
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
  constructor(labelTool) {
    this._labelTool = labelTool;
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
    this._initFacePlane();

    this._animate();
  }
  load() {
    this._loaded = false;
    const frame = this._labelTool.getFrameNumber();
    const url = this._labelTool.getURL('frame_blob', this.candidateId);
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
    resize: () => {
      /*
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      */
      const width = window.innerWidth;
      const height = window.innerHeight;

      // fix camera aspect
      if (this._camera.inPerspectiveMode) {
        this._camera.aspect = width / height;
      } else {
        this._camera.left = -width / this._camera_scale;
        this._camera.right = width / this._camera_scale;
        this._camera.top = height / this._camera_scale;
        this._camera.bottom = -height / this._camera_scale;
      }
      this._camera.updateProjectionMatrix();

      // re-set render size
      this._renderer.setPixelRatio(window.devicePixelRatio);
      this._renderer.setSize(width, height);

      this._redrawFlag = true;
    },
    keydown: (e) => {
      if (e.keyCode === 16) { // shift
        this.modeChangeRequest('view');
      } else if (e.keyCode === 17) { // ctrl
        this.modeChangeRequest('move');
      } else if (e.keyCode === 83) { // 'S'
        this.modeChangeRequest('resize');
      } else if (e.keyCode === 82) { // 'R'
        this.modeChangeRequest('rotate');
      }
    },
    keyup: (e) => {
      if (e.keyCode === 16) { // shift
        if (this._modeStatus.mode === 'view') {
          this.modeChangeRequest('create');
        }
      } else if (e.keyCode === 17) { // ctrl
        if (this._modeStatus.mode === 'move') {
          this.modeChangeRequest('create');
        }
      } else if (e.keyCode === 83) { // 'S'
        if (this._modeStatus.mode === 'resize') {
          this.modeChangeRequest('create');
        }
      } else if (e.keyCode === 82) { // 'R'
        if (this._modeStatus.mode === 'rotate') {
          this.modeChangeRequest('create');
        }
      }
    }
  };
  setActive(isActive) {
    if ( isActive ) {
      this._wrapper.show();
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
      prev.bbox[id].cube.mesh.material = BBoxParams.material;
      prev.bbox[id].selected = false;
      this._redrawFlag = true;
    }
    if (next != null && next.has(id)) {
      next.bbox[id].cube.mesh.material = BBoxParams.selectingMaterial;
      next.bbox[id].selected = true;
      this._redrawFlag = true;
    }
    this.setArrow(next && next.bbox[id]);
  }
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
    renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer = renderer;
    this._scene = scene;

    const pcdLoader = new THREE.PCDLoader();
    this._pcdLoader = pcdLoader;
  }
  _initCamera() {
    // TODO: read YAML and set camera?
    let camera;
    if(this._isBirdView){
      camera = new THREE.OrthographicCamera(
        -window.innerWidth / this._camera_scale,
        window.innerWidth / this._camera_scale,
        window.innerHeight / this._camera_scale,
        -window.innerHeight / this._camera_scale,
        10,
        2000
      );
      camera.position.set(0, 0, 450);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
      camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.01,
        10000
      );
      camera.position.set(0,0,0.5);
    }
    camera.up.set (0,0,1);
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
    this._controls = controls;
  }
  _initDom() {
    const wrapper = $('#canvas3d'); // change dom id
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
  _initFacePlane() {
    // face edit plane
    const facePlaneGeo = new THREE.PlaneGeometry(1, 1);
    const facePlaneMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, side: THREE.DoubleSide,
        transparent: true, opacity: 0.5
      })
    const facePlane = new THREE.Mesh(facePlaneGeo, facePlaneMat);
    facePlane.rotation.order = 'ZXY';
    facePlane.visible = false;
    this._editFacePlane = facePlane;
    this._scene.add(facePlane);
  }
  _initArrow() {
    const size = 3,
          head = size / 2,
          headWidth = head / 2;
    this._editArrows = [
      new THREE.ArrowHelper(AXES[0], new THREE.Vector3(0,0,0), size, arrowColors[0], head, headWidth),
      new THREE.ArrowHelper(AXES[1], new THREE.Vector3(0,0,0), size, arrowColors[1], head, headWidth),
      new THREE.ArrowHelper(AXES[2], new THREE.Vector3(0,0,0), size, arrowColors[2], head, headWidth),
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
      this.box.pos.x  = +content['x_3d'];
      this.box.pos.y  = +content['y_3d'];
      this.box.pos.z  = +content['z_3d'];
      this.box.size.x = +content['width_3d'];
      this.box.size.y = +content['height_3d'];
      this.box.size.z = +content['length_3d'];
      this.box.yaw    = +content['rotation_y'];
    }
    this.initCube();
    this.pcdTool.pcdBBoxes.add(this);
    this._redrawFlag = true;
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw "Label already set";
    }
    this.label = label;
    this.labelItem = label.addBBox('PCD');
  }
  updateKlass() {
  }
  remove() {
    // TODO: remove meshes
    this.labelItem.remove();
    const mesh = this.cube.mesh;
    this.pcdTool._scene.remove(mesh);
    this.pcdTool._redrawFlag = true;
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
  initCube() {
    const mesh = new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material);
    const box = this.box;
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    this.pcdTool._scene.add(mesh);
    this.cube = {
      mesh: mesh 
    };
  }
  updateCube(changed) {
    const mesh = this.cube.mesh;
    const box = this.box;
    // TODO: check change flag
    // TODO: clamp() all
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    if ( changed ) {
      this.label.isChanged = true;
    }
    if (this.selected) {
      this.pcdTool.setArrow(this);
    }
  }
}



const modeNames = [
    'create', 'view', 'move', 'resize', 'rotate'
  ];
// TODO: move select methods to one place
function createModeMethods(pcdTool) {
  const modeMethods = {
    'resize': {
      prevHover: null,
      hoverFace: null,
      selectFace: null,
      mouse: null,
      animate: function() {
      },
      mouseDown: function(e) {
        if (this.selectFace==null && this.hoverFace!=null) {
          this.selectFace = this.hoverFace;
          this.mouse = pcdTool.getMousePos(e);
          pcdTool._modeStatus.busy = true;
        } else if (this.prevHover != null) {
          pcdTool._labelTool.selectLabel(this.prevHover.label);
        } else {
          pcdTool._labelTool.selectLabel(null);
        }
      },
      resetHover: function() {
        if (this.prevHover != null) {
          if ( this.prevHover.selected ) {
            this.prevHover.cube.mesh.material = BBoxParams.selectingMaterial;
          } else {
            this.prevHover.cube.mesh.material = BBoxParams.material;
          }
          pcdTool._redrawFlag = true;
          this.prevHover = null;
        }
      },
      resetHoverPlane: function() {
        pcdTool._editFacePlane.visible = false;
      },
      setHoverPlane: function(bbox, face) {
        const plane = pcdTool._editFacePlane;
        const normal = face.normal;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        // set rotation
        plane.rotation.set(
            normal.y*Math.PI/2,
            normal.x*Math.PI/2,
            yaw
        );
        // set pos
        const p = bbox.box.pos.clone()
                .add(
                    bbox.box.size.clone()
                        .multiply(normal)
                        .divideScalar(2)
                        .applyAxisAngle(AXES[2], yaw)
                );
        plane.position.set(p.x, p.y, p.z);
        // set pos
        const nn = normal.clone().multiply(normal);
        const width = (new THREE.Vector3(size.z, size.x, size.x))
                      .dot(nn),
              height= (new THREE.Vector3(size.y, size.z, size.y))
                      .dot(nn);
        plane.scale.set(width, height, 1);
        // set status
        plane.visible = true;
        pcdTool._redrawFlag = true;
      },
      mouseMove: function(e) {
        const ray = pcdTool.getRay(e);
        const label = pcdTool._labelTool.getTargetLabel();
        if (this.selectFace != null) {
          if (label == null) { return; } // TODO: this is error
          // TODO: 3d controlable
          const mouse = pcdTool.getMousePos(e);
          const dx = (mouse.x - this.mouse.x) * 100;
          const normal = this.selectFace.normal.clone();
          normal.multiply(normal);
          const move = (new THREE.Vector3(dx, dx, dx))
                        .multiply(normal);
          const bbox = label.bbox[pcdTool.candidateId];
          bbox.box.size.add(move);
          bbox.updateCube(dx != 0); // TODO: float zero check
          this.setHoverPlane(bbox, this.selectFace);
          this.mouse = mouse;
          pcdTool._redrawFlag = true;
        } else {
          // select face
          const prevHoverFace = this.hoverFace;
          this.hoverFace = null;
          if (label != null) {
            const bbox = label.bbox[pcdTool.candidateId];
            const intersectPos = ray.intersectObject(bbox.cube.mesh);
            if (intersectPos.length > 0) {
              this.hoverFace = intersectPos[0].face;
            }
            if (prevHoverFace != this.hoverFace) {
              if (this.hoverFace == null) {
                this.resetHoverPlane();
              } else {
                this.setHoverPlane(bbox, this.hoverFace);
              }
            }
          }
          // select edit
          const bboxes = Array.from(pcdTool.pcdBBoxes);
          for(let i=0; i<bboxes.length; ++i) {
            const bbox = bboxes[i];
            const intersectPos = ray.intersectObject(bbox.cube.mesh);
            if (intersectPos.length > 0) {
              if (this.prevHover == bbox) { return; }
              this.resetHover();
              bbox.cube.mesh.material = BBoxParams.hoverMaterial;
              this.prevHover = bbox;
              pcdTool._redrawFlag = true;
              return;
            }
          }
          this.resetHover();
        }
      },
      mouseUp: function(e) {
        if (this.selectFace != null) {
          this.selectFace = null;
        }
      },
      changeFrom: function() {
        this.resetHover();
        if (this.selectFace != null) {
          this.selectFace = null;
        }
        pcdTool._editFacePlane.visible = false;
        pcdTool._redrawFlag = true;
      },
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'default');
      },
    },
    'rotate': {
      mouse: null,
      animate: function() {
      },
      mouseDown: function(e) {
        const label = pcdTool._labelTool.getTargetLabel();
        if (label != null) {
          this.mouse = pcdTool.getMousePos(e);
          pcdTool._modeStatus.busy = true;
        }
      },
      mouseMove: function(e) {
        if (this.mouse != null) {
          const label = pcdTool._labelTool.getTargetLabel();
          if (label == null) { return; } // TODO: this is error
          // TODO: 3d controlable
          const mouse = pcdTool.getMousePos(e);
          const dx = (mouse.x - this.mouse.x) * Math.PI * 5;
          const bbox = label.bbox[pcdTool.candidateId];
          bbox.box.yaw += dx;
          bbox.updateCube(dx != 0); // TODO: float zero check
          this.mouse = mouse;
          pcdTool._redrawFlag = true;
        }
      },
      mouseUp: function(e) {
        if (this.mouse != null) {
          this.mouse = null;
        }
      },
      changeFrom: function() {
        this.mouse = null;
        pcdTool._redrawFlag = true;
      },
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'default');
      },
    },
    'move': {
      prevHover: null,
      arrowHover: -1,
      arrowMoving: null,
      animate: function() {
      },
      mouseDown: function(e) {
        // pcdTool._modeStatus.busy = true;
        if (this.arrowHover != -1) {
          const pos = pcdTool.getMousePos(e); // TODO: need 3d mouse pos
          this.arrowMoving = {
            arrow: this.arrowHover,
            mouse: pos
          };
          pcdTool._modeStatus.busy = true;
        } else if (this.prevHover != null) {
          pcdTool._labelTool.selectLabel(this.prevHover.label);
        } else {
          pcdTool._labelTool.selectLabel(null);
        }
      },
      resetHover: function() {
        if (this.prevHover != null) {
          if ( this.prevHover.selected ) {
            this.prevHover.cube.mesh.material = BBoxParams.selectingMaterial;
          } else {
            this.prevHover.cube.mesh.material = BBoxParams.material;
          }
          pcdTool._redrawFlag = true;
          this.prevHover = null;
        }
      },
      mouseMove: function(e) {
        if (this.arrowMoving != null) {
          const label = pcdTool._labelTool.getTargetLabel();
          if (label == null) { return; } // TODO: this is error
          // TODO: support Z axis
          const pos = pcdTool.getMousePos(e); // TODO: need 3d mouse pos
          const dx = (pos.x - this.arrowMoving.mouse.x) * 100;
          const move = (new THREE.Vector3(dx, dx, dx)).multiply(AXES[this.arrowMoving.arrow]);
          const bbox = label.bbox[pcdTool.candidateId];
          bbox.box.pos.add(move);
          bbox.updateCube(dx != 0); // TODO: float zero check
          this.arrowMoving.mouse = pos;
          pcdTool._redrawFlag = true;
          /*
          const move = pos.clone().sub(this.arrowMoving.mouse).multiply(AXES[this.arrowMoving.arrow]);
          const label = pcdTool._labelTool.getTargetLabel();
          if (label == null) { return; } // TODO: this is error
          const bbox = label.bbox[pcdTool.candidateId];
          bbox.box.pos.add(move);
          bbox.updateCube(move.length() != 0); // TODO: float zero check
          this.arrowMoving.mouse = pos;
          pcdTool._redrawFlag = true;
          */
        }
        const ray = pcdTool.getRay(e);

        // arrow edit
        const prevArrowHover = this.arrowHover;
        this.arrowHover = -1;
        for(let i=0; i<3; ++i) {
          const arrowIntersect = ray.intersectObject(pcdTool._editArrows[i].cone);
          if (arrowIntersect.length > 0) {
            if (this.arrowHover != i) {
              pcdTool._editArrows[i].setColor(new THREE.Color(hoverColors[i]));
              this.arrowHover = i;
              pcdTool._redrawFlag = true;
              break;
            }
          }
        }
        if (prevArrowHover != -1 && prevArrowHover != this.arrowHover) {
          // arrow color change
          const arrow = pcdTool._editArrows[prevArrowHover];
          arrow.setColor(new THREE.Color(arrowColors[prevArrowHover]));
          pcdTool._redrawFlag = true;
        }

        // select edit
        if (this.arrowHover == -1) {
          const bboxes = Array.from(pcdTool.pcdBBoxes);
          for(let i=0; i<bboxes.length; ++i) {
            const bbox = bboxes[i];
            const intersectPos = ray.intersectObject(bbox.cube.mesh);
            if (intersectPos.length > 0) {
              if (this.prevHover == bbox) { return; }
              this.resetHover();
              bbox.cube.mesh.material = BBoxParams.hoverMaterial;
              this.prevHover = bbox;
              pcdTool._redrawFlag = true;
              return;
            }
          }
        }
        this.resetHover();
      },
      mouseUp: function(e) {
        if (this.arrowMoving != null) {
          this.arrowMoving = null;
        }
      },
      changeFrom: function() {
        this.resetHover();
        if (this.arrowHover != -1) {
          const arrow = pcdTool._editArrows[this.arrowHover];
          arrow.setColor(new THREE.Color(arrowColors[this.arrowHover]));
          pcdTool._redrawFlag = true;
          this.arrowHover = -1;
        }
        if (this.arrowMoving != null) {
          this.arrowMoving = null;
        }
      },
      changeTo: function() {
        this.prevHover = null;
        pcdTool._wrapper.css('cursor', 'default');
      },
    },
    'create': {
      animate: function() {
      },
      mouseDown: function(e) {
        const pos = pcdTool.getIntersectPos(e);
        if (pos != null) {
          pcdTool._creatingBBox.startPos = pos;
          pcdTool._modeStatus.busy = true;
        }
      },
      mouseMove: function(e) {
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
            pcdTool._redrawFlag = true;
          }
        }
      },
      mouseUp: function(e) {
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
        const label = pcdTool._labelTool.createLabel(
          pcdTool._labelTool.getTargetKlass(),
          {[pcdTool.candidateId]: pcdBBox}
        );
        pcdTool._scene.remove(bbox.box);
        pcdTool._redrawFlag = true;
        bbox.startPos = null;
        bbox.endPos = null;
        bbox.box = null;
      },
      changeFrom: function() {
      },
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'crosshair');
      },
    },
    'view': {
      animate: function() {
        pcdTool._redrawFlag = true;
        pcdTool._controls.update();
      },
      mouseDown: function(e) {
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function(e) {
      },
      mouseUp: function(e) {
      },
      changeFrom: function() {
        pcdTool._controls.enabled = false;
      },
      changeTo: function() {
        pcdTool._controls.enabled = true;
        pcdTool._wrapper.css('cursor', 'all-scroll');
      },
    },
  };
  return modeMethods;
}


