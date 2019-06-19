
export default class ImageLabelTool {
  // private
  _labelTool = null;
  _decoration = null;
  // DOM
  _container = null;
  _paper = null;
  _loaded = true;
  _image = null;
  _scale = 1.0; // TODO: use scale

  // public
  name = 'Image';
  dataType = 'IMAGE';
  candidateId = -1;

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
    const container = $('#jpeg-label-canvas');
    this._paper = Raphael(container.get(0));
    this._container = container;
    this._decoration = new Decorations(this._paper);
    container.hide();
  }
  load() {
    this._loaded = false;

    // TODO: use getURL
    const imgURL = this._labelTool.getURL('frame_blob', this.candidateId);
    this._initImage(imgURL);
    this._decoration.hide();

    return new Promise((resolve, reject) => {
      this._loaded = true;
      resolve();
    });
  }
  handles = {
    resize() {
    },
    keydown(e) {
    },
    keyup(e) {
    }
  };
  setActive(isActive) {
    if ( isActive ) {
      this._container.show();
    } else {
      this._container.hide();
    }
    // set canvas size
    
    // over?
  }
  createBBox(content) {
    return new ImageBBox(this, content);
  }
  disposeBBox(bbox) {
    bbox.remove();
  }
  updateBBox(label) {
    // TODO: recreate all
  }
  updateTarget(prev, next) {
    const id = this.candidateId;
    if (prev != null && prev.has(id)) {
      prev.bbox[id].selected = false;
    }
    if (next != null && next.has(id)) {
      const bbox = next.bbox[id];
      bbox.selected = true;
      bbox.toFront();
      this._decoration.show(bbox);
    } else {
      this._decoration.hide();
    }
  }



  _initImage(url) {
    if (this._image != null) {
      this._image.remove();
      this._image = null;
    }
    const paper = this._paper;
    let img = new Image();
    img.src = url;
    img.addEventListener('load', () => {
      // TODO: resize method
      paper.setSize(img.width, img.height);
      img = null; // dispose image
    });
    const image = paper.image(url, 0, 0, "100%", "100%");
    image.toBack();
    image.attr({
      'cursor': 'crosshair'
    });
    image.toBack();
    image.drag(
      this._imageDragMove,
      this._imageDragStart,
      this._imageDragEnd
    );
    this._image = image;
  }

  _creatingRect = null;
  _creatingBox = null;
  _imageDragMove = (dx, dy) => {
    const klass = this._labelTool.getTargetKlass();
    if (this._creatingRect == null) {
      const posDiff = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      if (posDiff >= 10) {
        this._creatingRect = this._paper.rect(0,0,0,0)
          .attr(BBoxParams.attrs.rect)
          .attr({'stroke': klass.getColor()});
      }
    }
    let rdx = dx, rdy = dy;
    const minSize = klass.getMinSize();
    if (Math.abs(dx) < minSize.x) {
      rdx = dx<0 ? -minSize.x : minSize.x;
    }
    if (Math.abs(dy) < minSize.y) {
      rdy = dy<0 ? -minSize.y : minSize.y;
    }
    this._creatingBox.ex = this._creatingBox.sx + rdx;
    this._creatingBox.ey = this._creatingBox.sy + rdy;
    if (this._creatingRect != null) {
      const box = this._creatingBox;
      this._creatingRect.attr({
        x: Math.min(box.sx, box.ex),
        y: Math.min(box.sy, box.ey),
        width : Math.abs(box.ex - box.sx),
        height: Math.abs(box.ey - box.sy)
      });
    }
  };
  _imageDragStart = (x, y) => {
    this._labelTool.selectLabel(null);
    const offset = this._container.offset();
    this._creatingBox = {
      sx: x-offset.left,
      sy: y-offset.top,
      ex: 0, ey: 0
    };
  };
  _imageDragEnd = () => {
    // TODO: create bbox
    if (this._creatingRect != null) {
      const box = this._creatingBox;
      const imageBBox = new ImageBBox(this, {
          'min_x_2d': Math.min(box.sx, box.ex),
          'min_y_2d': Math.min(box.sy, box.ey),
          'max_x_2d': Math.max(box.sx, box.ex),
          'max_y_2d': Math.max(box.sy, box.ey)
        });
      // TODO: add branch use selecting label
      const label = this._labelTool.createLabel(
          this._labelTool.getTargetKlass(),
          {[this.candidateId]: imageBBox}
        );
      if (label == null) {
        Controls.error('Label create error');
      }
      this._creatingRect.remove();
      this._creatingRect = null;
    }
    this._creatingBox = null;
  };


};


// target decorations
class Decorations {
  emphAttrs = [
    { 'stroke': '#fff' },
    { 'stroke': '#000', 'stroke-dasharray': '.' }
  ];
  textAttr = {
    'stroke': '#000',
    'stroke-width': 0.5,
    'font-size': 20,
    'text-anchor': 'start'
  };
  bgAttr = {
    'stroke': 'none',
    'fill': '#fff',
    'fill-opacity': '0.5',
  };
  emph = null;
  text = null;
  constructor(paper) {
    this.emph = [
      paper.path('').attr(this.emphAttrs[0]),
      paper.path('').attr(this.emphAttrs[1])
    ];
    this.bg = paper.rect(0,0,0,0)
      .attr(this.bgAttr);
    this.text = paper.text(0,0,'')
      .attr(this.textAttr);
    this.hide();
  }
  show(bbox) {
    if (bbox == null) { return; }
    this.emph.forEach(emph => emph.show());
    this.text.attr({
      'text': bbox.label.toString()
    });
    this.bg.show();
    this.text.show();
    this.move(bbox);
  }
  hide() {
    this.emph.forEach(em => em.hide());
    this.bg.hide();
    this.text.hide();
  }
  move(bbox) {
    const l = bbox.box.min.x, t = bbox.box.min.y,
          r = bbox.box.max.x, b = bbox.box.max.y,
          cx = parseInt((l + r) / 2),
          cy = parseInt((t + b) / 2),
          th = this.textAttr['font-size'];
    const path = {
      'path': `M ${cx},${t} L ${cx},${b} M ${l},${cy} L ${r},${cy}`
    };
    this.emph[0].attr(path);
    this.emph[1].attr(path);
    this.text.attr({
      x: l, y: t-th/2
    });
    const box = this.text.getBBox();
    this.bg.attr({
      x: box.x, y: box.y, width: box.width, height: box.height
    });
  }

  
};



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
class ImageBBox {
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
      this.box.set(new THREE.Vector2(
          +content['min_x_2d'],
          +content['min_y_2d']
        ), new THREE.Vector2(
          +content['max_x_2d'],
          +content['max_y_2d']
        )
      );
    }
    this.initRect();
    this.initResizer();
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw "Label already set";
    }
    this.label = label;
    this.labelItem = label.addBBox('Image');
    this.rect.attr({ 'stroke': label.getColor() });
  }
  updateKlass() {
    this.rect.attr({ 'stroke': this.label.getColor() });
    this.deco.show(this);
  }
  remove() {
    this.labelItem.remove();
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
    const prevBox = this.prev.box;
    const x = Math.min(Math.max(prevBox.min.x+dx, 0),
        prevBox.max.x - this.label.getMinSize().x);
    this.box.min.x = x;
  }
  setMinY(dy) {
    const prevBox = this.prev.box;
    const y = Math.min(Math.max(prevBox.min.y+dy, 0),
        prevBox.max.y - this.label.getMinSize().y);
    this.box.min.y = y;
  }
  setMaxX(dx) {
    const prevBox = this.prev.box;
    const width = this.paper.width;
    const x = Math.max(Math.min(prevBox.max.x+dx, width),
        prevBox.min.x + this.label.getMinSize().x);
    this.box.max.x = x;
  }
  setMaxY(dy) {
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
    this.imageTool._labelTool.selectLabel(this.label);
    this.prev = {
      box: this.box.clone()
    };
  }
  dragEnd() {
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











