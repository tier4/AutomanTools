import React from 'react';
import ReactDOM from 'react-dom';

import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setHistory } from './actions/tool_action';

class History extends React.Component {
  // history
  constructor(props) {
    super(props);
    this.tmpHist = null;
    this.state = {
      undoHistory: [],
      redoHistory: []
    };
    props.dispatchSetHistory(this);
  }
  init() {
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
        const label = this.props.annotation.getLabel(obj.id);
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
        const label = this.props.annotation.getLabel(obj.id);
        label.fromHistory(obj);
      }
      this.props.controls.selectLabel(hist.objects[0].id);
    } else if (hist.type === 'create') {
      this.props.annotation.removeFromHistory(hist.objects);
    } else if (hist.type === 'delete') {
      const labels = this.props.annotation.createFromHistory(hist.objects);
      this.props.controls.selectLabel(labels[0]);
    } else {
      // error
    }
  }
  undo() {
    if (!this.hasUndo()) {
      return;
    }
    this.setState(state => {
      const undoHist = state.undoHistory.slice();
      const redoHist = state.redoHistory.slice();
      const hist = undoHist.pop();
      const redo = this.createAntiHist(hist);
      this.undoHist(hist);
      redoHist.push(redo);
      return {
        undoHistory: undoHist,
        redoHistory: redoHist
      };
    });
  }
  redo() {
    if (!this.hasRedo()) {
      return;
    }
    this.setState(state => {
      const undoHist = state.undoHistory.slice();
      const redoHist = state.redoHistory.slice();
      const hist = redoHist.pop();
      const undo = this.createAntiHist(hist);
      this.undoHist(hist);
      undoHist.push(undo);
      return {
        undoHistory: undoHist,
        redoHistory: redoHist
      };
    });
  }
  resetHistory() {
    this.setState({
      undoHistory: [],
      redoHistory: []
    });
  }
  createHistory(labels, type, hist) {
    const histObjs = labels.map(label => label.toHistory());
    if (this.tmpHist !== null && hist === this.tmpHist) {
      if (type === this.tmpHist.type) {
        this.tmpHist.objects = this.tmpHist.objects.concat(histObjs);
        return this.tmpHist;
      }
    }
    const newHist = {
      type: type,
      objects: histObjs,
      addHistory: () => {
        if (this.tmpHist === newHist) {
          this.addHistory(null);
        }
      }
    };
    return this.tmpHist = newHist;
  }
  addHistory(labels, type) {
    let hist;
    if (labels == null) {
      if (this.tmpHist === null) {
        // TODO: error
        return;
      }
      hist = {
        type: this.tmpHist.type,
        objects: this.tmpHist.objects
      };
    } else {
      if (labels.length == 0) {
        return;
      }
      hist = {
        type: type,
        objects: labels.map(label => label.toHistory())
      };
    }
    this.tmpHist = null;
    this.setState(state => {
      const undoHist = state.undoHistory.slice();
      const redoHist = [];
      undoHist.push(hist);
      return {
        undoHistory: undoHist,
        redoHistory: redoHist
      };
    });
  }

  render() {
    return (
      <Grid item xs={12}>
        <Tooltip title="Undo">
          <span>
            <Button disabled={!this.hasUndo()} onClick={() => this.undo()}>
              <UndoIcon />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <Button disabled={!this.hasRedo()} onClick={() => this.redo()}>
              <RedoIcon />
            </Button>
          </span>
        </Tooltip>
      </Grid>
    );
  }
}
const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  controls: state.tool.controls,
  annotation: state.tool.annotation,
});
const mapDispatchToProps = dispatch => ({
  dispatchSetHistory: target => dispatch(setHistory(target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(History);

