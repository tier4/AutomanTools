import React from 'react';
import ReactDOM from 'react-dom';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

class Clipboard extends React.Component {

  constructor(props) {
    super(props);
    this.annotation = null;
    this._controls = props.controls;
    this.state = {
      copy: null
    };
    props.getRef(this);
  }
  init(annotation) {
    this.annotation = annotation;
  }
  hasCopy() {
    return this.state.copy != null;
  }
  copy(isAll) {
    if (isAll === null) {
      isAll = this.annotation.getTarget() == null;
    }
    const copy = this.annotation.copyLabels(isAll);
    if (copy.length === 0) {
      return;
    }
    this.setState({ copy: copy });
  }
  paste() {
    const copy = this.state.copy;
    this.annotation.pasteLabels(copy);
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
export default Clipboard;

