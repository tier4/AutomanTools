import React from 'react';
import ReactDOM from 'react-dom';

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { RotateLeft, RotateRight } from '@material-ui/icons';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';

import { compose } from 'redux';
import { connect } from 'react-redux';
import CommonEditBar from '../common_edit_bar';

const MIN_MAX = {
  pos: [-100, 100],
  size: [0.1, 100],
  yaw: [-180, 180],
};
class PCDEditBar extends React.Component {
  constructor(props) {
    super(props);
  }
  getValue(type, axis) {
    const label = this.props.targetLabel.label;
    const box = label.bbox[this.props.candidateId].box;
    if (type === 'yaw') {
      return box[type] * 180 / Math.PI;
    } else {
      return box[type][axis];
    }
  }
  setValue(val, type, axis) {
    const label = this.props.targetLabel.label;
    const bbox = label.bbox[this.props.candidateId];
    if (type === 'yaw') {
      bbox.box[type] = val * Math.PI / 180;
    } else {
      bbox.box[type][axis] = val;
    }
    bbox.updateParam();
  }
  render() {
    const label = this.props.targetLabel.label;
    if (label == null) {
      return null;
    }
    const bbox = label.bbox[this.props.candidateId];
    if (bbox == null) {
      return null;
    }
    const handleValueChange = (type, axis) => (e, val) => {
      this.setValue(val, type, axis);
    };
    const handleInputChange = (type, axis) => (e) => {
      let val = e.target.value === '' ? '': Number(e.target.value);
      this.setValue(val, type, axis);
    };
    const changeGrid = (type, axis) => {
      const minmax = MIN_MAX[type];
      return (
        <React.Fragment>
          <Grid item xs={1}>
            {axis != null ? axis + ': ' : null}
          </Grid>
          <Grid item xs={7}>
            <Slider
              value={this.getValue(type, axis)}
              onChange={handleValueChange(type, axis)}
              step={0.01}
              min={minmax[0]}
              max={minmax[1]}
            />
          </Grid>
          <Grid item xs={4}>
            {type === 'yaw' ?
            <Input 
              value={this.getValue(type, axis)}
              onChange={handleInputChange(type, axis)}
              inputProps={{
                step: 1,
                min: minmax[0],
                max: minmax[1],
                type: 'number',
              }}
              startAdornment={<InputAdornment position="start">{' '}</InputAdornment>}
              endAdornment={<InputAdornment position="end">{'°'}</InputAdornment>}
            />:
            <Input
              value={this.getValue(type, axis)}
              onChange={handleInputChange(type, axis)}
              inputProps={{
                step: 0.01,
                min: minmax[0],
                max: minmax[1],
                type: 'number',
              }}
              startAdornment={<InputAdornment position="start">{' '}</InputAdornment>}
            />
            }
          </Grid>
        </React.Fragment>
      );
    };
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
          <Grid item xs={12}>{'Pos'}</Grid>
          {changeGrid('pos', 'x')}
          {changeGrid('pos', 'y')}
          {changeGrid('pos', 'z')}
          <Grid item xs={12}>{'Size'}</Grid>
          {changeGrid('size', 'x')}
          {changeGrid('size', 'y')}
          {changeGrid('size', 'z')}
          <Grid item xs={12}>{'Yaw'}</Grid>
          {changeGrid('yaw')}
        </Grid>
        <Divider />
        <CommonEditBar />
      </div>
    );
  }
}
const mapStateToProps = state => ({
  targetLabel: state.annotation.targetLabel,
  pcdTargetState: state.annotation.targetState
});
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(PCDEditBar);

