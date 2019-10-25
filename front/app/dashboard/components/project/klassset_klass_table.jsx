import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { TableHeaderColumn } from 'react-bootstrap-table';
import { TwitterPicker } from 'react-color';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

function actionFormatter(cell, row) {
  return row.actions;
}

class KlasssetKlassTable extends React.Component {
  constructor(props) {
    super(props);
    this.refInputName = React.createRef();
  }
  getLabelType() {
    return this.props.currentProject
      ? this.props.currentProject.label_type : this.props.labelType;
  }
  getIndex(obj, arr) {
    for (let i = 0; i < arr.length; i++) {
      let not_match = false;
      for (let prop of Object.keys(obj)) {
        if (arr[i][prop] !== obj[prop]) {
          not_match = true;
          break;
        }
      }
      if (!not_match) {
        return i;
      }
    }
    return -1;
  }
  handleClickRm = name => {
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    let index = this.getIndex(
      name,
      clonedKlasses.map(x => {
        return x.name;
      })
    );
    clonedKlasses.splice(index, 1);
    this.props.handleKlassesChange(clonedKlasses);
  };
  handleOpenColorPicker(e, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    clonedKlasses[index].displayColorPicker = true;
    this.props.handleKlassesChange(clonedKlasses);
  }
  handleCloseColorPicker(e, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    clonedKlasses[index].displayColorPicker = false;
    this.props.handleKlassesChange(clonedKlasses);
  }
  handleChangeComplete(color, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    clonedKlasses[index].color = color.hex;
    this.props.handleKlassesChange(clonedKlasses);
  }
  formatCellColor(cell, row) {
    return row.colorPicker;
  }
  formatCellMinSize(cell, row) {
    return row.minSize;
  }
  formatMinSizeAxis(klass, index, axis, editable) {
    if (editable) {
      return (
        <input
          type="number"
          style={{ width: '50px' }}
          value={klass.minSize[axis]}
          onChange={e => this.changeMinSize(e, index, axis)}
        />
      );
    } else {
      return (
        <input
          type="number"
          style={{ width: '50px' }}
          defaultValue={klass.minSize[axis]}
          readOnly
        />
      );
    }
  }
  formatMinSize(klass, index, editable) {
    const labelType = this.getLabelType();
    if (labelType === 'BB2D') {
      return (
        <div className="klass-min-size">
          x{' '}{this.formatMinSizeAxis(klass, index, 'x', editable)}
          , y{' '}{this.formatMinSizeAxis(klass, index, 'y', editable)}
        </div>
      );
    } else if (labelType === 'BB2D3D') {
      return (
        <div className="klass-min-size">
          x{' '}{this.formatMinSizeAxis(klass, index, 'x', editable)}
          , y{' '}{this.formatMinSizeAxis(klass, index, 'y', editable)}
          , z{' '}{this.formatMinSizeAxis(klass, index, 'z', editable)}
        </div>
      );
    }
  }
  changeMinSize(e, index, axis) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    clonedKlasses[index].minSize[axis] = e.target.value;
    this.props.handleKlassesChange(clonedKlasses);
  }
  handleClickAdd = () => {
    let name = this.refInputName.current.value;
    // TODO: Name Validation
    this.refInputName.current.value = '';
    let sameNameKlasses = this.props.klasses.filter(function (klass) {
      return klass.name == name;
    });
    let targetKlass = {};
    if (sameNameKlasses.length > 0) {
      alert('Already registered.');
      return;
    } else {
      targetKlass.name = name;
    }
    const defaultColors = TwitterPicker.defaultProps.colors;
    const labelType = this.getLabelType();
    const defaultMinSize =
      labelType === 'BB2D' ? { x: 10, y: 10 } :
        labelType === 'BB2D3D' ? { x: 10, y: 10, z: 10 } :
          {};
    const idx = this.props.klasses.length;
    targetKlass.color = defaultColors[idx % defaultColors.length];
    targetKlass.minSize = defaultMinSize;
    let clonedKlasses = JSON.parse(JSON.stringify(this.props.klasses));
    clonedKlasses.push(targetKlass);
    this.props.handleKlassesChange(clonedKlasses);
  };
  render() {
    let { klasses, readOnly } = this.props;
    const { classes } = this.props;
    if (!readOnly) {
      klasses = this.props.klasses;
    }
    let rows = klasses.map(
      (klass, index) => {
        let actions, colorPicker, minSize;
        if (!readOnly) {
          actions = (
            <center>
              <span>
                <a
                  className="button glyphicon glyphicon-trash"
                  onClick={this.handleClickRm.bind(this, klass.name)}
                />
              </span>
            </center>
          );
          colorPicker = (
            <div>
              <div
                onClick={e => this.handleOpenColorPicker(e, index)}
                className="color-pane"
                style={{ backgroundColor: klass.color }}
              />
              {klass.displayColorPicker ? (
                <div className="color-picker-pop">
                  <div
                    className="color-picker-cover"
                    onClick={e => this.handleCloseColorPicker(e, index)}
                  />
                  <TwitterPicker
                    color={klass.color}
                    onChangeComplete={e => this.handleChangeComplete(e, index)}
                  />
                </div>
              ) : null}
            </div>
          );
          minSize = this.formatMinSize(klass, index, true);
        } else {
          actions = <div />;
          const config = JSON.parse(klass.config);
          colorPicker = (
            <div
              className="color-pane"
              style={{ backgroundColor: config.color }}
            />
          );
          minSize = this.formatMinSize(config, index, false);
        }
        return {
          name: klass.name,
          parent_id: klass.parent_id,
          colorPicker: colorPicker,
          minSize: minSize,
          actions: actions
        };
      }
    );
    const options = {
      sizePerPageList: [
        {
          text: '5',
          value: 5
        },
        {
          text: '10',
          value: 10
        }
      ],
      sizePerPage: 5
    };
    let table;
    if (readOnly) {
      table = (
        <ResizableTable data={rows} pagination={true} options={options}>
          <TableHeaderColumn
            dataSort={true}
            dataField="name"
            isKey
            ediatble={false}
          >
            Class Name
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="colorPicker"
            editable={false}
            dataFormat={this.formatCellColor}
            width="15%"
          >
            Label Color
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="minSize"
            editable={false}
            dataFormat={this.formatCellMinSize}
            dataSort={true}
            width="50%"
          >
            Label Min Size
          </TableHeaderColumn>
        </ResizableTable>
      );
    } else {
      table = (
        <ResizableTable data={rows} pagination={true} options={options}>
          <TableHeaderColumn
            dataSort={true}
            dataField="name"
            isKey
            ediatble={false}
          >
            Class Name
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="colorPicker"
            editable={false}
            dataFormat={this.formatCellColor}
            width="15%"
          >
            Label Color
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="minSize"
            editable={false}
            dataFormat={this.formatCellMinSize}
            dataSort={true}
            width="50%"
          >
            Label Min Size
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="actions"
            editable={false}
            dataFormat={actionFormatter}
            width="10%"
          >
            Actions
          </TableHeaderColumn>
        </ResizableTable>
      );
    }

    let addKlassForm = <div />;
    if (!readOnly) {
      addKlassForm = (
        <form
          id="validate"
          role="form"
          className="form-horizontal group-border stripped"
        >
          <div className="form-group">
            <label className="col-xs-6 control-label">Class Name</label>
            <div className="col-xs-3">
              <input
                ref={this.refInputName}
                type="text"
                className="form-control"
                placeholder=""
              />
            </div>
              <Fab
                color="primary"
                size="small"
                onClick={this.handleClickAdd}
              >
                <AddIcon />
              </Fab>
          </div>
        </form>
      );
    }

    return (
      <div>
        <div>{addKlassForm}</div>
        <div>{table}</div>
      </div>
    );
  }
}

KlasssetKlassTable.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'KlasssetKlassTable' }),
  connect(
    mapStateToProps,
    null
  )
)(KlasssetKlassTable);
