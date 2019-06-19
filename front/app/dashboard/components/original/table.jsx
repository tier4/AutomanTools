import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';

class OriginalTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      total_count: 0,
      data: [],
      error: null,
      query: RequestClient.createPageQuery()
    };
  }
  componentDidMount() {
    this.updateData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.currentProject == null ||
      this.props.currentProject.id !== prevProps.currentProject.id
    ) {
      this.updateData();
    }
  }
  updateData(query) {
    if (!this.props.currentProject) {
      return;
    }
    let that = this;
    this.setState({ data: [], error: null });
    let url = '/projects/' + this.props.currentProject.id + '/originals/';
    RequestClient.get(
      url,
      this.state.query.getData(),
      function(res) {
        that.setState({
          total_count: res.count,
          data: res.records
        });
      },
      function(mes) {
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
  render() {
    if (this.state.error) {
      return <div> {this.state.error} </div>;
    }
    const { classes } = this.props;
    let rows = [];
    rows = this.state.data.map(
      function(row, index) {
        return {
          index: index,
          name: row.name,
          size: row.size,
          file_type: row.file_type,
          status: row.status
        };
      }.bind(this)
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
          Raws
        </Typography>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
          remote={true}
          fetchInfo={fetchProp}
        >
          <TableHeaderColumn width="" dataField="name" isKey dataSort={true}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn width="10%" dataField="size" dataSort={true}>
            Size
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="file_type" dataSort={true}>
            FileType
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="status" dataSort={true}>
            Status
          </TableHeaderColumn>
        </ResizableTable>
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
  withStyles(mainStyle, { name: 'OriginalTable' }),
  connect(
    mapStateToProps,
    null
  )
)(OriginalTable);
