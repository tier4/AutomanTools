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
//import FormControl from '@material-ui/core/FormControl';
//import InputLabel from '@material-ui/core/InputLabel';
//import MenuItem from '@material-ui/core/MenuItem';
//import Select from '@material-ui/core/Select';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
//import TextField from '@material-ui/core/TextField';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';

import { mainStyle } from 'automan/assets/main-style';
//import { SUPPORT_JOB_TYPES } from 'automan/services/const';
import AnalyzerForm from 'automan/dashboard/components/job/analyzerForm';
//import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

function getSteps() {
  return ['Input job settings', 'Check'];
}

class JobForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      users: [],
      error: null,
      query: RequestClient.createPageQuery(),
      jobType: 'ANALYZER',
      jobConfig: {},
      activeStep: 0,
      message: null
    };
  }
  handleTextFieldChange = event => {
    this.setState({ [event.target.id]: event.target.value });
  };
  handleChangeJob = event => {
    this.setState({
      jobType: event.target.value,
      jobConfig: {}
    });
  };
  handleSetJobConfig = (key, value) => {
    this.setState({
      jobConfig: Object.assign({}, this.state.jobConfig, { [key]: value })
    });
  };
  handleSubmit = () => {
    const data = this.getSubmitData();
    let url = `/projects/${this.props.currentProject.id}/jobs/`;
    this.setState({ message: 'Requesting...' });
    RequestClient.post(
      url,
      data,
      res => {
        this.setState({ message: null });
        this.props.hide();
      },
      mes => {
        this.setState({
          error: mes.message,
          message: null
        });
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
  isLastStep() {
    return this.state.activeStep === this.totalSteps() - 1;
  }
  getStepContent(step) {
    switch (step) {
      case 0:
        return <AnalyzerForm handleSetJobConfig={this.handleSetJobConfig} />;
      case 1:
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
    let submitData = {
      job_type: this.state.jobType,
      job_config: this.state.jobConfig
    };
    return submitData;
  };
  getMessage = () => {
    if (this.state.error != null) {
      return (
        <div>
          {this.state.error}
        </div>
      );
    } else if (this.state.message != null) {
      return (
        <div>
          {this.state.message}
        </div>
      );

    }
  };
  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;
    const title = 'New Job';
    const closeButton = (
      <Button
        onClick={() => {
          this.props.hide();
        }}
      >
        <Close />
      </Button>
    );
    return (
      <div className={classes.root}>
        <Dialog
          open={this.props.formOpen}
          onClose={this.props.hide}
          aria-labelledby="form-dialog-title"
        >
          <CardHeader action={closeButton} title={title} />
          <DialogContent>
            <Stepper alternativeLabel nonLinear activeStep={activeStep}>
              {steps.map((label, index) => {
                const props = {};
                return (
                  <Step key={label} {...props}>
                    <StepButton>{label}</StepButton>
                  </Step>
                );
              })}
            </Stepper>
            <div>
              <div>
                {this.getMessage()}
                <div>{this.getStepContent(activeStep)}</div>
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

JobForm.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'JobForm' }),
  connect(
    mapStateToProps,
    null
  )
)(JobForm);
