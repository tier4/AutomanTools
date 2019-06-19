import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import { mainStyle } from 'automan/assets/main-style';

class OriginalSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      originals: [],
      original: { name: null }
    };
  }
  componentDidMount() {
    let url =
      `/projects/${this.props.currentProject.id}` +
      `/originals/?status=analyzed`;
    RequestClient.get(
      url,
      null,
      data => {
        this.setState({ originals: data.records });
      },
      () => {}
    );
  }
  handleChangeOriginal = e => {
    this.setState({ original: e.target.value });
    this.props.handleSetJobConfig({
      original_id: e.target.value.id,
      candidates: []
    });
  };
  render() {
    const originalMenu = this.state.originals.map(function(original, index) {
      return (
        <MenuItem key={index} value={original}>
          {original.name}
        </MenuItem>
      );
    });
    return (
      <FormControl>
        <InputLabel htmlFor="original">Original</InputLabel>
        <Select
          autoFocus
          value={this.state.original.name || false}
          onChange={this.handleChangeOriginal}
        >
          {originalMenu}
        </Select>
      </FormControl>
    );
  }
}

OriginalSelect.propTypes = {
  classes: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};
export default compose(
  withStyles(mainStyle, { name: 'OriginalSelect' }),
  connect(
    mapStateToProps,
    null
  )
)(OriginalSelect);
