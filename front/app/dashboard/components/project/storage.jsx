import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { TableHeaderColumn } from 'react-bootstrap-table';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Add from '@material-ui/icons/Add';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import StorageForm from 'automan/dashboard/components/project/storage_form';

class Storage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      data: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(true),
      isMemberTableOpen: false,
      formOpen: false
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
  handleClickOpenForm = () => {
    this.setState({ formOpen: true });
  };
  handleClickHideForm = () => {
    this.setState({ formOpen: false });
  };
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

    let url = `/projects/${this.props.currentProject.id}/storages/`;
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
        that.setState({
          is_loading: true,
          error: mes.message
        });
      }
    );
  };
  render() {
    const { classes } = this.props;
    let rows;
    if (!this.state.is_loading) {
      rows = this.state.data.map(
        function(row, index) {
          return {
            index: index,
            id: row.id,
            storage_type: row.storage_type,
            storage_config: row.storage_config
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
        <StorageForm
          formOpen={this.state.formOpen}
          handleClickHideForm={this.handleClickHideForm}
        />
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
        >
          <TableHeaderColumn width="10%" dataField="id" isKey dataSort={true}>
            ID
          </TableHeaderColumn>
          <TableHeaderColumn width="30%" dataField="storage_type" dataSort={true}>
            Storage Type
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="storage_config" dataSort={true}>
            Storage Config
          </TableHeaderColumn>
        </ResizableTable>
        <Fab
          color="primary"
          aria-label="Add"
          className={classes.fab}
          onClick={this.handleClickOpenForm}
        >
          <Add />
        </Fab>
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
  withStyles(mainStyle, { name: 'Storage' }),
  connect(
    mapStateToProps,
    null
  )
)(Storage);
