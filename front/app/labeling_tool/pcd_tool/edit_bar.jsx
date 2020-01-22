import React from 'react';
import ReactDOM from 'react-dom';

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { RotateLeft, RotateRight } from '@material-ui/icons';

import { compose } from 'redux';
import { connect } from 'react-redux';

class PCDEditBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
    const label = this.props.targetLabel;
    if (label == null) {
      return null;
    }
    const bbox = label.bbox[this.props.candidateId];
    if (bbox == null) {
      return null;
    }
    return (
      <div>
        <Divider />
        <Grid container>
          <Grid item xs={12}>
            Rotate Front
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => bbox.rotateFront(1)}
            >
              <RotateLeft />
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => bbox.rotateFront(-1)}
            >
              <RotateRight />
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}
const mapStateToProps = state => ({
  targetLabel: state.annotation.targetLabel,
});
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(PCDEditBar);

