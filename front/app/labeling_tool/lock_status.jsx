import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import Paper from '@material-ui/core/Paper';
import { compose } from 'redux';
import { connect } from 'react-redux';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/Save';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';

const styles = theme => ({
  wrapper: {
    textAlign: 'center',
    position: 'relative',
    width: 50,
    height: 50,
    marginLeft: 5
  },
  normal: {
    background: green[200]
  },
  expired: {
    background: red[500]
  },
  button: {
    position: 'absolute',
    top: 5,
    left: 5
  },
  progress: {
    position: 'absolute',
    top: 1,
    left: 1
  }
});
const mapStateToProps = state => ({
  lockInfo: state.tool.annotationLock
});
class LockStatus extends React.Component {
  constructor(props) {
    super(props);
    this.timeoutId = null;
    this.state = {
      isExpired: true,
      timeDiff: 0,
    };
    this.timeCheck = () => {
      this.timeoutId = setTimeout(
          this.timeCheck, 1000);
      const now = new Date().getTime() / 1000;
      const exp = this.getExpiredTime() / 1000;
      this.setState({
        isExpired: exp <= now,
        timeDiff: Math.max(exp - now, 0)
      });
    };
  }
  componentDidMount() {
    this.timeCheck();
  }
  componentWillUnmount() {
    clearTimeout(this.timeoutId);
    this.timeCheck = () => {};
  }
  getExpiredTime() {
    const lockInfo = this.props.lockInfo;
    if (lockInfo == null) {
      return 0;
    }
    return lockInfo.expiresAt.getTime();
  }
  render() {
    const classes = this.props.classes;
    const diff = this.state.timeDiff / (60 * 5);
    const isExpired = this.state.isExpired;
    return (
      <Paper
        elevation={2}
        className={classNames(
          classes.wrapper,
          isExpired ? classes.expired : classes.normal
        )}
      >
        <CircularProgress
          className={classes.progress}
          size={48}
          value={diff * 100}
          variant="determinate"
          color={isExpired ?
            'secondary' : 'primary'
          }
        />
        <Tooltip
          title={isExpired ?
            'You probably CANNOT save this frame' :
            'You CAN save this frame'
          }
        >
          <Fab
            className={classes.button}
            onClick={this.props.onClick}
            size="small"
          >
            <SaveIcon />
          </Fab>
        </Tooltip>
      </Paper>
    );
  }
}
export default compose(
  withStyles(styles),
  connect(
    mapStateToProps,
    null
  )
)(LockStatus);
