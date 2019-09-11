import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
//import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import AssignmentLate from '@material-ui/icons/AssignmentLate';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { JOB_STATUS_MAP } from 'automan/services/const';

function statusFormatter(cell, row) {
  return row.status;
}

function logFormatter(cell, row) {
  return row.log;
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
      query: RequestClient.createPageQuery(),
      open: false,
      anchorEl: null,
    };
    this.state.query.setSortRevFlag(true);
    this.handlePopoverOpen = this.handlePopoverOpen.bind(this);
    this.handlePopoverClose = this.handlePopoverClose.bind(this);
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
  handlePopoverOpen(event, jobId) {
    this.setState({
      popoverId: jobId,
      anchorEl: event.currentTarget,
    });
  }
  handlePopoverClose() {
    this.setState({
      popoverId: null,
      anchorEl: null,
    });
  }
  render() {
    if (this.state.error) {
      return <div> {this.state.error} </div>;
    }

    const { classes } = this.props;
    const { anchorEl, popoverId } = this.state;
    let rows;
    if (!this.state.is_loading) {
      rows = this.state.data.map((job, index) => {
        let log = '';
        if (
          job.pod_log != null &&
          job.pod_log.length > 0
        ){
          log = (
            <div className="text-center">
                <Button className={classes.button}
                  classes={{
                    root: classes.tableActionIcon,
                  }}
                  aria-owns={open ? 'mouse-over-popover' : undefined}
                  aria-haspopup="true"
                  onMouseEnter={(e) => this.handlePopoverOpen(e, job.id)}
                  onMouseLeave={this.handlePopoverClose}>
                    <AssignmentLate fontSize="small"/>
                    <Popover
                      id="mouse-over-popover"
                      className={classes.popover}
                      classes={{
                        paper: classes.paper,
                      }}
                      open={popoverId===job.id}
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      onClose={this.handlePopoverClose}
                      disableRestoreFocus
                    >
                      <Typography variant="body1"
                        classes={{
                          root: classes.popoverText,
                        }}
                      >
                        {job.pod_log}
                      </Typography>
                    </Popover>
                </Button>
            </div>
          );
        }
        return {
          id: job.id,
          job_type: job.job_type,
          status: (
            <span className={classes[JOB_STATUS_MAP[job.status]['className']]}>
              {job.status}
            </span>
          ),
          started_at: job.started_at,
          completed_at: job.completed_at,
          log: log
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
          <TableHeaderColumn width="15%" dataField="job_type" dataSort={true}>
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
          <TableHeaderColumn width="5%" dataField="log" dataFormat={logFormatter}>
            Log
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
