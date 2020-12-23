import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';

const style = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto',
    width: 'fit-content'
  }
};

const LoadingProgress = ({classes, text, progress}) => (
  <Dialog open={progress === null || progress >= 0}>
    <DialogTitle>
      {text}
    </DialogTitle>
    <DialogContent>
      <div className={classes.wrapper}>
        {
          progress === null ? (
            <CircularProgress />
          ) : (
            <CircularProgress
              variant="static"
              value={progress * 100}
            />
          )
        }
      </div>
    </DialogContent>
  </Dialog>
);

export default withStyles(style)(LoadingProgress);

