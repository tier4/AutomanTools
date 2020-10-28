import React from 'react';
import ReactDOM from 'react-dom';

import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Grid from '@material-ui/core/Grid';

import { compose } from 'redux';
import { connect } from 'react-redux';

const style = {
  textField: {
    marginTop: 10,
    padding: '0 3px'
  }
};

const MEMO_MAX_LENGTH = 128;
class CommonEditBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      memo: this.getLabelComment(props.targetLabel.label)
    };
    
  }
  componentDidUpdate(prevProps) {
    if (this.props.targetLabel.label) {
      const memo = this.getLabelComment(this.props.targetLabel.label);
      if (memo !== this.state.memo) {
        this.setState({
          memo: memo.slice(0, MEMO_MAX_LENGTH)
        });
      }
    }
  }
  getLabelComment(label) {
    if (label == null) {
      return '';
    }
    return label.memo || '';
  }
  render() {
    const classes = this.props.classes;
    const label = this.props.targetLabel.label;
    if (label == null) {
      return null;
    }
    const handleChange = e => {
      const val = e.target.value;
      const memo = val.slice(0, MEMO_MAX_LENGTH);
      this.setState({ memo });
      const hist = label.createHistory();
      label.setMemo(memo);
      hist.addHistory();
    };
    return (
      <Grid container>
        <Grid item xs={12}>
          <TextField
            className={classes.textField}
            fullWidth
            multiline
            variant="outlined"
            label="Memo"
            rows={3}
            value={this.state.memo}
            onChange={handleChange}
            error={this.state.memo.length == MEMO_MAX_LENGTH}
          />
        </Grid>
      </Grid>
    );
  }
}
const mapStateToProps = state => ({
  targetLabel: state.annotation.targetLabel
});
export default compose(
  connect(
    mapStateToProps,
    null
  ),
  withStyles(style)
)(CommonEditBar);


