import React from 'react';
import ReactDOM from 'react-dom';

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { RotateLeft, RotateRight } from '@material-ui/icons';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import SaveIcon from '@material-ui/icons/Save';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { setCandidateInfo } from '../actions/annotation_action';

import RequestClient from 'automan/services/request-client';

const INITIAL_CALIBRATION = {
  x: 0, y: 0, z: 0,
  roll: 0, pitch: 0, yaw: 0,
};

class CandidateEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  getCandidateInfo() {
    const targetCandidate = this.props.targetCandidate;
    return this.props.candidateInfo[targetCandidate];
  }
  saveCandidateInfo() {
    const candidate = this.getCandidateInfo();
    const targetId = candidate.id;
    const info = Object.assign({},
      candidate,
      {
        calibration_info: JSON.stringify(candidate.calibration_info),
        analyzed_info: JSON.stringify(candidate.analyzed_info)
      }
    );
    RequestClient.post(
      this.props.labelTool.getURL('set_candidate_info', targetId),
      info,
      res => {
      });
  }
  getCalibrationInfo() {
    const candidateInfo = this.getCandidateInfo();
    const calibrationInfo = candidateInfo.calibration_info;
    if (calibrationInfo == null) {
      return INITIAL_CALIBRATION;
    }
    return calibrationInfo;
  }
  setCalibrationInfo(key, val) {
    const targetCandidate = this.props.targetCandidate;
    const calibrationInfo = this.getCalibrationInfo();
    const newCandidateInfo = this.props.candidateInfo.slice();
    newCandidateInfo[targetCandidate].calibration_info = JSON.stringify(
      Object.assign(
        {}, calibrationInfo,
        { [key]: val }
      )
    );
    this.props.setCandidateInfo(newCandidateInfo);
  }
  handleInputChange(key) {
    return e => {
      const val = e.target.value === '' ? 0 : Number(e.target.value);
      this.setCalibrationInfo(key, val);
    };
  }
  renderInput(key, name) {
    const calibrationInfo = this.getCalibrationInfo();
    return (
      <React.Fragment>
        <Grid item xs={3}>
          {name + ': '}
        </Grid>
        <Grid item xs={9}>
          <Input 
            value={calibrationInfo[key]}
            onChange={this.handleInputChange(key)}
            onBlur={()=>{}}
            onKeyDown={()=>{}}
            inputProps={{
              step: 0.01,
              type: 'number',
            }}
          />
        </Grid>
      </React.Fragment>
    );
  }
  render() {
    const targetCandidate = this.props.targetCandidate;
    if (targetCandidate < 0) {
      return null;
    }
    return (
      <div>
        <Grid container>
          <Grid item xs={12}>
            {'Calibration: '}
            {this.getCandidateInfo().id}
            <Divider />
            {this.getCandidateInfo().analyzed_info.topic_name}
            <Divider />
          </Grid>
          {this.renderInput('x', 'x')}
          {this.renderInput('y', 'y')}
          {this.renderInput('z', 'z')}
          {this.renderInput('roll', 'roll')}
          {this.renderInput('pitch', 'pitch')}
          {this.renderInput('yaw', 'yaw')}
          <Grid item xs={12}>
            <Button
              startIcon={<SaveIcon />}
              onClick={() => this.saveCandidateInfo()}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}
const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  topics: state.pcdTool.topics,
  targetCandidate: state.pcdTool.targetCandidate,
  candidateInfo: state.annotation.candidateInfo
});
const mapDispatchToProps = dispatch => ({
  setCandidateInfo: info => dispatch(setCandidateInfo(info))
}); 
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(CandidateEditor);

