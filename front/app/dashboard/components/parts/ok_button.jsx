import React from 'react';

export default class OKButton extends React.Component {
  render() {
    let text = 'OK';
    if ('text' in this.props) {
      text = this.props.text;
    }
    let classes = 'fancy_btn';
    if ('position' in this.props) {
      if (this.props.position == 'right') {
        classes = 'fancy_btn panel-next-button';
      }
    }
    return (
      <button onClick={this.props.localHandleClick} className={classes}>
        {text}
      </button>
    );
  }
}
