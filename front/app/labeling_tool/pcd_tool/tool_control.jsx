import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

import { compose } from 'redux';
import { connect } from 'react-redux';
import { setTopic, setTargetCandidateId } from '../actions/pcd_tool_action';


const style = {
  wrapper: {
    userSelect: 'none',
  }
};
class PCDToolControl extends React.Component {
  constructor(props) {
    super(props);
  }
  getTargetCandidateId() {
    const target = this.props.targetCandidate;
    if (target< 0) { return -1; }
    return this.props.candidateInfo[target].id;
  }
  setTarget(id) {
    const target = this.props.targetCandidate;
    const list = this.props.candidateInfo;
    for (let i=0; i<list.length; ++i) {
      if (list[i].id == id) {
        if (target === i) {
          this.props.setTarget(-1);
        } else {
          this.props.setTarget(i);
        }
      }
    }
  }
  render() {
    const classes = this.props.classes;
    const topics = this.props.topics;
    const topicItems = [];
    const target = this.getTargetCandidateId();
    for (let id in topics) {
      topicItems.push(
        <Grid item xs={12} key={id}>
          <Checkbox
            size="small"
            checked={topics[id]}
            onChange={e => this.props.setTopic(id, e.target.checked)}
            icon={<VisibilityOffIcon/>}
            checkedIcon={<VisibilityIcon/>}
          />
          <Button
            size="small"
            variant={target == id ? 'contained' : 'outlined'}
            color={target == id ? 'primary' : 'default'}
            onClick={() => this.setTarget(id)}
          >
            {id}
          </Button>
        </Grid>
      );
    }
    return (
      <Grid container className={classes.wrapper}>
        {topicItems}
      </Grid>
    );
  }
}
const mapStateToProps = state => ({
  targetCandidate: state.pcdTool.targetCandidate,
  topics: state.pcdTool.topics,
  candidateInfo: state.annotation.candidateInfo
});
const mapDispatchToProps = dispatch => ({
  setTopic: (topic, val) => dispatch(setTopic(topic, val)),
  setTarget: id => dispatch(setTargetCandidateId(id))
}); 
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withStyles(style)
)(PCDToolControl);

