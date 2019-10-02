import React from 'react';
import ReactDOM from 'react-dom';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

class History extends React.Component {
  // history

  constructor(props) {
    super(props);
    this.annotation = null;
    this._controls = props.controls;
    this.tmpHist = null;
    this.state = {
      undoHistory: [],
      redoHistory: []
    };
    props.getRef(this);
  }
  init(annotation) {
    this.annotation = annotation;
  }
  hasUndo() {
    return this.state.undoHistory.length > 0;
  }
  hasRedo() {
    return this.state.redoHistory.length > 0;
  }
  ANTI_TYPES = {
    'change': 'change',
    'create': 'delete',
    'delete': 'create',
  };
  createAntiHist(hist) {
    const label = this.annotation.getLabel(hist.id);
    const ret = {
      type: this.ANTI_TYPES[hist.type],
      id: hist.id
    };
    if (hist.type == 'change') {
      ret.obj = label.toHistory();
    } else if (hist.type === 'create') {
      ret.obj = hist.obj
    } else if (hist.type === 'delete') {
      ret.obj = hist.obj
    } else {
      // error
    }
    return ret;
  }
  undoHist(hist) {
    if (hist.type === 'change') {
      const label = this.annotation.getLabel(hist.id);
      label.fromHistory(hist.obj);
      this._controls.selectLabel(label);
    } else if (hist.type === 'create') {
      this.annotation.removeFromHistory(hist.id);
    } else if (hist.type === 'delete') {
      const label = this.annotation.createFromHistory(hist.id, hist.obj);
      this._controls.selectLabel(label);
    } else {
      // error
    }
  }
  undo() {
    if (!this.hasUndo()) {
      return;
    }
    const undoHist = this.state.undoHistory.slice();
    const redoHist = this.state.redoHistory.slice();
    const hist = undoHist.pop();
    const redo = this.createAntiHist(hist);
    this.undoHist(hist);
    redoHist.push(redo);
    this.setState({
      undoHistory: undoHist,
      redoHistory: redoHist
    });
  }
  redo() {
    if (!this.hasRedo()) {
      return;
    }
    const undoHist = this.state.undoHistory.slice();
    const redoHist = this.state.redoHistory.slice();
    const hist = redoHist.pop();
    const undo = this.createAntiHist(hist);
    this.undoHist(hist);
    undoHist.push(undo);
    this.setState({
      undoHistory: undoHist,
      redoHistory: redoHist
    });
  }
  resetHistory() {
    this.setState({
      undoHistory: [],
      redoHistory: []
    });
  }
  createHistory(label, type) {
    this.tmpHist = {
      type: type,
      obj: label.toHistory(),
      id: label.id
    };
  }
  addHistory(label, type) {
    const undoHist = this.state.undoHistory.slice();
    const redoHist = [];
    let hist;
    if (label == null) {
      hist = this.tmpHist;
    } else {
      hist = {
        type: type,
        obj: label.toHistory(),
        id: label.id
      };
    }
    undoHist.push(hist);
    this.tmpHist = null;
    this.setState({
      undoHistory: undoHist,
      redoHistory: redoHist
    });
  }

  render() {
    return (
      <Grid item xs={12}>
        <Button disabled={!this.hasUndo()} onClick={() => this.undo()}>Undo</Button>
        <Button disabled={!this.hasRedo()} onClick={() => this.redo()}>Redo</Button>
      </Grid>
    );
  }
}
export default History;

