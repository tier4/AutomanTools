
import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { addTool } from './actions/tool_action';

import ImageBBox from './image_tool/image_bbox';
import CommonEditBar from './common_edit_bar';

const imageToolStyle = {
  wrapper: {
    position: 'relative',
    height: '100%'
  },
  main: {
    transformOrigin: 'left top'
  },
  wipe: {
    position: 'absolute',
    transformOrigin: 'left bottom',
    bottom: 0,
    left: 0,
    borderTop: 'solid 2px #fff',
    borderRight: 'solid 2px #fff'
  },
  wipeText: {
    transformOrigin: 'left top',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#fff',
    padding: '0px 7px'
  },
  guard: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%'
  }
};

const MAIN_SCREEN_SCALE = 0.68;
const WIPE_SCREEN_SCALE = 1 - MAIN_SCREEN_SCALE;
class ImageLabelTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 1.0,
      isWipe: false
    };
    this._element = React.createRef();
    this._wipeElement = React.createRef();
    this._wrapperElement = React.createRef();
    props.dispatchAddTool(props.idx, this);
  }
  componentDidMount() {
    this.init();
  }
  getButtons() {
    return null;
  }
  getEditor() {
    return (
      <CommonEditBar />
    );
  }
  render() {
    const classes = this.props.classes;
    const mainScale = this.state.scale * MAIN_SCREEN_SCALE;
    const wipeScale = this.state.scale * WIPE_SCREEN_SCALE;
    const mainMargin = this._wrapperSize.width - this._imageSize.width * mainScale;
    const wipeWidth = this._imageSize.width * wipeScale;
    const ml = Math.min(mainMargin, wipeWidth);

    const wrapperStyle = this.state.isWipe ? {
      transformOrigin: 'left top',
      transform: `scale(${wipeScale})`,
      position: 'absolute',
      zIndex: 100
    } : {};
    const mainStyle = {
      transform: `scale(${mainScale})`,
      marginLeft: isFinite(ml) ? ml : 0
    };
    const wipeStyle = {
      transform: `scale(${wipeScale})`
    };
    const wipeTextStyle = {
      transform: `scale(${1 / wipeScale})`
    };
    const guardStyle = {};
    if (this.state.isWipe) {
      wipeStyle['display'] = 'none';
      guardStyle['width'] = this._imageSize.width + 'px';
      guardStyle['height'] = this._imageSize.height + 'px';
      Object.assign(mainStyle, {
        transform: 'scale(1)',
        marginLeft: 0,
        borderRight: 'solid 2px white',
        borderBottom: 'solid 2px white'
      });
    } else {
      guardStyle['display'] = 'none';
    }
    return (
      <div
        ref={this._wrapperElement}
        className={classes.wrapper}
        style={wrapperStyle}
      >
        <div
          ref={this._element}
          className={classes.main}
          style={mainStyle}
        />
        <div
          ref={this._wipeElement}
          className={classes.wipe}
          style={wipeStyle}
          onClick={() => this.props.controls.previousFrame()}
        >
          <div
            className={classes.wipeText}
            style={wipeTextStyle}
          >
            Prev
          </div>
        </div>
        <div
          className={classes.guard}
          style={guardStyle}
        />
      </div>
    );
  }

  // private
  _decoration = null;
  // DOM
  _wrapperElement = null;
  _element = null;
  _wipeElement = null;
  _wrapper = null;
  _container = null;
  _paper = null;
  _wipePaper = null;
  _loaded = true;
  _image = null;
  _wipeImage = null;
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
  setCandidateId(id) {
    this.candidateId = id;
  }

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
    const wipe = this._wipeElement.current;
    this._wipePaper = Raphael(wipe);
    const wrapper = $(this._wrapperElement.current);
    wrapper.hide();
    this._wrapper = wrapper;
  }
  load(frame) {
    this._loaded = false;

    // TODO: use getURL
    const imgURL = this.props.labelTool.getURL('frame_blob', this.candidateId, frame);
    this._initImage(imgURL);
    const wipeFrame = frame - this.props.controls.getFixedSkipFrameCount();
    if (wipeFrame >= 0) {
      const wipeImgURL = this.props.labelTool.getURL('frame_blob', this.candidateId, wipeFrame);
      this._initWipeImage(wipeImgURL);
    } else {
      this._initWipeImage(null);
    }
    this._decoration.hide();

    return new Promise((resolve, reject) => {
      this._loaded = true;
      resolve();
    });
  }
  unload(frame) {
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
  setActive(isActive, isWipe=false) {
    if (isWipe !== this.state.isWipe) {
      this.setState({ isWipe: isWipe });
    }
    if (isActive) {
      this._wrapper.show();
    } else {
      this._wrapper.hide();
    }
  }
  createWipeBBox(content, klass) {
    // TODO: add class
    const box = ImageBBox.fromContentToObj(content).box;
    const size = box.getSize();
    const rect = this._wipePaper.rect(
      box.min.x, box.min.y,
      size.x, size.y
    ).attr({
      'stroke-width': 1,
      'stroke': klass.getColor()
    });
    return {
      rect: rect,
      select(flag) {
        this.rect.attr({
          'stroke-width': flag ? 5 : 2
        });
      }
    };
  }
  createBBox(content) {
    return new ImageBBox(this, content);
  }
  disposeWipeBBox(bbox) {
    bbox.rect.remove();
  }
  disposeBBox(bbox) {
    bbox.remove();
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
  getMainScale() {
    return this.state.scale * MAIN_SCREEN_SCALE;
  }



  _getScale() {
    const widthRatio = this._wrapperSize.width / this._imageSize.width;
    const heightRatio = this._wrapperSize.height / this._imageSize.height;
    const aspectRatio = widthRatio / heightRatio;

    if (aspectRatio < MAIN_SCREEN_SCALE) {
      return widthRatio / MAIN_SCREEN_SCALE;
    } else if (aspectRatio < 1) {
      return heightRatio;
    } else if (aspectRatio <= 1 / MAIN_SCREEN_SCALE) {
      return widthRatio;
    } else {
      return heightRatio / MAIN_SCREEN_SCALE;
    }
  }
  _resize() {
    const paper = this._paper;
    const wipePaper = this._wipePaper;

    const scale = this._getScale();
    paper.setSize(
      this._imageSize.width,
      this._imageSize.height
    );
    wipePaper.setSize(
      this._imageSize.width,
      this._imageSize.height
    );
    this.setState({ scale: scale });
  }
  _initWipeImage(url) {
    if (this._wipeImage != null) {
      this._wipeImage.remove();
      this._wipeImage = null;
    }
    if (url == null) {
      return;
    }
    const paper = this._wipePaper;
    const image = paper.image(url, 0, 0, "100%", "100%");
    image.toBack();
    this._wipeImage = image;
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
    const mainScale = this.state.scale * MAIN_SCREEN_SCALE;
    dx = dx / mainScale | 0;
    dy = dy / mainScale | 0;
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
    const mainScale = this.state.scale * MAIN_SCREEN_SCALE;
    this._creatingBox = {
      sx: (x - offset.left) / mainScale | 0,
      sy: (y - offset.top) / mainScale | 0,
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
  withStyles(imageToolStyle),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ImageLabelTool);




