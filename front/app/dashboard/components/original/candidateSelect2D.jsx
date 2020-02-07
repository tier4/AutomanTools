import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { mainStyle } from 'automan/assets/main-style';

class CandidateSelect2D extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      candidates: [],
      candidates_2d: [],
      original: { name: null }
    };
  }
  componentDidMount() {
    const original_id = this.props.original_id;
    this.props.handleSetJobConfig({original_id: this.props.original_id});
    const candidates = this.props.handleGetJobConfig('candidates');
    this.setState({ candidates: candidates });
    let url =
      `/projects/${this.props.currentProject.id}/originals/` +
      `${original_id}/candidates/?data_type=IMAGE`;
    RequestClient.get(
      url,
      null,
      data => {
        this.setState({ candidates_2d: data.records });
      },
      () => {}
    );
  }
  handleChangeCandidate = e => {
    let candidates = this.props.handleGetJobConfig('candidates');
    if (e.target.checked == true) {
      candidates.push(Number(e.target.value));
    } else {
      candidates = candidates.filter(n => n !== Number(e.target.value));
    }
    this.setState({ candidates: candidates });
    this.props.handleSetJobConfig('candidates', candidates);
    this.props.handleSelect(candidates.length != 0);
  };
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <FormLabel component="legend">2D Candidates</FormLabel>
        <FormGroup>
          {this.state.candidates_2d.map((x, index) => {
            return (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    onChange={this.handleChangeCandidate}
                    value={x.candidate_id.toString()}
                    checked={this.state.candidates.includes(x.candidate_id)}
                  />
                }
                label={JSON.parse(x.analyzed_info).topic_name}
              />
            );
          })}
        </FormGroup>
      </div>
    );
  }
}

CandidateSelect2D.propTypes = {
  classes: PropTypes.object.isRequired
};
const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};

export default compose(
  withStyles(mainStyle, { name: 'CandidateSelect2D' }),
  connect(
    mapStateToProps,
    null
  )
)(CandidateSelect2D);
