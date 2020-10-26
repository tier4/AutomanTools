import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { compose } from 'redux';
import { connect } from 'react-redux';

import classNames from 'classnames';

import { setKlassSet } from './actions/tool_action';

const KlassTab = withStyles(theme => ({
  root: {
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  }
}))(props => <Tab {...props}/>);

const klassSetStyle = {
  klasssetArea: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 5
  },
  klasssetTitle: {
    position: 'absolute',
    height: 20,
    top: -2,
    padding: 3,
    color: 'black',
    background: 'rgba(255,255,255,0.5)',
    borderRadius: 5
  },
  klassTab: {
    display: 'flex',
    marginTop: 8,
  },
  colorPane: {
    width: 18,
    height: 18,
    borderRadius: 2,
    border: 'solid 1px #fff',
    marginRight: 3,
  },
  klassName: {
    height: 17,
    paddingTop: 1,
  },
};

class KlassSet extends React.Component {
  // data
  _klasses = new Map();
  _klassList = [];
  // DOM
  _nextId = 0;

  constructor(props) {
    super(props);
    this.state = {
      targetKlass: null,
      targetIndex: -1
    };
    props.dispatchSetKlassSet(this);
  }
  init() {
    return new Promise((resolve, reject) => {
      let klassset = this.props.labelTool.getProjectInfo().klassset;

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
  renderTabs(classes) {
    let list = [];
    for (let klass of this._klassList) {
      const isSelected = klass.id === this.state.targetIndex;
      list.push(
        <KlassTab
          key={klass.id}
          label={(
            <div className={classes.klassTab}>
              <div
                className={classes.colorPane}
                style={{ backgroundColor: klass.color }}
              />
              <div
                className={classes.klassName}
              >
                {klass.name}
              </div>
            </div>
          )}
        />
      );
    }
    return list;
  }
  handleTabChange = (e, newVal) => {
    this.props.controls.selectKlass(this._klassList[newVal]);
    this.setState({ targetIndex: newVal });
  };
  render() {
    const classes = this.props.classes;
    return (
      <div>
        <div className={classes.klasssetArea}>
          <div className={classes.klasssetTitle}>
            Class Set
          </div>
          <Tabs
            value={this.state.targetIndex}
            onChange={this.handleTabChange}
          >
            {this.renderTabs(classes)}
          </Tabs>
        </div>
      </div>
    );
  }
};
const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  controls: state.tool.controls,
});
const mapDispatchToProps = dispatch => ({
  dispatchSetKlassSet: target => dispatch(setKlassSet(target))
});
export default compose(
  withStyles(klassSetStyle),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(KlassSet);

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
