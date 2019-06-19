import React from 'react';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Close from '@material-ui/icons/Close';
//import NavigateBefore from '@material-ui/icons/NavigateBefore';
//import NavigateNext from '@material-ui/icons/NavigateNext';
import Send from '@material-ui/icons/Send';

import { SUPPORT_LABEL_TYPES } from 'automan/services/const';

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      requesting: false,
      result: 'Requesting',
      name: '',
      description: '',
      labelType: null
    };
  }
  handleTextFieldChange = e => {
    this.setState({ [e.target.id]: e.target.value });
  };
  handleChangeLabelType = e => {
    this.setState({ labelType: e.target.value });
  };
  request = () => {
    this.setState({ requesting: true });
    const data = {
      name: this.state.name,
      description: this.state.description,
      label_type: this.state.labelType
    };
    RequestClient.post(
      '/projects/',
      data,
      res => {
        this.setState({ result: 'Success' });
        this.props.handlePostSubmit();
      },
      res => {
        this.setState({ result: 'Failed' });
      }
    );
  };
  render() {
    const title = 'New Project';
    const clickEv = () => {
      this.props.hide();
    };
    const closeButton = (
      <Button onClick={clickEv}>
        <Close />
      </Button>
    );
    const labelTypeMenu = SUPPORT_LABEL_TYPES.map(function(labelType, index) {
      return (
        <MenuItem key={labelType} value={labelType}>
          {labelType}
        </MenuItem>
      );
    });

    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.hide}
        aria-labelledby="form-dialog-title"
      >
        <CardHeader action={closeButton} title={title} />
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="name"
            onChange={this.handleTextFieldChange}
            fullWidth
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="description"
            onChange={this.handleTextFieldChange}
            fullWidth
          />
          <InputLabel htmlFor="labelType">Label Type</InputLabel>
          <Select
            autoFocus
            value={this.state.labelType || false}
            onChange={this.handleChangeLabelType}
          >
            {labelTypeMenu}
          </Select>
          <br />
          <Fab color="primary" onClick={this.request}>
            <Send />
          </Fab>
        </DialogContent>
      </Dialog>
    );
  }
}
