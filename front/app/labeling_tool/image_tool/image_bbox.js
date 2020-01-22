
// BBox
const BBoxParams = {
  attrs: {
    rect: {
      'stroke-width': 2,
      'fill': '#fff',
      'fill-opacity': 0,
      'cursor': 'all-scroll'
    },
    resizer: {
      'stroke': 'none',
      'fill': '#fff',
      'fill-opacity': 0
    },
    edges: [
      {'cursor': 'ew-resize'},
      {'cursor': 'ns-resize'}
    ],
    corners: [
      {'cursor': 'nwse-resize'},
      {'cursor': 'nesw-resize'}
    ],
  },
};
export default class ImageBBox {
  constructor(imageTool, content) {
    this.imageTool = imageTool;
    this.paper = imageTool._paper;
    this.deco = imageTool._decoration;
    this.label = null;
    this.selected = false;
    this.box = new THREE.Box2(
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0)
      );
    this.prev = null;
    if (content != null) {
      // TODO: is there no annotation?
      this.fromContent(content);
    }
    this.initRect();
    this.initResizer();
  }
  getScale() {
    return this.imageTool.state.scale;
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw "Label already set";
    }
    this.label = label;
    //this.labelItem = label.addBBox('Image');
    this.rect.attr({ 'stroke': label.getColor() });
  }
  updateKlass() {
    this.rect.attr({ 'stroke': this.label.getColor() });
    this.deco.show(this);
  }
  updateParam() {
    // TODO: change content
    this.setElementPos();
  }
  remove() {
    //this.labelItem.remove();
    this.rect.remove();
    this.edgeResizers.forEach(it => it.remove());
    this.cornerResizers.forEach(it => it.remove());
  }
  toContent(obj) {
    obj['min_x_2d'] = this.box.min.x;
    obj['min_y_2d'] = this.box.min.y;
    obj['max_x_2d'] = this.box.max.x;
    obj['max_y_2d'] = this.box.max.y;
  }
  fromContent(content) {
    this.box.set(new THREE.Vector2(
        +content['min_x_2d'],
        +content['min_y_2d']
      ), new THREE.Vector2(
        +content['max_x_2d'],
        +content['max_y_2d']
      )
    );
  }
  initRect() {
    const size = this.box.getSize();
    const rect = this.paper.rect(
        this.box.min.x, this.box.min.y,
        size.x, size.y
      ).attr(BBoxParams.attrs.rect);
    // 4th arguments set 'this' into callbacks
    rect.drag(this.dragMove, this.dragStart, this.dragEnd, this);
    this.rect = rect;
  }
  initResizer() {
    const paper = this.paper;
    const edges = [
      // left, right, top, bottom
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.edges[0])
           .drag(this.resizerDragL, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.edges[0])
           .drag(this.resizerDragR, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.edges[1])
           .drag(this.resizerDragT, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.edges[1])
           .drag(this.resizerDragB, this.dragStart, this.dragEnd, this)
    ], corners = [
      // tl, tr, bl, br
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.corners[0])
           .drag(this.resizerDragTL, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.corners[1])
           .drag(this.resizerDragTR, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.corners[1])
           .drag(this.resizerDragBL, this.dragStart, this.dragEnd, this),
      paper.rect(0,0,0,0).attr(BBoxParams.attrs.corners[0])
           .drag(this.resizerDragBR, this.dragStart, this.dragEnd, this)
    ];
    edges.forEach(it => it.attr(BBoxParams.attrs.resizer));
    corners.forEach(it => it.attr(BBoxParams.attrs.resizer));
    this.edgeResizers = edges;
    this.cornerResizers = corners;
  }
  resizerDragL(dx, dy) { this.setMinX(dx); this.setVisiblePos(); }
  resizerDragR(dx, dy) { this.setMaxX(dx); this.setVisiblePos(); }
  resizerDragT(dx, dy) { this.setMinY(dy); this.setVisiblePos(); }
  resizerDragB(dx, dy) { this.setMaxY(dy); this.setVisiblePos(); }
  resizerDragTL(dx, dy) { this.setMinX(dx); this.setMinY(dy); this.setVisiblePos(); }
  resizerDragTR(dx, dy) { this.setMaxX(dx); this.setMinY(dy); this.setVisiblePos(); }
  resizerDragBL(dx, dy) { this.setMinX(dx); this.setMaxY(dy); this.setVisiblePos(); }
  resizerDragBR(dx, dy) { this.setMaxX(dx); this.setMaxY(dy); this.setVisiblePos(); }
  setMinX(dx) {
    dx = dx / this.getScale() | 0;
    const prevBox = this.prev.box;
    const x = Math.min(Math.max(prevBox.min.x+dx, 0),
        prevBox.max.x - this.label.getMinSize().x);
    this.box.min.x = x;
  }
  setMinY(dy) {
    dy = dy / this.getScale() | 0;
    const prevBox = this.prev.box;
    const y = Math.min(Math.max(prevBox.min.y+dy, 0),
        prevBox.max.y - this.label.getMinSize().y);
    this.box.min.y = y;
  }
  setMaxX(dx) {
    dx = dx / this.getScale() | 0;
    const prevBox = this.prev.box;
    const width = this.paper.width;
    const x = Math.max(Math.min(prevBox.max.x+dx, width),
        prevBox.min.x + this.label.getMinSize().x);
    this.box.max.x = x;
  }
  setMaxY(dy) {
    dy = dy / this.getScale() | 0;
    const prevBox = this.prev.box;
    const height = this.paper.height;
    const y = Math.max(Math.min(prevBox.max.y+dy, height),
        prevBox.min.y + this.label.getMinSize().y);
    this.box.max.y = y;
  }
  toFront() {
    this.rect.toFront();
    this.edgeResizers.forEach(it => it.toFront());
    this.cornerResizers.forEach(it => it.toFront());
  }
  dragMove(dx, dy) {
    dx = dx / this.getScale() | 0;
    dy = dy / this.getScale() | 0;
    const prev = this.prev;
    const width = this.paper.width,
          height = this.paper.height;
    const rdx = Math.min(width - prev.box.max.x,
                Math.max(dx, -prev.box.min.x));
    const rdy = Math.min(height- prev.box.max.y,
                Math.max(dy, -prev.box.min.y));
    this.box = prev.box.clone().translate(new THREE.Vector2(rdx, rdy));
    this.setVisiblePos();
  }
  dragStart() {
    this.imageTool.props.controls.selectLabel(this.label);
    this.prev = {
      box: this.box.clone()
    };
    this.label.createHistory();
  }
  dragEnd() {
    if (!this.box.equals(this.prev.box)) {
      this.label.addHistory();
    }
    this.setElementPos();
  }
  setVisiblePos() {
    const l = this.box.min.x, t = this.box.min.y,
        size = this.box.getSize();
    setRectPos(this.rect, l, t, size.x, size.y);
    if ( this.selected ) {
      this.deco.move(this);
    }
  }
  setElementPos() {
    if (this.prev!=null && !this.label.isChanged) {
      this.label.isChanged = !this.box.equals(this.prev.box);
    }
    this.prev = null;
    const l = this.box.min.x, t = this.box.min.y,
        r = this.box.max.x, b = this.box.max.y,
        size = this.box.getSize(),
        d = 3, d2 = d*2;
    setRectPos(this.rect, l, t, size.x, size.y);
    // left, right, top, bottom
    setRectPos(this.edgeResizers[0], l-d, t+d, d2, size.y-d2);
    setRectPos(this.edgeResizers[1], r-d, t+d, d2, size.y-d2);
    setRectPos(this.edgeResizers[2], l+d, t-d, size.x-d2, d2);
    setRectPos(this.edgeResizers[3], l+d, b-d, size.x-d2, d2);
    // tl, tr, bl, br
    setRectPos(this.cornerResizers[0], l-d, t-d, d2, d2);
    setRectPos(this.cornerResizers[1], r-d, t-d, d2, d2);
    setRectPos(this.cornerResizers[2], l-d, b-d, d2, d2);
    setRectPos(this.cornerResizers[3], r-d, b-d, d2, d2);
    if ( this.selected ) {
      this.deco.move(this);
    }
  }
}
const setRectPos = function(elem, x, y, w, h) {
  elem.attr({x:x, y:y, width:w, height:h});
};











