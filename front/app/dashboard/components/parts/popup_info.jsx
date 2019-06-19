import React from 'react';

export default class PopupInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { flag: false };
  }
  show() {
    this.setState({ flag: true });
  }
  hide() {
    this.setState({ flag: false });
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  render() {
    if (this.state.flag) {
      let content;
      content = <div className="text-center">{this.props.text}</div>;
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
