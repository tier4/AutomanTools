import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Archive from '@material-ui/icons/Archive';
import CloudDownload from '@material-ui/icons/CloudDownload';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LinearProgress from "@material-ui/core/LinearProgress";

import ArchiveDialog from "./archive_dialog";

function progressFormatter(cell, row) {
  return row.progress;
}
function actionFormatter(cell, row) {
  return row.actions;
}

class AnnotationTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      data: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(),
      snackbar: false,
      open: false,
      row_id: null,
      row_name: '',
      archive_row: null,
    };
  }
  show = () => {
    this.setState({ snackbar: true });
  };
  hide = () => {
    this.setState({ snackbar: false });
  };
  handleDialogOpen = row => {
    this.setState({
      open: true,
      row_id: row.id,
      row_name: row.name
    });
  };
  handleOK = () => {
    this.setState({ open: false });
    this.props.deleteAnnotation(this.state.row_id);
  };
  handleCancel = () => {
    this.setState({ open: false });
  };
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
  updatePage = () => {
    if (!this.props.currentProject) {
      return;
    }
    let that = this;
    this.setState({ data: [], is_loading: true, error: null });

    let url = '/projects/' + this.props.currentProject.id + '/annotations/';
    RequestClient.get(
      url,
      this.state.query.getData(),
      function (res) {
        that.setState({
          total_count: res.count,
          data: res.records,
          is_loading: false
        });
      },
      function (mes) {
        that.setState({
          is_loading: false,
          error: mes.message
        });
      }
    );
  };
  handleClick(index) {
    this.props.onClickAnnotation(this.state.data[index].id);
  }
  handleArchiveClose() {
    this.setState({archive_row: null});
  }
  handleArchiveOpen(row) {
    this.setState({archive_row: row});
  }
  handleArchive(opt) {
    const row = this.state.archive_row;
    const datasetUrl =
      `/projects/${this.props.currentProject.id}` +
      `/datasets/${row.dataset_id}/`;
    RequestClient.get(
      datasetUrl,
      null,
      datasetInfo => {
        const url = `/projects/${this.props.currentProject.id}/jobs/`,
          data = {
            job_type: 'ARCHIVER',
            job_config: {
              include_image: opt.include_image_flag,
              original_id: datasetInfo.original_id,
              dataset_id: row.dataset_id,
              annotation_id: row.id
            }
          };
        RequestClient.post(
          url,
          data,
          res => {
            this.handleArchiveClose();
            this.show();
          },
          mes => {
            this.setState({
              archive_row: null,
              error: mes.message
            });
          }
        );
      },
      mes => {
        this.setState({
          archive_row: null,
          error: mes.message
        });
      }
    );
  }
  render() {
    if (this.state.error) {
      return (
        <div> {this.state.error} </div>
      );
    }

    const { classes } = this.props;
    const BorderLinearProgress = withStyles({
      root: {
        height: 10,
      },
    })(LinearProgress);
    let rows = [];
    if (!this.state.is_loading) {
      rows = this.state.data.map(
        function (row, index) {
          let actions, progress;
          if (
            row.archive_url != null && // TODO: tmp check
            row.archive_url.length > 0
          ) {
            actions = (
              <div className="text-center">
                <Tooltip title="Archive">
                  <Button
                    classes={{ root: classes.tableActionButton }}
                    onClick={e => this.handleArchiveOpen(row)}
                    className={classes.button}>
                    <Archive fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Download">
                  <Button
                    classes={{ root: classes.tableActionButton }}
                    onClick={() => RequestClient.get(
                      row.archive_url,
                      null,
                      res => {
                        RequestClient.getBinaryAsURL(res, (url) => {
                          let a = document.createElement('a');
                          a.download = row.file_name;
                          a.href = url;
                          a.click();
                        }, () => { });
                      },
                      e => {
                        reject(e);
                      }
                    )}
                    className={classes.button}>
                    <CloudDownload fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Delete">
                  <div style={{ display: 'inline-block' }}>
                    <Button
                      classes={{ root: classes.tableActionButton }}
                      onClick={() => this.handleDialogOpen(row)}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </div>
                </Tooltip>
              </div>
            );
          } else {
            actions = (
              <div className="text-center">
                <span>
                  <Tooltip title="Archive">
                    <Button
                      classes={{ root: classes.tableActionButton }}
                      onClick={e => this.handleArchiveOpen(row)}
                      className={classes.button}
                      color={row.progress == 100 ? "primary" : "default"}>
                      <Archive fontSize="small" />
                    </Button>
                  </Tooltip>
                  <Button
                    disabled
                    classes={{ root: classes.tableActionButton }}
                    className={classes.button}>
                    <CloudDownload fontSize="small" />
                  </Button>
                  <Tooltip title="Delete">
                    <div style={{ display: 'inline-block' }}>
                      <Button
                        classes={{ root: classes.tableActionButton }}
                        onClick={() => this.handleDialogOpen(row)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </div>
                  </Tooltip>
                </span>
              </div>
            );
          }
          progress = (
            <div>
              <BorderLinearProgress
                classes={{ root: classes.tableProgress }}
                className={classes.margin}
                variant="determinate"
                value={row.progress}
              />
              <Typography
                classes={{ root: classes.tableProgressStr }}
                variant="body2"
                align="right"
              >
                {row.status} - {row.progress}%
              </Typography>
            </div>);
          return {
            index: index,
            id: row.id,
            name: row.name,
            dataset_id: row.dataset_id,
            progress: progress,
            actions: actions
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
    options.onRowClick = (row, colIndex, rowIndex) => {
      if (colIndex === 3 || colIndex == null) {
        return; // skip 'actions'
      }
      this.handleClick(rowIndex);
    };
    const fetchProp = {
      dataTotalSize: this.state.total_count
    };

    return (
      <div className={classes.tableWrapper}>
        <Typography variant="h6" id="tableTitle">
          Annotations
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
          <TableHeaderColumn width="" dataField="name" dataSort={true}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn width="10%" dataField="dataset_id">
            Dataset ID
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="progress" dataFormat={progressFormatter}>
            Progress
          </TableHeaderColumn>
          <TableHeaderColumn width="25%" dataField="actions" dataFormat={actionFormatter}>
          </TableHeaderColumn>
        </ResizableTable>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.snackbar}
          autoHideDuration={5000}
          onClose={this.hide}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">Archiver job is submitted.</span>}
          action={[
            <IconButton
              key="close"
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={this.hide}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Delete Annotation"}</DialogTitle>
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
        <ArchiveDialog
          open={this.state.archive_row !== null}
          onClose={() => this.handleArchiveClose()}
          onArchive={opt => this.handleArchive(opt)}
        />
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
  withStyles(mainStyle, { name: 'AnnotationTable' }),
  connect(
    mapStateToProps,
    null
  )
)(AnnotationTable);
