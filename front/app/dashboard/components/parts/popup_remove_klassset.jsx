import React from 'react';
import OKButton from './ok_button';

export default class PopupRemoveKlassset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flag: false,
      klassset_id: -1,
      klassset_name: '',
      response: ''
    };
  }
  show(klassset_id, klassset_name) {
    this.setState({
      flag: true,
      klassset_id: klassset_id,
      klassset_name: klassset_name,
      response: ''
    });
  }
  hide() {
    this.setState({ flag: false, klassset_id: -1 });
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  removeklassset(klassset_id) {
    let that = this;
    RequestClient.delete(
      '/klasssets/' + klassset_id + '/',
      { klassset_id: klassset_id },
      function(res) {
        that.hide();
      },
      function(mes) {
        that.setState({ response: mes.message });
      }
    );
  }
  render() {
    if (this.state.flag) {
      let str = 'Delete "' + this.state.klassset_name + '"?';
      if (this.state.response != '') {
        str = this.state.response;
      }
      let content = (
        <div className="text-center">
          {str}
          <br />
          <OKButton
            localHandleClick={this.removeklassset.bind(
              this,
              this.state.klassset_id
            )}
          />
        </div>
      );
      return (
        <div id="overlay">
          <div className="panel panel-default popup-panel">
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
            <div className="panel-body">{content}</div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}
