import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
//import { TableHeaderColumn } from 'react-bootstrap-table';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
//import Fab from '@material-ui/core/Fab';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import TextField from '@material-ui/core/TextField';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';

//import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

const styles = theme => ({
  root: {
    width: '90%'
  },
  button: {
    marginRight: theme.spacing.unit
  },
  backButton: {
    marginRight: theme.spacing.unit
  },
  instructions: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  }
});

function getSteps() {
  return ['Select storage type', 'Input storage settings', 'Check'];
}

class StorageForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      users: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(),
      storageTypes: ['AZURE_BLOB', 'LOCAL_NFS'], // FIXME: hard coding
      storageType: null,
      storageConfig: null,
      activeStep: 0
    };
  }
  handleTextFieldChange = event => {
    this.setState({ [event.target.id]: event.target.value });
  };
  handleChangeStorage = event => {
    this.setState({ storageType: event.target.value });
  };
  handleSubmit = () => {
    const data = this.getSubmitData();
    const that = this;
    let url = `/projects/${this.props.currentProject.id}/storages/`;
    RequestClient.post(
      url,
      data,
      function(res) {
        that.props.handleClickHideForm();
      },
      function(mes) {
        that.setState({ error: mes.message });
      }
    );
  };
  totalSteps = () => getSteps().length;
  handleNext = () => {
    let step = this.state.activeStep + 1;
    this.setState({ activeStep: step });
  };
  handleBack = () => {
    let step = this.state.activeStep - 1;
    this.setState({ activeStep: step });
  };
  handleStep = step => () => {
    this.setState({ activeStep: step });
  };
  isLastStep() {
    return this.state.activeStep === this.totalSteps() - 1;
  }
  getStepContent(step) {
    switch (step) {
      case 0:
        const storageMenu = this.state.storageTypes.map(
          (storageType, index) => {
            return (
              <MenuItem key={index} value={storageType}>
                {storageType}
              </MenuItem>
            );
          }
        );
        return (
          <FormControl>
            <InputLabel htmlFor="storage">storage</InputLabel>
            <Select
              autoFocus
              value={this.state.storageType || false}
              onChange={this.handleChangeStorage}
            >
              {storageMenu}
            </Select>
          </FormControl>
        );
      case 1:
        let form;
        if (this.state.storageType == 'AZURE_BLOB') {
          form = (
            <FormControl>
              <TextField
                margin="dense"
                id="storageConfig"
                label="Config"
                type="config"
                onChange={this.handleTextFieldChange}
                fullWidth
              />
            </FormControl>
          );
        } else if (this.state.storageType == 'LOCAL_NFS') {
          form = <p> No additional settings.</p>;
        }
        return form;
      case 2:
        const submitData = JSON.stringify(this.getSubmitData());
        return (
          <div>
            <p>{submitData}</p>
          </div>
        );
      default:
        return 'Unknown step';
    }
  }
  getSubmitData = () => {
    let submitData = { storage_type: this.state.storageType };
    if (this.state.storageType == 'AZURE_BLOB') {
      submitData.storage_config = {
        storage_account: this.state.azure_config
      };
    } else if (this.state.storageType == 'LOCAL_NFS') {
      submitData.storage_config = {};
    }
    return submitData;
  };
  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;
    const title = 'New Storage';
    const closeButton = (
      <Button
        onClick={() => {
          this.props.handleClickHideForm();
        }}
      >
        <Close />
      </Button>
    );
    return (
      <div className={classes.root}>
        <Dialog
          open={this.props.formOpen}
          onClose={this.props.handleClickHideForm}
          aria-labelledby="form-dialog-title"
        >
          <CardHeader action={closeButton} title={title} />
          <DialogContent>
            <Stepper alternativeLabel nonLinear activeStep={activeStep}>
              {steps.map((label, index) => {
                const props = {};
                const buttonProps = {};
                return (
                  <Step key={label} {...props}>
                    <StepButton
                      onClick={this.handleStep(index)}
                      {...buttonProps}
                    >
                      {label}
                    </StepButton>
                  </Step>
                );
              })}
            </Stepper>
            <div>
              <div>
                <div className={classes.instructions}>
                  {this.getStepContent(activeStep)}
                </div>
                <div>
                  <Button
                    disabled={activeStep === 0}
                    onClick={this.handleBack}
                    className={classes.button}
                  >
                    Back
                  </Button>
                  {this.isLastStep() ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.handleSubmit}
                      className={classes.button}
                    >
                      <Send /> Submit
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={this.handleNext}
                      className={classes.button}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

StorageForm.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(styles, { name: 'StorageForm' }),
  connect(
    mapStateToProps,
    null
  )
)(StorageForm);
