import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

class Group extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      data: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(),
      isMemberTableOpen: false
    };
  }
  componentDidMount() {
    this.updatePage();
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.currentProject == null ||
      this.props.currentProject.id !== prevProps.currentProject.id
    ) {
      this.updatePage();
    }
  }
  handleSearchChange = txt => {
    const query = this.state.query;
    if (txt === query.getSearch()) {
      return;
    }
    query.setSearch(txt);
    query.setPage(1);
    this.updatePage();
  };
  handlePageChange = (page, perPage) => {
    const query = this.state.query;
    if (page === query.getPage() && perPage === query.getPerPage()) {
      return;
    }
    query.setPage(page);
    query.setPerPage(perPage);
    this.updatePage();
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
    this.updatePage();
  };
  updatePage = query => {
    if (!this.props.currentProject) {
      return;
    }
    let that = this;

    this.setState({ data: [], is_loading: true, error: null });

    let url = '/projects/' + this.props.currentProject.id + '/groups/';
    RequestClient.get(
      url,
      this.state.query.getData(),
      function(res) {
        that.setState({
          total_count: res.count,
          data: res.records,
          is_loading: false
        });
      },
      function(mes) {
        that.setState({ error: mes.message });
      }
    );
  };
  render() {
    let rows;
    if (!this.state.is_loading) {
      rows = this.state.data.map(
        function(row, index) {
          return {
            index: index,
            id: row.id,
            name: row.name
          };
        }.bind(this)
      );
    }
    const options = {
      sizePerPageList: [
        {
          text: '10',
          value: 10
        },
        {
          text: '20',
          value: 20
        },
        {
          text: '30',
          value: 30
        }
      ],
      sizePerPage: this.state.query.getPerPage(),
      page: this.state.query.getPage(),
      noDataText: this.state.is_loading ? <div>Loading</div> : undefined,
      onPageChange: this.handlePageChange,
      onSortChange: this.handleSortChange,
      onSearchChange: this.handleSearchChange,
      clearSearch: true,
      searchDelayTime: 1000
    };
    return (
      <div>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
        >
          <TableHeaderColumn width="10%" dataField="id" isKey dataSort={true}>
            ID
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="name" dataSort={true}>
            Name
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
  withStyles(mainStyle, { name: 'Group' }),
  connect(
    mapStateToProps,
    null
  )
)(Group);
