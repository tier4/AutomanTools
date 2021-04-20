import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import DeleteIcon from '@material-ui/icons/Delete';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';

function actionFormatter(cell, row) {
  return row.actions;
}

class DatasetTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      data: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(true),
      open: false,
      row_id: null,
      row_name: ''
    };
  }
  componentDidMount() {
    this.updatePage();
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.currentProject == null ||
      this.props.currentProject.id !== prevProps.currentProject.id ||
      this.props.needUpdate
    ) {
      this.props.handleUpdate();
      this.updatePage();
    }
  }
  handleClickOpen = row => {
    this.setState({
      open: true,
      row_id: row.id,
      row_name: row.name
    });
  };
  handleOK = () => {
    this.setState({ open: false });
    this.props.deleteDataset(this.state.row_id);
  };
  handleCancel = () => {
    this.setState({ open: false });
  };
  handleSearchURL = url => {
    this.props.historyPush(url);
  };
  handleSearchChange(txt) {
    const query = this.state.query;
    if (txt === query.getSearch()) {
      return;
    }
    let url = "q=" + txt;
    //this.handleSearchURL(url);
    this.props.historyPush(url);
    query.setSearch(txt);
    query.setPage(1);
    this.updatePage();
  }
  handlePageChange(page, perPage) {
    const query = this.state.query;
    if (page === query.getPage() && perPage === query.getPerPage()) {
      return;
    }
    query.setPage(page);
    query.setPerPage(perPage);
    this.updatePage();
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
    this.updatePage();
  }
  updatePage() {
    if (!this.props.currentProject) {
      return;
    }
    this.setState({ data: [], is_loading: true, error: null });

    RequestClient.get(
      '/projects/' + this.props.currentProject.id + '/datasets/',
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
      rows = this.state.data.map((row, index) => {
        let actions = ''
        actions = (
          <div className="text-center">
            <Tooltip title="Create annotation">
              <div style={{ display: 'inline-block' }}>
                <Button
                  classes={{ root: classes.tableActionButton }}
                  onClick={() => this.props.show(row.id)}
                >
                  <CreateNewFolderIcon fontSize="small" />
                </Button>
              </div>
            </Tooltip>
            <Tooltip title="Delete">
              <div style={{ display: 'inline-block' }}>
                <Button
                  classes={{ root: classes.tableActionButton }}
                  onClick={() => this.handleClickOpen(row)}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              </div>
            </Tooltip>
          </div>
        );
        return {
          id: row.id,
          name: row.name,
          original_name: row.original_name,
          frame_count: row.frame_count >= 1 ? row.frame_count : null,
          actions: actions
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
    this.state.query.assignTableOptions(options);
    const fetchProp = {
      dataTotalSize: this.state.total_count
    };

    return (
      <div className={classes.tableWrapper}>
        <Typography variant="h6" id="tableTitle">
          Datasets
        </Typography>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
          remote={true}
          fetchInfo={fetchProp}
        >
          <TableHeaderColumn dataField="id" width="10%" isKey dataSort={true}>
            #
          </TableHeaderColumn>
          <TableHeaderColumn dataField="name" width="" dataSort={true}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn dataField="original_name" width="" dataSort={true}>
            Raw Name
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="frame_count"
            width="20%"
            dataSort={true}
          >
            Frame count
          </TableHeaderColumn>
          <TableHeaderColumn width="15%" dataField="actions" dataFormat={actionFormatter}>
          </TableHeaderColumn>
        </ResizableTable>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Delete dataset?"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Name: {this.state.row_name}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCancel} color="primary">
              Canncel
            </Button>
            <Button onClick={this.handleOK} color="primary" autoFocus>
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
    withStyles(mainStyle, { name: 'DatasetTable' }),
    connect(
      mapStateToProps,
      null
    )
  )(DatasetTable);

