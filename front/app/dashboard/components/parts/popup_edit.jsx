import React from 'react';
import ReactDOM from 'react-dom';
import OKButton from './ok_button.jsx';

export default class PopupEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flag: false,
      label_id: -1,
      ajaxCounter: 0,
      userGroups: [],
      currentName: '',
      currentUserGroupId: -1
    };
  }
  show(label_id, name, userGroupId) {
    this.setState({
      flag: true,
      label_id: label_id,
      currentName: name,
      currentUserGroupId: userGroupId
    });
    this.getUserGroups();
  }
  hide() {
    this.setState({ flag: false, ready: false, label_id: -1 });
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  getUserGroups() {
    let that = this;
    this.state.ajaxCounter++;
    RequestClient.get(
      '/user_form/get_user_groups/',
      null,
      function(res) {
        that.setState({ ready: true, userGroups: res });
        that.state.ajaxCounter--;
      },
      function(mes) {
        // TODO: add handling failed
      }
    );
  }
  handleSave() {
    let that = this;
    let labelName = ReactDOM.findDOMNode(this.refs.inputName).value;
    if (labelName == '') {
      labelName = ReactDOM.findDOMNode(this.refs.inputName).placeholder;
    }
    let userGroupId = ReactDOM.findDOMNode(this.refs.inputUserGroup).value;
    this.state.ajaxCounter += 2;
    let finishCallback = function(res) {
      that.state.ajaxCounter--;
      if (that.state.ajaxCounter == 0) {
        that.hide();
      }
    };
    let name_data = {
      label_id: this.state.label_id,
      name: labelName
    };
    let label_data = {
      label_id: this.state.label_id,
      user_group_id: userGroupId
    };
    RequestClient.post(
      '/set_label_name/',
      name_data,
      finishCallback,
      finishCallback
    );
    RequestClient.post(
      '/set_user_group_of_label/',
      label_data,
      finishCallback,
      finishCallback
    );
  }
  render() {
    let that = this;
    let userGroupOptions = this.state.userGroups.map(function(
      userGroup,
      index
    ) {
      if (userGroup.name != null) {
        if (userGroup.user_group_id == that.state.currentUserGroupId) {
          return (
            <option selected value={userGroup.user_group_id} key={index}>
              {userGroup.name}
            </option>
          );
        } else {
          return (
            <option value={userGroup.user_group_id} key={index}>
              {userGroup.name}
            </option>
          );
        }
      }
    });
    if (that.state.currentUserGroupId == -1) {
      userGroupOptions.push(
        <option selected value="-1" key="-1">
          Private
        </option>
      );
    } else {
      userGroupOptions.push(
        <option value="-1" key="-1">
          Private
        </option>
      );
    }
    let panelBodyStyle = { height: '300px', width: '500px' };
    if (!this.state.flag) {
      return null;
    }
    return (
      <div id="overlay">
        <div className="panel panel-default popup-panel" style={panelBodyStyle}>
          <div className="panel-heading">
            <div className="panel-right-button">
              <button
                onClick={this.hide}
                type="button"
                className="btn btn-xs size-30x30-red"
              >
                <i className="glyphicon glyphicon-remove color-white" />
              </button>
            </div>
            <h4 className="panel-title"> </h4>
          </div>
          <div className="panel-body">
            <form
              id="validate"
              role="form"
              className="form-horizontal group-border stripped"
            >
              <div className="form-group">
                <div className="form-group">
                  <label className="col-xs-5 control-label">Label name</label>
                  <div className="col-xs-5">
                    <input
                      ref="inputName"
                      type="text"
                      className="form-control"
                      placeholder={this.state.currentName}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="col-xs-5 control-label">Group</label>
                  <div className="col-xs-5">
                    <select
                      className="form-control"
                      ref="inputUserGroup"
                      size="5"
                      style={{ overflowY: 'scroll' }}
                    >
                      {userGroupOptions}
                    </select>
                  </div>
                </div>
              </div>
            </form>
            <OKButton
              localHandleClick={this.handleSave}
              text="Save"
              position="right"
            />
          </div>
        </div>
      </div>
    );
  }
}
