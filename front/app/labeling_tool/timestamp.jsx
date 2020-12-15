import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import { compose } from 'redux';
import { connect } from 'react-redux';

const style = {
  wrapper: {
    margin: 5,
    padding: 5
  },
  timestamp: {
  },
  timestamp_date: {
    fontWeight: 'bold'
  }
};

const timeFormat = date => {
  const lang = navigator.language;
  const dateDate = date.toLocaleDateString(lang);
  const dateTime = date.toLocaleTimeString(lang, { timeZoneName: 'short' });
  return dateDate + ' ' + dateTime;
};
const TimeStamp = (props) => {
  const classes = props.classes;
  const info = props.frameInfo[props.frameNumber];
  if (info == null) {
    return null;
  }
  const time = info.time;
  if (time == null) {
    return null;
  }
  const date = new Date(time.secs * 1000 + time.nsecs / 1000000);
  const nsecs = ('' + time.nsecs).padStart(9, '0');
  return (
    <Paper className={classes.wrapper}>
      <div className={classes.timestamp_date}>
        {timeFormat(date)}
      </div>
      <div className={classes.timestamp}>
        {time.secs}.{nsecs}
      </div>
    </Paper>
  );
};

const mapStateToProps = state => ({
  frameInfo: state.annotation.frameInfo,
});
export default compose(
  withStyles(style),
  connect(
    mapStateToProps,
    null
  )
)(TimeStamp);

