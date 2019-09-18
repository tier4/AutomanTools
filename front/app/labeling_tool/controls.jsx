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

import {toolStyle, appBarHeight, drawerWidth} from 'automan/labeling_tool/tool-style';

import RequestClient from 'automan/services/request-client'


class Controls extends React.Component {
  labelTool = null;
  annotation = null;
  getAnnotation = (tgt) => { this.annotation = tgt; }
  klassSet = null;
  getKlassSet = (tgt) => { this.klassSet= tgt; }
  // progress
  frameLength = 0;
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
    this.mainContent = React.createRef();
    this.initTools();
  }
  initTools() {
    // load labeling tools
    const LABEL_TYPES = {
      BB2D: {
        tools: [ImageLabelTool],
        names: ['2D']
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

    if (this.mainContent.current != null) {
      this.mainContent.current.style.height = size.height + 'px';
    }
    this.tools.forEach((tool) => {
      tool.current.handles.resize(size);
    });
  }
  initEvent() {
    $(window)
      .keydown(e => {
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
    const oldLabel = this.annotation.getTarget()
    let newLabel;
    newLabel = this.annotation.setTarget(label);
    if (newLabel !== null) {
      this.klassSet.setTarget(newLabel.klass);
    }
    //update
    this.getTool().updateTarget(oldLabel, newLabel);
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
      count = Math.max(1, this.state.skipFrameCount);
    }
    this.moveFrame(count);
  }
  previousFrame(count) {
    if (count == undefined) {
      count = Math.max(1, this.state.skipFrameCount);
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

    let savePromise;
    if (this.annotation.isChanged()) {
      const TEXT_SAVE = 'Do you want to save?';
      const TEXT_MOVE = 'Do you want to move frame WITHOUT saving?';
      if ( window.confirm(TEXT_SAVE) ) {
        savePromise = this.annotation.save();
      } else if ( window.confirm(TEXT_MOVE) ) {
        savePromise = Promise.resolve();
      } else {
        return true;
      }
    } else {
      savePromise = Promise.resolve();
    }

    savePromise
      .then(() => this.loadFrame(num))
      .then(
        () => {
        },
        () => {
        }
      );
    return true;
  }
  
  saveFrame() {
    return this.annotation.save()
      .then(() => this.reloadFrame());
  }
  reloadFrame() {
    return this.loadFrame(this.getFrameNumber());
  }
  loadFrame(num) {
    if (this.isLoading) {
      return Promise.reject('duplicate loading');
    }
    this.selectLabel(null);

    if (num == null) {
      num = this.state.frameNumber;
    }

    this.isLoading = true;
    return this.labelTool.loadBlobURL(num)
      .then(() => {
        return this.annotation.load(num);
      })
      .then(() => {
        return Promise.all(
          this.getTools().map(
            tool => tool.load(num)
          )
        );
      })
      .then(() => {
        this.isLoading = false;
        this.setState({frameNumber: num});
      });
  }
  getFrameNumber() {
    return this.state.frameNumber;
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
      this.setFrameNumber(value - 1);
      e.target.value = '';
      e.preventDefault();
      return;
    }
  };
  onSkipChange = (e) => {
    let value = +(e.target.value) | 0;
    if (e.target.value === '') {
      value = 0;
    }
    if (isNaN(value) || value < 0) {
      return;
    }
    this.setState({ skipFrameCount: value });
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
    const tool = this.getTool();
    const buttons  = tool == null ? null : tool.getButtons();
    return (
      <Drawer
        anchor="left"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
        <div className={classes.toolControlsWrapper}>
          <div className={classes.toolControls}>
            Tools
            <Divider />
            <Grid container alignItems="center">
              <Grid item xs={12}>
                {toolButtons}
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Button onClick={() => this.saveFrame()}>Save</Button>
                <Button onClick={() => this.reloadFrame()}>Reload</Button>
              </Grid>
              <Grid item xs={12}>
                <Button disabled>Copy</Button>
                <Button disabled>Paste</Button>
              </Grid>
              <Grid item xs={12}>
                <Button disabled>Undo</Button>
                <Button disabled>Redo</Button>
              </Grid>
              <Grid item xs={12}>
                <Divider />
                {buttons}
              </Grid>
            </Grid>
          </div>
          <Divider />
          <div className={classes.labelList}>
            {this.renderLabels(classes)}
          </div>
        </div>
      </Drawer>
    );
  }
  render() {
    const classes = this.props.classes;
    let skip = this.state.skipFrameCount;
    let frameNumberForm = (
      <div className={classes.frameNumberParts}>
        <IconButton
          color="inherit"
          onClick={this.onClickPrevFrame}
        >
          <NavigateBefore />
        </IconButton>
        <TextField
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
        <TextField
          label="skip step"
          type="text"
          placeholder="skip step"
          onChange={this.onSkipChange}
          className={classes.frameSkip}
          value={skip === 0 ? '' : skip}
          margin="dense"
        />
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
    
    // TODO: show bbox variable & edit it
    let editBar = (
      <Drawer
        anchor="right"
        variant="permanent"
        open={true}
        classes={{
          paper: classes.drawer
        }}
      >
      </Drawer>
    );
    return (
      <div >
        {appBar}
        {this.renderLeftBar(classes)}
        <main
          className={classes.content}
          ref={this.mainContent}
        >
          {this.toolComponents}
        </main>
        {editBar}
      </div>
    );
  }
}
export default withStyles(toolStyle)(Controls);

