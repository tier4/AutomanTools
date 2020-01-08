import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';
//import projectReducer from 'automan/dashboard/reducers/projectReducer';

function actionFormatter(cell, row) {
  return row.actions;
}

class ProjectTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      is_loading: false,
      total_count: 0,
      data: [],
      query: RequestClient.createPageQuery()
    };
  }
  componentDidMount = () => {
    this.updateData();
  };
  componentDidUpdate = () => {
    if (this.props.needUpdate) {
      this.props.handleUpdate();
      this.updateData();
    }
  }
  updateData = () => {
    this.setState({ data: [], is_loading: true, error: null });

    RequestClient.get(
      '/projects/',
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
  };
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
  handleClick = row => {
    this.props.history.push('/' + row.id + '/home/');
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
          <Tooltip title="Delete">
            <div style={{ display: 'inline-block' }}>
              <Button
                classes={{ root: classes.tableActionButton }}
                onClick={() => this.props.deleteProject(row.id)}
                disabled={!row.can_delete}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </div>
          </Tooltip>
        </div>
      );
      return {
        description: row.description,
        id: row.id,
        name: row.name,
        labelType: row.label_type,
        createdAt: row.created_at.slice(0, 19),
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
    options.onRowClick = (row, colIndex, rowIndex) => {
      if (colIndex <= 3) {
        this.handleClick(row);
      }
    };
    const fetchProp = {
      dataTotalSize: this.state.total_count
    };
    return (
      <div className={classes.tableWrapper}>
        <Typography variant="h6" id="tableTitle">
          Projects
        </Typography>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
          remote={true}
          fetchInfo={fetchProp}
        >
          <TableHeaderColumn width="20%" dataField="name" isKey dataSort={true}>
            Project Name
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="description" dataSort={true}>
            Description
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="labelType">
            Label Type
          </TableHeaderColumn>
          <TableHeaderColumn width="20%" dataField="createdAt">
            Created At
          </TableHeaderColumn>
          <TableHeaderColumn width="15%" dataField="actions" dataFormat={actionFormatter}>
          </TableHeaderColumn>
        </ResizableTable>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    projects: state.projectReducer.projects
  };
};
export default withRouter(
  compose(
    withStyles(mainStyle, { name: 'ProjectTable' }),
    connect(
      mapStateToProps,
      null
    )
  )(ProjectTable)
);
