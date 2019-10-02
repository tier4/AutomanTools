import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Close from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';
import { mainStyle } from 'automan/assets/main-style';
import CandidateSelect2D from 'automan/dashboard/components/dataset/candidateSelect2D';
import CandidateSelect2D3D from 'automan/dashboard/components/dataset/candidateSelect2D3D';

function getSteps() {
  return ['Select candidates', 'Check'];
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
  componentDidUpdate(prevProps) {
    if ( prevProps.original_id !== this.props.original_id ) {
      this.setState({
        activeStep: 0,
        jobConfig: {}
      })
    }
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
    if (this.state.jobConfig[key] == null) {
      return [];
    }
    return this.state.jobConfig[key];
  };
  handleSubmit = () => {
    const data = this.getSubmitData();
    let url = `/projects/${this.props.currentProject.id}/jobs/`;
    RequestClient.post(
      url,
      data,
      (res) => {
        this.props.hide();
        this.props.extractorSnackbarShow();
      },
      (mes) => {
        this.setState({ error: mes.message });
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
    if(this.props.original_id === 0)
      return 'Unknown type'
    switch (step) {
      case 0:
        if (this.props.currentProject.label_type === 'BB2D') {
          return (
            <CandidateSelect2D
              original_id={this.props.original_id}
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
          maxWidth="sm"
          fullWidth={true}
        >
          <CardHeader action={closeButton} title={title} />
          <DialogContent>
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
