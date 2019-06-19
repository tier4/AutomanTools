import React from 'react';
import OKButton from './ok_button';

export default class PopupRemove extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flag: false, label_id: -1, label_name: '', response: '' };
  }
  show(label_id, bagname) {
    this.setState({
      flag: true,
      label_id: label_id,
      label_name: bagname,
      response: ''
    });
  }
  hide() {
    this.setState({ flag: false, label_id: -1 });
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  removeLabel(label_id) {
    let that = this;
    RequestClient.post(
      '/remove_semilabel/',
      { label_id: label_id },
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
      let str = 'Delete "' + this.state.label_name + '"?';
      if (this.state.response != '') {
        str = this.state.response;
      }
      let content = (
        <div className="text-center">
          {str}
          <br />
          <OKButton
            localHandleClick={this.removeLabel.bind(this, this.state.label_id)}
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
