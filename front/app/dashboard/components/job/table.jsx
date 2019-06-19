import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
//import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { JOB_STATUS_MAP } from 'automan/services/const';

function statusFormatter(cell, row) {
  return row.status;
}

class JobTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      data: [],
      is_loading: true,
      error: null,
      target: this.props.target,
      level: 0,
      click_disable: false,
      query: RequestClient.createPageQuery()
    };
    this.state.query.setSortRevFlag(true);
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
  handleSearchChange(txt) {
    const query = this.state.query;
    if (txt === query.getSearch()) {
      return;
    }
    query.setSearch(txt);
    query.setPage(1);
    this.updateData();
  }
  handlePageChange(page, perPage) {
    const query = this.state.query;
    if (page === query.getPage() && perPage === query.getPerPage()) {
      return;
    }
    query.setPage(page);
    query.setPerPage(perPage);
    this.updateData();
  }
  handleSortChange(sortName, sortOrder) {
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
  }
  updateData() {
    if (!this.props.currentProject) {
      return;
    }
    this.setState({ data: [], is_loading: true, error: null });

    let url = `/projects/${this.props.currentProject.id}/jobs/`;
    RequestClient.get(
      url,
      this.state.query.getData(),
      res => {
        // TODO: reinit this.query's page and per_page.
        this.setState({
          total_count: res.count,
          data: res.records,
          is_loading: false
        });
      },
      mes => {
        this.setState({ error: mes.message });
      }
    );
  }
  render() {
    if (this.state.error) {
      return <div> {this.state.error} </div>;
    }

    const { classes } = this.props;
    let rows;
    if (!this.state.is_loading) {
      rows = this.state.data.map((job, index) => {
        return {
          id: job.id,
          job_type: job.job_type,
          status: (
            <span className={classes[JOB_STATUS_MAP[job.status]['className']]}>
              {job.status}
            </span>
          ),
          started_at: job.started_at,
          completed_at: job.completed_at
        };
      });
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
      onPageChange: (page, perPage) => this.handlePageChange(page, perPage),
      onSortChange: (name, order) => this.handleSortChange(name, order),
      onSearchChange: txt => this.handleSearchChange(txt),
      clearSearch: true,
      searchDelayTime: 1000
    };
    options.onRowClick = (row, colIndex, rowIndex) => {};
    const fetchProp = {
      dataTotalSize: this.state.total_count
    };

    return (
      <div className={classes.tableWrapper}>
        <Typography variant="h6" id="tableTitle">
          Jobs
        </Typography>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
          remote={true}
          fetchInfo={fetchProp}
        >
          <TableHeaderColumn width="5%" dataField="id" isKey dataSort={true}>
            #
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="job_type" dataSort={true}>
            Type
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="status" dataFormat={statusFormatter} dataSort={true}>
            Status
          </TableHeaderColumn>
          <TableHeaderColumn width="25%" dataField="started_at" dataSort={true}>
            Start Time
          </TableHeaderColumn>
          <TableHeaderColumn width="25%" dataField="completed_at" dataSort={true}>
            Completion Time
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
  withStyles(mainStyle, { name: 'JobTable' }),
  connect(
    mapStateToProps,
    null
  )
)(JobTable);
