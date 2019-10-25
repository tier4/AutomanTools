import React from 'react';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Close from '@material-ui/icons/Close';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';

import { SUPPORT_LABEL_TYPES } from 'automan/services/const';
import KlasssetKlassTable from 'automan/dashboard/components/project/klassset_klass_table';
import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

function getSteps() {
  return ['Project Infomation', 'Create Classset', 'Check'];
}
function valueFormatter(cell, row) {
  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {row.value}
    </div>
  );
}

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      requesting: false,
      result: 'Requesting',
      name: '',
      description: '',
      labelType: null,
      activeStep: 0,
      klasses: []
    };
  }
  getStepContent(step) {
    const labelTypeMenu = SUPPORT_LABEL_TYPES.map(function (labelType, index) {
      return (
        <MenuItem key={labelType} value={labelType}>
          {labelType}
        </MenuItem>
      );
    });
    switch (step) {
      case 0:
        return (
          <DialogContent>
            <div style={{ width: '60%' }}>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Name"
                type="name"
                value={this.state.name}
                onChange={this.handleTextFieldChange}
                fullWidth
              />
              <TextField
                margin="dense"
                id="description"
                label="Description"
                type="description"
                value={this.state.description}
                onChange={this.handleTextFieldChange}
                fullWidth
              />
            </div>
            <InputLabel htmlFor="labelType">Label Type</InputLabel>
            <Select
              autoFocus
              value={this.state.labelType || false}
              onChange={this.handleChangeLabelType}
            >
              {labelTypeMenu}
            </Select>
          </DialogContent>
        );
      case 1:
        return (
          <KlasssetKlassTable
            handleCloseDialog={this.props.hide}
            handleKlassesChange={this.handleKlassesChange}
            klasses={this.state.klasses}
            labelType={this.state.labelType} />
        );
      case 2:
        let klasses = '';
        klasses = JSON.stringify(this.state.klasses);
          this.state.klasses.forEach((v) => {
            klasses += '[' + v.toString().replace(/,/g, ', ') + ']\n';
          });
        const data = [
          { key: 'name', value: this.state.name },
          { key: 'description', value: this.state.description },
          { key: 'label_type', value: this.state.labelType },
          { key: 'klasses', value: JSON.stringify(this.state.klasses) }
        ];
        return (
          <ResizableTable data={data}>
            <TableHeaderColumn width="20%" dataField="key" isKey>
              Key
            </TableHeaderColumn>
            <TableHeaderColumn dataField="value" dataFormat={valueFormatter}>
              Value
            </TableHeaderColumn>
          </ResizableTable>
        );
      default:
        return 'Unknown step';
    }
  }
  handleKlassesChange = (klasses) => {
    this.setState({ klasses: klasses });
  }
  handleTextFieldChange = e => {
    this.setState({ [e.target.id]: e.target.value });
  };
  handleChangeLabelType = e => {
    this.setState({
      labelType: e.target.value,
      klasses: []
    });
  };
  isDisabled = () => {
    switch (this.state.activeStep) {
      case 0:
        return !(this.state.name && this.state.description && this.state.labelType);
      case 1:
        return this.state.klasses.length === 0;
      default:
        return false;
    }
  }
  request = () => {
    this.setState({ requesting: true });
    const data = {
      name: this.state.name,
      description: this.state.description,
      label_type: this.state.labelType,
      klasses: this.state.klasses
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
    const steps = getSteps();
    const handleNext = () => {
      if (this.state.activeStep === steps.length - 1) {
        this.request();
        this.props.hide();
        return;
      }
      let step = this.state.activeStep + 1;
      this.setState({ activeStep: step });
    };
    const handleBack = () => {
      let step = this.state.activeStep - 1;
      this.setState({ activeStep: step });
    };
    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.hide}
        aria-labelledby="form-dialog-title"
        maxWidth="md"
        fullWidth={true}
      >
        <CardHeader action={closeButton} title={title} />
        <div>
          <Stepper activeStep={this.state.activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {this.getStepContent(index)}
                  <DialogActions>
                    <Button
                      disabled={this.state.activeStep === 0}
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={this.isDisabled()}
                      onClick={handleNext}
                    >
                      {this.state.activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                    </Button>
                  </DialogActions>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </div>
      </Dialog>
    );
  }
}
