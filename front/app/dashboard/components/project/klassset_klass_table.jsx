import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
//import ReactDOM from 'react-dom';
import { TableHeaderColumn } from 'react-bootstrap-table';
import { TwitterPicker } from 'react-color';
import Button from '@material-ui/core/Button';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

function actionFormatter(cell, row) {
  return row.actions;
}

class KlasssetKlassTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      klasses: []
    };
    this.refInputName = React.createRef();
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
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    let index = this.getIndex(
      name,
      clonedKlasses.map(x => {
        return x.name;
      })
    );
    clonedKlasses.splice(index, 1);
    this.setState({ klasses: clonedKlasses });
  };
  handleOpenColorPicker(e, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    clonedKlasses[index].displayColorPicker = true;
    this.setState({ klasses: clonedKlasses });
  }
  handleCloseColorPicker(e, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    clonedKlasses[index].displayColorPicker = false;
    this.setState({ klasses: clonedKlasses });
  }
  handleChangeComplete(color, index) {
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    clonedKlasses[index].color = color.hex;
    this.setState({ klasses: clonedKlasses });
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
    const labelType = this.props.currentProject.label_type;
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
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    clonedKlasses[index].minSize[axis] = e.target.value;
    this.setState({ klasses: clonedKlasses });
  }
  handleClickAdd = () => {
    let name = this.refInputName.current.value;
    // TODO: Name Validation
    this.refInputName.current.value = '';
    let sameNameKlasses = this.state.klasses.filter(function(klass) {
      return klass.name == name;
    });
    let targetKlass = {};
    if (sameNameKlasses.length > 0) {
      alert('Already registered.');
    } else {
      targetKlass.name = name;
    }
    const defaultColors = TwitterPicker.defaultProps.colors;
    const labelType = this.props.currentProject.label_type;
    const defaultMinSize = 
      labelType === 'BB2D' ? { x: 10, y: 10 } :
      labelType === 'BB2D3D' ? { x: 10, y: 10, z: 10 } :
      {};
    const idx = this.state.klasses.length;
    targetKlass.color = defaultColors[idx % defaultColors.length];
    targetKlass.minSize = defaultMinSize;
    let clonedKlasses = JSON.parse(JSON.stringify(this.state.klasses));
    clonedKlasses.push(targetKlass);
    this.setState({ klasses: clonedKlasses });
  };
  handleSubmit = () => {
    this.setState({ error_string: '' });
    const data = { klasses: this.state.klasses };
    RequestClient.post(
      '/projects/' + this.props.currentProject.id + '/klassset/',
      data,
      info => {
        this.props.handleCloseDialog();
      },
      e => {
        // TODO: display error infomation
        console.log('ERROR', e);
      }
    );
  };
  render() {
    let { klasses, readOnly } = this.props;
    const { classes } = this.props;
    if (!readOnly) {
      klasses = this.state.klasses;
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
    let submitButton = <div />;
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
            <button
              onClick={this.handleClickAdd}
              type="button"
              className="btn btn-xs size-30x30-blue"
            >
              <i className="glyphicon glyphicon-plus color-white" />
            </button>
          </div>
        </form>
      );
      submitButton = (
        <Button
          variant="contained"
          color="primary"
          onClick={this.handleSubmit}
          className={classes.button}
        >
          Submit
        </Button>
      );
    }

    return (
      <div>
        <div>{addKlassForm}</div>
        <div>{table}</div>
        <div>{submitButton}</div>
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
