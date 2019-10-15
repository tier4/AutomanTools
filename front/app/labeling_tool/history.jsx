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
    const ret = {
      type: this.ANTI_TYPES[hist.type],
    };
    if (hist.type == 'change') {
      ret.objects = hist.objects.map(obj => {
        const label = this.annotation.getLabel(obj.id);
        return label.toHistory();
      });
    } else if (hist.type === 'create') {
      ret.objects = hist.objects;
    } else if (hist.type === 'delete') {
      ret.objects = hist.objects;
    } else {
      // error
    }
    return ret;
  }
  undoHist(hist) {
    if (hist.type === 'change') {
      for (let obj of hist.objects) {
        const label = this.annotation.getLabel(obj.id);
        label.fromHistory(obj);
      }
      this._controls.selectLabel(hist.objects[0].id);
    } else if (hist.type === 'create') {
      this.annotation.removeFromHistory(hist.objects);
    } else if (hist.type === 'delete') {
      const labels = this.annotation.createFromHistory(hist.objects);
      this._controls.selectLabel(labels[0]);
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
  createHistory(labels, type) {
    this.tmpHist = {
      type: type,
      objects: labels.map(label => label.toHistory())
    };
  }
  addHistory(labels, type) {
    const undoHist = this.state.undoHistory.slice();
    const redoHist = [];
    let hist;
    if (labels == null) {
      hist = this.tmpHist;
    } else {
      if (labels.length == 0) {
        return;
      }
      hist = {
        type: type,
        objects: labels.map(label => label.toHistory())
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

