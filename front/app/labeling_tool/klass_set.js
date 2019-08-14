import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

//import List from '@material-ui/core/List';
//import ListItem from '@material-ui/core/ListItem';
//import ListItemIcon from '@material-ui/core/ListItemIcon';
//import ListItemText from '@material-ui/core/ListItemText';
//import ListSubheader from '@material-ui/core/ListSubheader';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import classNames from 'classnames';

const KlassTab = withStyles(theme => ({
  root: {
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    '&$selected': {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    }
  }
}))(props => <Tab {...props}/>);

class KlassSet extends React.Component {
  _labelTool = null;
  _controls = null;
  // data
  _klasses = new Map();
  _klassList = [];
  // DOM
  _nextId = 0;

  constructor(props) {
    super(props);
    this._labelTool = props.labelTool;
    this._controls = props.controls;
    this.state = {
      targetKlass: null,
      targetIndex: -1
    };
    props.getRef(this);
  }
  init() {
    return new Promise((resolve, reject) => {
      let klassset = this._labelTool.getProjectInfo().klassset;

      klassset.records.forEach((klass) => {
        let config = JSON.parse(klass.config);
        let klassObj = new Klass(
          this,
          this._nextId++,
          klass.name,
          config.color,
          new THREE.Vector2(config.minSize.x, config.minSize.y)
        );
        this._klasses.set(klass.name, klassObj);
        this._klassList[klassObj.id] = klassObj;
      });
      // select default target class

      this.setState({
        /*
        targetKlass: this._klasses.get(
          klassset.records[0].name
        )
        */
        targetIndex: 0
      });
      resolve();
    });
  }
  getByName(name) {
    if (typeof name != 'string') {
      Controls.error(
        'KlassSet get by name error: name is not string "' + name + '"'
      );
      return;
    }
    return this._klasses.get(name);
  }
  getTarget() {
    //return this.state.targetKlass;
    return this._klassList[this.state.targetIndex];
  }
  setTarget(tgt) {
    let next = this._getKlass(tgt),
        prev = this.getTarget();
    if (next.id === prev.id) {
      return prev;
    }
    //this.setState({targetKlass: next});
    this.setState({targetIndex: next.id});
    // DOM change
    return next;
  }
  _getKlass(kls) {
    if (kls instanceof Klass) {
      return kls;
    } else if (typeof(kls) === 'string') {
      return this._klasses.get(kls) || null;
    }
    return null;
  }
  /*
  renderList(classes) {
    let list = [];
    for (let [_, klass] of this._klasses) {
      const isSelected = klass === this.state.targetKlass;
      list.push(
        <ListItem
          key={klass.id}
          className={classNames(classes.listItem, isSelected && classes.selectedListItem)}
          onClick={() => this._controls.selectKlass(klass)}
          button
        >
          <div
            className={classes.colorPane}
            style={{ backgroundColor: klass.color }}
          />
          <ListItemText primary={klass.name} />
        </ListItem>
      );
    }
    return list;
  }
  */
  renderTabs(classes) {
    let list = [];
    for (let klass of this._klassList) {
      const isSelected = klass.id === this.state.targetIndex;
      list.push(
        <KlassTab
          key={klass.id}
          icon={(
            <div>
              <div
                className={classes.colorPane}
                style={{ backgroundColor: klass.color }}
              />
              {klass.name}
            </div>
          )}
        />
      );
    }
    return list;
  }
  handleTabChange = (e, newVal) => {
    this._controls.selectKlass(this._klassList[newVal]);
    this.setState({ targetIndex: newVal });
  };
  render() {
    const classes = this.props.classes;
    return (
      <Tabs
        value={this.state.targetIndex}
        onChange={this.handleTabChange}
      >
        {this.renderTabs(classes)}
      </Tabs>
    );
    /*
    return (
      <List
        className={classes.list}
        subheader={
          <ListSubheader
            className={classes.listHead}
          >
            Class Set
          </ListSubheader>
        }
      >
        {this.renderList(classes)}
      </List>
    );
    */
  }
};
export default KlassSet;

class Klass {
  constructor(klassSet, id, name, color, size) {
    this.klassSet = klassSet;
    this.id = id;
    this.name = name;
    this.color = color;
    this.minSize = size;
  }
  getName() {
    return this.name;
  }
  getColor() {
    return this.color;
  }
  getMinSize() {
    return this.minSize;
  }
}
