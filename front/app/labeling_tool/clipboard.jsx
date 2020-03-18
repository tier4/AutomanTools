import React from 'react';
import ReactDOM from 'react-dom';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setClipboard } from './actions/tool_action';

class Clipboard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      copy: null
    };
    props.dispatchSetClipboard(this);
  }
  init() {
  }
  hasCopy() {
    return this.state.copy != null;
  }
  copy(isAll) {
    if (isAll === null) {
      isAll = this.props.annotation.getTarget() == null;
    }
    const copy = this.props.annotation.copyLabels(isAll);
    if (copy.length === 0) {
      return;
    }
    this.setState({ copy: copy });
  }
  paste() {
    const copy = this.state.copy;
    this.props.annotation.pasteLabels(copy);
  }

  render() {
    return (
      <Grid item xs={12}>
        <Button onClick={() => this.copy(false)}>Copy</Button>
        <Button onClick={() => this.copy(true)}>Copy ALL</Button>
        <Button onClick={() => this.paste()} disabled={!this.hasCopy()}>Paste</Button>
      </Grid>
    );
  }
}
const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  controls: state.tool.controls,
  annotation: state.tool.annotation,
});
const mapDispatchToProps = dispatch => ({
  dispatchSetClipboard: target => dispatch(setClipboard(target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Clipboard);

