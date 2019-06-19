import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { TableHeaderColumn } from 'react-bootstrap-table';
import Typography from '@material-ui/core/Typography';

import ResizableTable from 'automan/dashboard/components/parts/resizable_table';
import { mainStyle } from 'automan/assets/main-style';

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
      query: RequestClient.createPageQuery()
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
      function(res) {
        that.setState({
          total_count: res.count,
          data: res.records,
          is_loading: false
        });
      },
      function(mes) {
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
  handleArchive(row) {
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
              original_id: datasetInfo.original_id,
              dataset_id: row.dataset_id,
              annotation_id: row.id
            }
          };
        RequestClient.post(
          url,
          data,
          res => {},
          mes => {
            this.setState({
              error: mes.message
            });
          }
        );
      },
      mes => {
        this.setState({
          error: mes.message
        });
      }
    );
  }
  render() {
    // if ( this.state.error ) {
    //     return (
    //         <div> {this.state.error} </div>
    //     );
    // }

    const { classes } = this.props;
    let rows = [];
    if (!this.state.is_loading) {
      rows = this.state.data.map(
        function(row, index) {
          let actions;
          if (
            row.archive_url != null && // TODO: tmp check
            row.archive_url.length > 0
          ) {
            actions = (
              <div className="text-center">
                <span>
                  <a
                    className="button glyphicon glyphicon-folder-close"
                    onClick={e => this.handleArchive(row)}
                    title="Archive"
                  />
                  <a
                    className="button glyphicon glyphicon-download-alt"
                    onClick={()=>{
                      RequestClient.getBinaryAsURL(row.archive_url, (url) => {
                        let a = document.createElement('a');
                        a.download = row.file_name;
                        a.href = url;
                        a.click();
                      }, () => {});
                    }}
                    title="Download"
                  />
                </span>
              </div>
            );
          } else {
            actions = (
              <div className="text-center">
                <span>
                  <a
                    className="button glyphicon glyphicon-folder-close"
                    onClick={e => this.handleArchive(row)}
                    title="Archive"
                  />
                </span>
              </div>
            );
          }
          return {
            index: index,
            id: row.id,
            name: row.name,
            dataset_id: row.dataset_id,
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
          <TableHeaderColumn width="10%" dataField="actions" dataFormat={actionFormatter}>
            Actions
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
  withStyles(mainStyle, { name: 'AnnotationTable' }),
  connect(
    mapStateToProps,
    null
  )
)(AnnotationTable);
