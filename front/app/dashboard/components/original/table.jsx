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
            <div style={{display:'inline-block'}}>
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
            <div style={{display:'inline-block'}}>
              <Button
                disabled={row.status !== 'analyzed'}
                classes={{ root: classes.tableActionButton }}
                onClick={() => this.props.extractorFormShow(row.id)}
              >
                <Unarchive fontSize="small" />
              </Button>
            </div>
          </Tooltip>
        </div>
      );
      return {
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
            Size (MB)
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="file_type" dataSort={true}>
            FileType
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="status" dataSort={true}>
            Status
          </TableHeaderColumn>
          <TableHeaderColumn width="15%" dataField="actions" dataFormat={actionFormatter}>
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
