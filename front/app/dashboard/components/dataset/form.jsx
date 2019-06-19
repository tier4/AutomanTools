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
import OriginalSelect from 'automan/dashboard/components/dataset/originalSelect';
import CandidateSelect2D from 'automan/dashboard/components/dataset/candidateSelect2D';
import CandidateSelect2D3D from 'automan/dashboard/components/dataset/candidateSelect2D3D';
//import ResizableTable from 'automan/dashboard/components/parts/resizable_table';

function getSteps() {
  return ['Select rawdata', 'Select candidates', 'Check'];
}

class ExtractorForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total_count: 0,
      users: [],
      is_loading: true,
      error: null,
      query: RequestClient.createPageQuery(),
      jobType: 'EXTRACTOR',
      jobConfig: {},
      activeStep: 0
    };
  }
  handleTextFieldChange = event => {
    this.setState({ [event.target.id]: event.target.value });
  };
  handleSetJobConfig = (key, value) => {
    if (typeof key === 'string') {
      this.setState({
        jobConfig: Object.assign({}, this.state.jobConfig, { [key]: value })
      });
    } else {
      this.setState({
        jobConfig: Object.assign({}, this.state.jobConfig, key)
      });
    }
  };
  handleGetJobConfig = key => {
    return this.state.jobConfig[key];
  };
  handleSubmit = () => {
    const data = this.getSubmitData();
    const that = this;
    let url = `/projects/${this.props.currentProject.id}/jobs/`;
    RequestClient.post(
      url,
      data,
      function(res) {
        that.props.hide();
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
  isLastStep() {
    return this.state.activeStep === this.totalSteps() - 1;
  }
  getStepContent(step) {
    switch (step) {
      case 0:
        return <OriginalSelect handleSetJobConfig={this.handleSetJobConfig} />;
      case 1:
        if (this.props.currentProject.label_type === 'BB2D') {
          return (
            <CandidateSelect2D
              handleSetJobConfig={this.handleSetJobConfig}
              handleGetJobConfig={this.handleGetJobConfig}
            />
          );
        } else if (this.props.currentProject.label_type === 'BB2D3D') {
          return (
            <CandidateSelect2D3D
              handleSetJobConfig={this.handleSetJobConfig}
              handleGetJobConfig={this.handleGetJobConfig}
            />
          );
        }
        return 'Unknown type';
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
    let submitData = {
      job_type: this.state.jobType,
      job_config: this.state.jobConfig
    };
    return submitData;
  };
  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;
    const title = 'Extractor Job';
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
ExtractorForm.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'ExtractorForm' }),
  connect(
    mapStateToProps,
    null
  )
)(ExtractorForm);
