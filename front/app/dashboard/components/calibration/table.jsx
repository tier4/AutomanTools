import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';

function nameFormatter(cell, row) {
  return row.name;
}
function valueFormatter(cell, row) {
  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {row.value}
    </div>
  );
}
const locale = navigator.locale;
const dateOption = { timeZoneName: 'short' };
function preTimeFormatter(arr, name) {
  for (let it of arr) {
    it[name] = new Date(it[name]).toLocaleString(locale, dateOption);
  }
}

class CalibrationTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      total_count: 0,
      data: [],
      error: null,
      query: RequestClient.createPageQuery(),
      desc_open: false,
      desc: {}
    };
  }
  componentDidMount() {
    this.updateData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.currentProject == null ||
      this.props.currentProject.id !== prevProps.currentProject.id ||
      this.props.needUpdate
    ) {
      this.props.handleUpdate();
      this.updateData();
    }
  }
  updateData() {
    if (!this.props.currentProject) {
      return;
    }
    let that = this;
    this.setState({ data: [], error: null });
    let url = '/projects/' + this.props.currentProject.id + '/calibrations/';
    RequestClient.get(
      url,
      this.state.query.getData(),
      function (res) {
        preTimeFormatter(res.records, 'created_at');
        that.setState({
          total_count: res.count,
          data: res.records
        });
      },
      function (mes) {
        that.setState({ error: mes.message });
      }
    );
  }
  handleSearchChange = txt => {
    const query = this.state.query;
    if (txt === query.getSearch()) {
      return;
    }
    query.setSearch(txt);
    query.setPage(1);
    this.updateData();
  };
  handlePageChange = (page, perPage) => {
    const query = this.state.query;
    if (page === query.getPage() && perPage === query.getPerPage()) {
      return;
    }
    query.setPage(page);
    query.setPerPage(perPage);
    this.updateData();
  };
  handleSortChange = (sortName, sortOrder) => {
    const query = this.state.query;
    const sortRevFlag = sortOrder === 'desc';
    if (
      sortName === query.getSortKey() &&
      sortRevFlag === query.getSortRevFlag()
    ) {
      return;
    }
    query.setSortKey(sortName);
    query.setSortRevFlag(sortRevFlag);
    this.updateData();
  };
  handleDescOpen = (row) => {
    let desc = [];
    let desc_dict = JSON.parse(row.content);
    let rows = [];
    for (let k of Object.keys(desc_dict)) {
      let row = [];
      row['key'] = k;
      row['value'] = '';
      desc_dict[k].forEach((v) => {
        row['value'] += '[' + v.toString().replace(/,/g, ', ') + ']\n';
      });
      rows.push(row);
    }
    desc['rows'] = rows;
    desc['name'] = row.name;
    this.setState({
      desc_open: true,
      desc: desc,
    });
  };
  handleClose = () => {
    this.setState({ desc_open: false });
  };
  render() {
    if (this.state.error) {
      return <div> {this.state.error} </div>;
    }
    const { classes } = this.props;
    let rows = [];
    rows = this.state.data.map((row, index) => {
      let name = (
        <Button
          variant="text"
          color="primary"
          onClick={() => this.handleDescOpen(row)}
          classes={{ root: classes.tableActionButton, }}
        >
          {row.name}
        </Button>
      );
      return {
        index: index,
        id: row.id,
        name: name,
        created_at: row.created_at
      };
    });
    const options = {
      sizePerPageList: [
        {
          text: '5',
          value: 5
        },
        {
          text: '10',
          value: 10
        },
        {
          text: '20',
          value: 20
        }
      ],
      sizePerPage: this.state.query.getPerPage(),
      page: this.state.query.getPage(),
      onPageChange: this.handlePageChange,
      onSortChange: this.handleSortChange,
      onSearchChange: this.handleSearchChange,
      clearSearch: true,
      searchDelayTime: 1000
    };
    const fetchProp = {
      dataTotalSize: this.state.total_count
    };
    return (
      <div className={classes.tableWrapper}>
        <Typography variant="h6" id="tableTitle">
          Calibrations
        </Typography>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
          remote={true}
          fetchInfo={fetchProp}
        >
          <TableHeaderColumn width="10%" dataField="id" isKey dataSort={true}>
            ID
          </TableHeaderColumn>
          <TableHeaderColumn width="30%" dataField="name" dataSort={true} dataFormat={nameFormatter}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="created_at" dataSort={true}>
            Create Time
          </TableHeaderColumn>
        </ResizableTable>
        <Dialog
          open={this.state.desc_open}
          onClose={this.handleClose}
          maxWidth="md"
          aria-labelledby="job-dialog-title"
          aria-describedby="job-dialog-description"
        >
          <DialogTitle id="job-dialog-title">
            {"Calibiration Content : " + this.state.desc['name']}
          </DialogTitle>
          <DialogContent>
            <ResizableTable data={this.state.desc['rows']} >
              <TableHeaderColumn width="20%" dataField="key" isKey>
                Key
              </TableHeaderColumn>
              <TableHeaderColumn dataField="value" dataFormat={valueFormatter}>
                Value
              </TableHeaderColumn>
            </ResizableTable>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'CalibrationTable' }),
  connect(
    mapStateToProps,
    null
  )
)(CalibrationTable);
