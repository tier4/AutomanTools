
import React from 'react';
import ReactDOM from 'react-dom';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { addTool } from './actions/tool_action';

import ImageBBox from './image_tool/image_bbox';

class ImageLabelTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 1.0
    };
    this._element = React.createRef();
    props.dispatchAddTool(props.idx, this);
  }
  componentDidMount() {
    this.init();
  }
  getButtons() {
    return null;
  }
  getEditor() {
    return null; 
  }
  render() {
    const wrapperStyle = {
      transform: `scale(${this.state.scale})`,
      transformOrigin: 'left top'
    };
    return (
      <div
        ref={this._element}
        style={wrapperStyle}
      />
    );
  }

  // private
  _decoration = null;
  // DOM
  _element = null;
  _container = null;
  _paper = null;
  _loaded = true;
  _image = null;
  _imageSize = {
    width: 0,
    height: 0
  };
  _wrapperSize = {
    width: 0,
    height: 0
  };

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
  init() {
    //const container = $('#jpeg-label-canvas');
    const container = this._element.current;
    this._paper = Raphael(container);
    this._container = $(container);
    this._decoration = new Decorations(this._paper);
    this._container.hide();
  }
  load(frame) {
    this._loaded = false;

    // TODO: use getURL
    const imgURL = this.props.labelTool.getURL('frame_blob', this.candidateId, frame);
    this._initImage(imgURL);
    this._decoration.hide();

    return new Promise((resolve, reject) => {
      this._loaded = true;
      resolve();
    });
  }
  handles = {
    resize: size => {
      this._wrapperSize = size;
      this._resize();
    },
    keydown: e =>{
    },
    keyup: e =>{
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



  _resize() {
    const paper = this._paper;

    let scale = Math.min(
      this._wrapperSize.width / this._imageSize.width,
      this._wrapperSize.height / this._imageSize.height
    );
    paper.setSize(
      this._imageSize.width, 
      this._imageSize.height
    );
    this.setState({ scale: scale });
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
      this._imageSize = {
        width: img.width,
        height: img.height
      };
      this._resize();
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
    const klass = this.props.controls.getTargetKlass();
    dx = dx / this.state.scale | 0;
    dy = dy / this.state.scale | 0;
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
  _imageDragStart = (x, y, e) => {
    if (e.button !== 0) { return; } // not left click
    this.props.controls.selectLabel(null);
    const offset = this._container.offset();
    this._creatingBox = {
      sx: (x - offset.left) / this.state.scale | 0,
      sy: (y - offset.top) / this.state.scale | 0,
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
      const label = this.props.controls.createLabel(
          this.props.controls.getTargetKlass(),
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

const mapStateToProps = state => ({
  controls: state.tool.controls,
  labelTool: state.tool.labelTool
});
const mapDispatchToProps = dispatch => ({
  dispatchAddTool: (idx, target) => dispatch(addTool(idx, target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ImageLabelTool);




