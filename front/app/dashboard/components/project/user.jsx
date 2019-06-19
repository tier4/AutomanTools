import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { TableHeaderColumn } from 'react-bootstrap-table';
import { withStyles } from '@material-ui/core/styles';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Fab from '@material-ui/core/Fab';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Add from '@material-ui/icons/Add';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';

import { mainStyle } from 'automan/assets/main-style';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      members: [],
      is_loading: true,
      error: null,
      formOpen: false,
      query: RequestClient.createPageQuery(),
      groups: [],
      invitationGroup: null,
      invitationUsername: null
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
  handleClickPlus = () => {
    const that = this;
    let url = `/projects/${this.props.currentProject.id}/groups/`;
    RequestClient.get(
      url,
      null,
      function(res) {
        that.setState({
          total_count: res.count,
          groups: res.records,
          is_loading: false
        });
      },
      function(mes) {
        that.setState({ error: mes.message });
      }
    );
    this.setState({ formOpen: true });
  };
  hide = () => {
    this.setState({ formOpen: false });
  };
  handleTextFieldChange = event => {
    this.setState({ [event.target.id]: event.target.value });
  };
  handleChangeGroup = event => {
    this.setState({ [event.target.name]: event.target.value });
  };
  handleSubmit = () => {
    const that = this;
    const data = {
      username: that.state.invitationUsername,
      group_id: this.state.invitationGroup
    };
    //const group_id = that.state.invitationGroup;
    let url = `/projects/${that.props.currentProject.id}/members/`;
    RequestClient.post(
      url,
      data,
      function(res) {
        that.setState({
          formOpen: false
        });
      },
      function(mes) {
        that.setState({ error: mes.message });
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

    let url = `/projects/${this.props.currentProject.id}/members/`;
    RequestClient.get(
      url,
      this.state.query.getData(),
      function(res) {
        that.setState({
          total_count: res.count,
          members: res.records,
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
    let rows;
    if (!this.state.is_loading) {
      rows = this.state.members.map((row, index) => {
        return {
          index: index,
          username: row.username,
          groupname: row.groupname
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
      onPageChange: this.handlePageChange,
      onSortChange: this.handleSortChange,
      onSearchChange: this.handleSearchChange,
      clearSearch: true,
      searchDelayTime: 1000
    };
    const title = 'Member Invitation';
    const closeButton = (
      <Button
        onClick={() => {
          this.hide();
        }}
      >
        <Close />
      </Button>
    );
    const groupMenues = this.state.groups.map(function(group, index) {
      return (
        <MenuItem key={index} value={group.id}>
          {group.name}
        </MenuItem>
      );
    });
    return (
      <div>
        <Dialog
          open={this.state.formOpen}
          onClose={this.hide}
          aria-labelledby="form-dialog-title"
        >
          <CardHeader action={closeButton} title={title} />
          <DialogContent>
            <form autoComplete="off">
              <FormControl>
                <TextField
                  autoFocus
                  margin="dense"
                  id="invitationUsername"
                  label="Name"
                  type="name"
                  onChange={this.handleTextFieldChange}
                  fullWidth
                />
              </FormControl>
              <br />
              <FormControl>
                <InputLabel htmlFor="group">group</InputLabel>
                <Select
                  value={this.state.invitationGroup || false}
                  onChange={this.handleChangeGroup}
                  inputProps={{
                    name: 'invitationGroup',
                    id: 'group_id'
                  }}
                >
                  {groupMenues}
                </Select>
              </FormControl>
              <br />
              <Fab onClick={this.handleSubmit}>
                <Send />
              </Fab>
            </form>
          </DialogContent>
        </Dialog>
        <ResizableTable
          data={rows}
          search={true}
          pagination={true}
          options={options}
        >
          <TableHeaderColumn width="" dataField="username" isKey dataSort={true}>
            Name
          </TableHeaderColumn>
          <TableHeaderColumn width="" dataField="groupname" dataSort={true}>
            Group
          </TableHeaderColumn>
        </ResizableTable>
        <Fab color="primary" aria-label="Add" onClick={this.handleClickPlus}>
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
  withStyles(mainStyle, { name: 'User' }),
  connect(
    mapStateToProps,
    null
  )
)(User);
