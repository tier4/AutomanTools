import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Snackbar from '@material-ui/core/Snackbar';
import FindInPage from '@material-ui/icons/FindInPage';
import Unarchive from '@material-ui/icons/Unarchive';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';
import DeleteIcon from '@material-ui/icons/Delete';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Badge from '@material-ui/core/Badge';


function actionFormatter(cell, row) {
  return row.actions;
}

class OriginalTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      total_count: 0,
      data: [],
      error: null,
      query: RequestClient.createPageQuery(true),
      open: false,
      row_id: null,
      row_name: ''
    };
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
    this.props.deleteOrig(this.state.row_id)
  };
  handleCancel = () => {
    this.setState({ open: false });
  };
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
  updateData(query) {
    if (!this.props.currentProject) {
      return;
    }
    this.setState({ data: [], error: null });
    let url = '/projects/' + this.props.currentProject.id + '/originals/';
    RequestClient.get(
      url,
      this.state.query.getData(),
      (res) => {
        this.setState({
          total_count: res.count,
          data: res.records
        });
      },
      (mes) => {
        this.setState({ error: mes.message });
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
    rows = this.state.data.map((row, index) => {
      let actions = ''
      actions = (
        <div className="text-center">
          <Tooltip title="Analyze">
            <div style={{ display: 'inline-block' }}>
              <Button
                disabled={row.status !== 'uploaded'}
                classes={{ root: classes.tableActionButton }}
                onClick={() => this.props.analyzerSubmit(row.id)}
              >
                <FindInPage fontSize="small" />
              </Button>
            </div>
          </Tooltip>
          <Tooltip title="Extract">
            <div style={{ display: 'inline-block' }}>
              <Button
                disabled={row.status !== 'analyzed'}
                classes={{ root: classes.tableActionButton }}
                onClick={() => this.props.extractorFormShow(row.id)}
              >
                <Badge badgeContent={row.dataset_cnt} color="primary">
                  <Unarchive fontSize="small" />
                </Badge>
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
        index: index,
        name: row.name,
        size: Math.round(row.size / (1024 * 1024) * 10) / 10,
        file_type: row.file_type,
        status: row.status,
        actions: actions
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
    this.state.query.assignTableOptions(options);
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
          <TableHeaderColumn width="5%" dataField="id" isKey dataSort={true}>
            #
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="name" dataSort={true}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn width="10%" dataField="size" dataSort={true}>
            Size (MB)
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="file_type" dataSort={true}>
            FileType
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="status" dataSort={true}>
            Status
          </TableHeaderColumn>
          <TableHeaderColumn width="25%" dataField="actions" dataFormat={actionFormatter}>
          </TableHeaderColumn>
        </ResizableTable>
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.props.formOpen}
          autoHideDuration={5000}
          onClose={this.props.hide}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">Analyzer job is submitted.</span>}
          action={[
            <IconButton
              key="close"
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={this.props.hide}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.props.extractorSnackbar}
          autoHideDuration={5000}
          onClose={this.props.hide}
          ContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">Extractor job is submitted.</span>}
          action={[
            <IconButton
              key="close"
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={this.props.hide}
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
          <DialogTitle id="alert-dialog-title">{"Delete raw data?"}</DialogTitle>
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
  withStyles(mainStyle, { name: 'OriginalTable' }),
  connect(
    mapStateToProps,
    null
  )
)(OriginalTable);
