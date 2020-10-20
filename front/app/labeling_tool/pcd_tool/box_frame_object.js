const BBoxParams = {
  geometry: new THREE.CubeGeometry(1.0, 1.0, 1.0),
};
const MaterialColors = {
  normal: 0x008866,
  select: 0xff0000,
  hover: 0xffff00,
};
const BOLD_WEIGHT = 2,
      THIN_WEIGHT = 0.3,
      NORMAL_WEIGHT = 1;

// initialize geometry
const cubeEdgesGeo = new THREE.EdgesGeometry(new THREE.CubeGeometry(1, 1, 1));
const p = cubeEdgesGeo.getAttribute('position').array;
const edgesByAxis = [[], [], []];
const isFrontEdgeByAxis = [[], [], []];
const rotateByAxis = [
  new THREE.Vector3(0, 0, Math.PI/2),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(Math.PI/2, 0, 0),
];
for (let i=0; i<p.length; i+=6) {
  const p0 = new THREE.Vector3(p[i  ], p[i+1], p[i+2]);
  const p1 = new THREE.Vector3(p[i+3], p[i+4], p[i+5]);
  const diff = new THREE.Vector3().subVectors(p1, p0);
  const axis =
    Math.abs(diff.x) > 0 ? 0 :
    Math.abs(diff.y) > 0 ? 1 :
    2;
  edgesByAxis[axis].push(new THREE.Line3(p0, p1));
  isFrontEdgeByAxis[axis].push(p0.x > 0 && p1.x > 0);
}
const R = 0.05;
const edgeGeo = new THREE.CylinderGeometry(R, R, 1, 4, 1, true);

const frontPlaneGeo = new THREE.PlaneGeometry(1, 1);


export default class BoxFrameObject {
  constructor() {
    const frontFrameMat = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    this.frontFrameMat = frontFrameMat;
    const mainMaterial = new THREE.MeshBasicMaterial({
      color: 0x008866
    });
    this.mainMaterial = mainMaterial;

    const meshByAxis = [[], [], []];
    const meshGroup = new THREE.Group();
    for (let axis in edgesByAxis) {
      const edges = edgesByAxis[axis];
      const meshes = meshByAxis[axis];
      const rot = rotateByAxis[axis];
      const isFrontEdge = isFrontEdgeByAxis[axis];
      for (let i in edges) {
        const material = isFrontEdge[i] ? frontFrameMat : mainMaterial;
        const mesh = new THREE.Mesh(edgeGeo, material);
        mesh.rotation.set(rot.x, rot.y, rot.z);
        meshGroup.add(mesh);
        meshes[i] = mesh;
      }
    }
    this.meshGroup = meshGroup;
    this.meshByAxis = meshByAxis;
    this.bold = false;
    this.thin = false;

    const colorMat = new THREE.MeshBasicMaterial({
      color: 0x000000, side: THREE.DoubleSide,
      transparent: true, opacity: 0.4
    });
    const frontPlane = new THREE.Mesh(frontPlaneGeo, colorMat);
    frontPlane.rotation.set(0, Math.PI/2, 0);
    meshGroup.add(frontPlane);
    this.colorMat = colorMat;
    this.frontPlane = frontPlane;
  }
  getPos() {
    return this.pos;
  }
  getSize() {
    return this.size;
  }
  getYaw() {
    return this.yaw;
  }
  setColor(clr) {
    this.colorMat.color.set(clr);
    this.frontFrameMat.color.set(clr);
  }
  setBold(b) {
    this.bold = !!b;
  }
  setThin(b) {
    this.thin = !!b;
  }
  setParam(pos, size, yaw) {
    this.pos = pos;
    this.size = size;
    this.yaw = yaw;
    this.meshGroup.position.set(pos.x, pos.y, pos.z);
    this.meshGroup.rotation.z = yaw;
    const w = this.thin ? THIN_WEIGHT :
      this.bold ? BOLD_WEIGHT : NORMAL_WEIGHT;
    for (let axis in edgesByAxis) {
      const edges = edgesByAxis[axis];
      const meshes = this.meshByAxis[axis];
      const ax = 'xyz'[axis];
      for (let i in edges) {
        const edge = edges[i];
        const mesh = meshes[i];
        const p = edge.getCenter().multiply(size);
        mesh.position.set(p.x, p.y, p.z);
        mesh.scale.set(w, size[ax], w);
      }
    }
    this.frontPlane.scale.set(size.z, size.y, 1);
    this.frontPlane.position.set(size.x/2, 0, 0);
  }
  setStatus(isSelected, isHover) {
    let clr = MaterialColors.normal;
    if (isHover) {
      clr = MaterialColors.hover;
    } else if (isSelected) {
      clr = MaterialColors.select;
    }
    this.mainMaterial.color.set(clr);
  }
  addTo(scene) {
    scene.add(this.meshGroup);
  }
  removeFrom(scene) {
    scene.remove(this.meshGroup);
  }
}
