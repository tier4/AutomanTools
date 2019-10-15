import React from 'react';
import ReactDOM from 'react-dom';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';

import classNames from 'classnames';

import RequestClient from 'automan/services/request-client';

class Annotation extends React.Component {
  _labelTool = null;
  _controls = null;
  _klassSet = null;
  // data
  _deleted = null;
  _targetLabel = null;
  // status
  _loaded = true;
  _nextId = -1;

  constructor(props) {
    super(props);
    this._labelTool = props.labelTool;
    this._controls = props.controls;
    this.state = {
      labels: null
    };
    props.getRef(this);
  }
  init(klassSet, history) {
    this._klassSet = klassSet;
    this._history = history;
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  isLoaded() {
    return this._loaded;
  }
  load(frameNumber) {
    this._removeAll();
    this._nextId = -1;
    this._history.resetHistory();
    return new Promise((resolve, reject) => {
      this._deleted = [];

      RequestClient.get(
        this._labelTool.getURL('frame_labels', frameNumber),
        null,
        res => {
          const labels = new Map();
          res.records.forEach(obj => {
            let klass = this._klassSet.getByName(obj.name);
            let bboxes = {};
            this._controls.getTools().forEach(tool => {
              const id = tool.candidateId;
              if (obj.content[id] != null) {
                bboxes[id] = tool.createBBox(obj.content[id]);
              }
            });
            let label = new Label(this, obj.object_id, klass, bboxes);
            labels.set(label.id, label);
          });
          this.setState({ labels });
        },
        err => {
          reject(err);
        }
      );

      resolve();
      this._loaded = true;
    });
  }
  isChanged() {
    if (this.state.labels == null) {
      return false;
    }
    if (this._deleted.length > 0) {
      return true;
    }
    let changedFlag = false;
    this.state.labels.forEach(label => {
      changedFlag = changedFlag || label.isChanged;
    });
    return changedFlag;
  }
  save() {
    if (!this.isChanged()) {
      return Promise.resolve();
    }
    const created = [];
    const edited = [];
    const deleted = this._deleted;
    this._deleted = [];
    this.state.labels.forEach(label => {
      if (label.id < 0) {
        created.push(label.toObject());
      } else if (label.isChanged) {
        edited.push(label.toObject());
      }
    });
    return new Promise((resolve, reject) => {
      const data = {
        created: created,
        edited: edited,
        deleted: deleted
      };
      RequestClient.post(
        this._labelTool.getURL('frame_labels', this._controls.getFrameNumber()),
        data,
        () => {
          resolve();
        },
        e => {
          reject('Annotation save error: ' + e);
        }
      );
    });
  }
  getTarget() {
    return this._targetLabel;
  }
  setTarget(tgt) {
    let next = this.getLabel(tgt),
      prev = this._targetLabel;
    if (prev != null && next != null && next.id === prev.id) {
      return prev;
    }
    if (prev != null) {
      prev.setTarget(false);
    }
    if (next != null) {
      next.setTarget(true);
    }
    this._targetLabel = next;
    // table dom events
    this._controls.getTools().forEach(tool => {
      tool.updateTarget(prev, next);
    });
    return next;
  }
  create(klass, bbox) {
    if (klass == null) {
      let txt = 'Label create error: Error Class "' + klass + '"';
      this._controls.error(txt);
      return null;
    }
    const label = new Label(this, this._nextId--, klass, bbox);
    const labels = new Map(this.state.labels);
    labels.set(label.id, label);
    this._history.addHistory([label], 'create');
    this.setState({ labels });
    return label;
  }
  changeKlass(id, klass) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label change Class error: Error selector "' + id + '"';
      this._controls.error(txt);
      return;
    }
    if (klass == null) {
      let txt = 'Label change Class error: Error Class "' + klass + '"';
      this._controls.error(txt);
      return;
    }
    label.setKlass(klass);
    this._controls.getTools().forEach(tool => {
      tool.updateBBox(label);
    });
  }
  attachBBox(id, candidateId, bbox) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label add BBox error: Error selector "' + id + '"';
      this._controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      let txt = `Label add BBox error: this BBox is already attached in "${id}"`;
      this._controls.error(txt);
      return;
    }
    label.bbox[candidateId] = bbox;
    //label.tableItem.addClass('has-image-bbox');
  }
  removeBBox(id, candidateId) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label remove BBox error: Error selector "' + id + '"';
      this._controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      const tool = this._controls.getToolFromCandidateId(candidateId);
      tool.disposeBBox(label.bbox[candidateId]);
      label.bbox[candidateId] = null;
      //label.tableItem.addClass('has-image-bbox');
    }
  }
  remove(id) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label remove error: Error selector "' + id + '"';
      this._controls.error(txt);
      return;
    }

    this._history.addHistory([label], 'delete');

    this._controls.getTools().forEach(tool => {
      if (label.bbox[tool.candidateId] != null) {
        tool.disposeBBox(label.bbox[tool.candidateId]);
      }
    });
    const tgt = this._targetLabel;
    if (tgt != null && label.id === tgt.id) {
      this._targetLabel = null;
      tgt.setTarget(false);
      this._controls.getTools().forEach(tool => {
        tool.updateTarget(tgt, null);
      });
    }
    if (label.id >= 0) {
      this._deleted.push(label.id);
    }

    const labels = new Map(this.state.labels);
    labels.delete(label.id);
    this.setState({ labels });
    label.dispose();
  }
  getLabel(label) {
    if (label instanceof Label) {
      return label;
    } else if (typeof label === 'number') {
      return this.state.labels.get(label) || null;
    }
    return null;
  }
  // methods to history
  createHistory(label) {
    this._history.createHistory([label], 'change');
  }
  addHistory() {
    this._history.addHistory(null);
  }
  createFromHistory(objects) {
    const labels = new Map(this.state.labels);
    let labelList = [];
    for (let obj of  objects) {
      let bboxes = {};
      this._controls.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (obj.content[id] != null) {
          bboxes[id] = tool.createBBox(obj.content[id]);
        }
      });
      let label = new Label(this, obj.id, obj.klass, bboxes);
      labels.set(label.id, label);
      if (label.id >= 0) {
        this._deleted = this._deleted.filter(id => id != label.id);
      }
      labelList.push(label);
    }
    this.setState({ labels });
    return labelList;
  }
  removeFromHistory(objects) {
    const tools = this._controls.getTools();
    const tgt = this._targetLabel;
    const labels = new Map(this.state.labels);
    for (let obj of objects) {
      let label = this.getLabel(obj.id);

      tools.forEach(tool => {
        if (label.bbox[tool.candidateId] != null) {
          tool.disposeBBox(label.bbox[tool.candidateId]);
        }
      });
      if (tgt != null && label.id === tgt.id) {
        this._targetLabel = null;
        tgt.setTarget(false);
        this._controls.getTools().forEach(tool => {
          tool.updateTarget(tgt, null);
        });
      }
      if (label.id >= 0) {
        this._deleted.push(label.id);
      }

      labels.delete(label.id);
      label.dispose();
    }
    this.setState({ labels });
  }
  // methods to clipboard
  copyLabels(isAll) {
    let target = [];
    if (isAll) {
      target = Array.from(this.state.labels.values());
    } else if (this._targetLabel != null) {
      target = [this._targetLabel];
    }
    return target.map(label => label.toObject());
  }
  pasteLabels(data) {
    const labels = new Map(this.state.labels);
    let pastedLabels = [];
    data.forEach(obj => {
      let klass = this._klassSet.getByName(obj.name);
      let bboxes = {};
      this._controls.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (obj.content[id] != null) {
          bboxes[id] = tool.createBBox(obj.content[id]);
        }
      });
      let label = new Label(this, this._nextId--, klass, bboxes);
      labels.set(label.id, label);
      pastedLabels.push(label);
    });
    this._history.addHistory(pastedLabels, 'create');
    this.setState({ labels });
  }

  // private
  _removeAll() {
    this._controls.selectLabel(null);
    if (this.state.labels == null) {
      return;
    }
    this._loaded = false;

    this.state.labels.forEach(label => {
      this._controls.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (label.bbox[id] != null) {
          tool.disposeBBox(label.bbox[id]);
        }
      });
      label.dispose();
    });
    this._targetLabel = null;
    this.setState({labels: null});
  }
  renderList(classes) {
    if (this.state.labels === null) {
      return [];
    }
    let list = [];
    for (let [_, label] of this.state.labels) {
      list.push(
        <LabelItem
          key={label.id}
          classes={classes}
          controls={this._controls}
          label={label}
        />
      );
    }
    return list;
  }
  render() {
    const classes = this.props.classes;
    return (
      <List
        className={classes.list}
        subheader={
          <ListSubheader
            className={classes.listHead}
          >
            Bounding Box
          </ListSubheader>
        }
      >
        {this.renderList(classes)}
      </List>
    );
  }
}
export default Annotation;

class LabelItem extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.controls = props.controls;
    const label = props.label;
    label.setLabelItem(this);
    this.state = {
      color: label.getColor(),
      isTarget: label.isTarget
    };
    this.label = label;
  }
  updateKlass() {
    this.setState({ color: this.label.getColor() });
  }
  updateTarget() {
    this.setState({ isTarget: this.label.isTarget });
  }
  render() {
    const classes = this.props.classes;
    const label = this.label;
    return (
      <ListItem
        key={label.id}
        className={classNames(classes.listItem, this.state.isTarget && classes.selectedListItem)}
        onClick={() => this.controls.selectLabel(label)}
        button
      >
        <div
          className={classes.colorPane}
          style={{ backgroundColor: this.state.color }}
        />
        <ListItemText primary={label.toString()} />
      </ListItem>
    );
  }
}
class Label {
  _annotationTool = null;
  _listItem = null;
  id = 0;
  isChanged = false;
  isTarget = false;
  klass = null;
  minSize = null;
  bbox = null;

  constructor(annotationTool, id, klass, bbox) {
    this._annotationTool = annotationTool;
    this.id = id;
    this.isChanged = this.id < 0;
    this.isTarget = false;
    this.klass = klass;
    this.minSize = klass.getMinSize();
    this.bbox = {};

    this._annotationTool._controls.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (bbox[id] == null) {
        this.bbox[id] = null;
      } else {
        this.bbox[id] = bbox[id];
        this.bbox[id].setLabel(this);
      }
    });
  }
  addBBox(name) {
    // how to change state?
  }
  dispose() {
  }
  setLabelItem(labelItem) {
    this.labelItem = labelItem;
  }
  createHistory() {
    this._annotationTool.createHistory(this);
  }
  addHistory() {
    this._annotationTool.addHistory();
  }

  setKlass(klass) {
    this.klass = klass;
    this.isChanged = true;
    this.minSize = this.klass.getMinSize();
    Object.keys(this.bbox).forEach(id => {
      const bbox = this.bbox[id];
      if (bbox == null) {
        return;
      }
      bbox.updateKlass();
    });
    if (this.labelItem != null) {
      this.labelItem.updateKlass();
    }
  }
  setTarget(val) {
    this.isTarget = val;
    if (this.labelItem != null) {
      this.labelItem.updateTarget();
    }
  }
  toIDString() {
    if (this.id < 0) {
      return '#___';
    }
    return `#${this.id}`;
  }
  toString() {
    return this.toIDString() + ` ${this.getKlassName()}`;
  }
  has(candidateId) {
    return this.bbox[candidateId] != null;
  }
  getColor() {
    return this.klass.getColor();
  }
  getKlassName() {
    return this.klass.getName();
  }
  getMinSize() {
    return this.minSize;
  }
  toObject() {
    const ret = {
      name: this.klass.getName(),
      content: {}
    };
    if (this.id >= 0) {
      ret.object_id = this.id;
    }
    this._annotationTool._controls.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (!this.has(id)) {
        return;
      }
      const content = {};
      this.bbox[id].toContent(content);
      ret.content[id] = content;
    });
    return ret;
  }
  toHistory() {
    const ret = {
      id: this.id,
      klass: this.klass,
      content: {}
    };
    this._annotationTool._controls.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (!this.has(id)) {
        return;
      }
      const content = {};
      this.bbox[id].toContent(content);
      ret.content[id] = content;
    });
    return ret;
  }
  fromHistory(obj) {
    if (this.id !== obj.id) {
      throw new Error('history id error');
    }
    this.klass = obj.klass;
    this._annotationTool._controls.getTools().forEach(tool => {
      const id = tool.candidateId;
      const content = obj.content[id];
      if (content == null) {
        return;
      }
      this.bbox[id].fromContent(content);
      this.bbox[id].updateParam();
    });
  }
}
