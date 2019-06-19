import React from 'react';
import { BootstrapTable } from 'react-bootstrap-table';

document.addEventListener('click', mouseClickHandler, true);
document.addEventListener('mouseup', mouseUpHandler, true);
document.addEventListener('mousemove', mouseMoveHandler, true);

let mouseState = null;
function mouseClickHandler(e) {
  if (mouseState === null) {
    return;
  }
  mouseState = null;
  e.preventDefault();
  e.stopPropagation();
}
function mouseUpHandler(e) {
  if (mouseState === null) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
}
function mouseMoveHandler(e) {
  if (mouseState === null) {
    return;
  }
  let x = e.clientX;
  let widths = mouseState.table.state.col_widths.slice();
  let diff = (x - mouseState.x) * mouseState.scale;
  let width = mouseState.w + diff;
  let rwidth = mouseState.rw - diff;
  if (width < 5) {
    if (width + rwidth >= 10) {
      width = 5;
      rwidth = mouseState.rw + mouseState.w - 5;
    }
  } else if (rwidth < 5) {
    rwidth = 5;
    width = mouseState.rw + mouseState.w - 5;
  }
  widths[mouseState.index] = width;
  widths[mouseState.index + 1] = rwidth;
  mouseState.table.setState({ col_widths: widths });
  e.preventDefault();
  e.stopPropagation();
}
function mouseDownHandler(index, e) {
  if (e.button !== 0) {
    return;
  }
  let widths = this.state.col_widths;
  mouseState = {
    index: index,
    x: e.clientX,
    w: widths[index],
    rw: widths[index + 1],
    scale: 100 / e.target.parentNode.parentNode.parentNode.clientWidth,
    table: this
  };
  e.preventDefault();
  e.stopPropagation();
}

export default class ResizableTable extends React.Component {
  constructor(props) {
    super(props);
    let col_widths = [];
    let sum = 0,
      nullCount = 0;
    let children = Array.isArray(this.props.children)
      ? this.props.children
      : [this.props.children];
    children.forEach(function(child, index) {
      let width = parseInt(child.props.width);
      if (!isFinite(width)) {
        width = null;
        nullCount++;
      } else {
        sum += width;
      }
      col_widths.push(width);
    });
    let v = (100 - sum) / nullCount;
    for (let i = 0; i < col_widths.length; ++i) {
      if (col_widths[i] === null) {
        col_widths[i] = v;
      }
    }

    this.state = { col_widths: col_widths };
  }
  render() {
    let that = this;
    let rows = this.props.data;
    let selectRowProp = this.props.selectRow;
    let cellEditProp = this.props.cellEdit;
    let options = this.props.options;
    let fetchProp = this.props.fetchInfo;
    let search = this.props.search;
    let pagination = this.props.pagination;
    let remote = this.props.remote;
    let headers = React.Children.map(this.props.children, function(
      child,
      index
    ) {
      let isRightEnd = index === that.props.children.length - 1;
      let resizer = isRightEnd ? null : (
        <div
          className="resizer"
          onMouseDown={mouseDownHandler.bind(that, index)}
        />
      );
      let wrapper = (
        <span>
          {child.props.children}
          {resizer}
        </span>
      );
      let newProp = {
        children: wrapper,
        width: isRightEnd ? null : that.state.col_widths[index] + '%'
      };
      return React.cloneElement(child, newProp);
    });
    return (
      <BootstrapTable
        data={rows}
        search={search}
        selectRow={selectRowProp}
        pagination={pagination}
        cellEdit={cellEditProp}
        options={options}
        remote={remote}
        fetchInfo={fetchProp}
        tableBodyClass="resizable-table"
        tableHeaderClass="resizable-table"
      >
        {headers}
      </BootstrapTable>
    );
  }
}
