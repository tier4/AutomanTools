import React from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Archive from '@material-ui/icons/Archive';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

const initialState = {
  include_image_flag: false,
};
class ArchiveDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, initialState);
  }
  handleArchive = () =>{
    const opt = {
      include_image_flag: this.state.include_image_flag
    };
    this.setState(initialState);
    this.props.onArchive(opt);
  };
  handleClose = () => {
    this.setState(initialState);
    this.props.onClose();
  };
  handleIncludeImageFlag = e => {
    this.setState({
      include_image_flag: e.target.checked,
    });
  };
  render() {
    return(
      <Dialog
        open={this.props.open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Archive Option Config"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Tooltip
              title="If checked, include images in the archive target"
            >
              <FormControlLabel
                label="Include image"
                control={
                  <Checkbox
                    checked={this.state.include_image_flag}
                    onChange={this.handleIncludeImageFlag}
                    name="checkedB"
                    color="primary"
                  />
                }
              />
            </Tooltip>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary">
            Canncel
          </Button>
          <Button
            onClick={this.handleArchive}
            startIcon={<Archive />}
            color="primary"
            autoFocus
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default ArchiveDialog;
