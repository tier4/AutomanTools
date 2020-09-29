import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import { compose } from 'redux';
import { connect } from 'react-redux';
import LinearProgress from '@material-ui/core/LinearProgress';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';

const styles = theme => ({
  normal: {
    textAlign: 'center',
    background: green[200]
  },
  expired: {
    textAlign: 'center',
    background: red[500]
  },
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
        className={isExpired ?
          classes.expired : classes.normal
        }
      >
        {'Frame is '}
        {isExpired ? (
          'locked'
        ) : (
          'unlocked'
        )}
        <LinearProgress
          value={diff * 100}
          variant="determinate"
          color={isExpired ?
            'secondary' : 'primary'
          }
        />
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
