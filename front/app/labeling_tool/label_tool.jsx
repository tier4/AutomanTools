
import React from 'react';
import ReactDOM from 'react-dom';

import LabelTool from 'automan/labeling_tool/base_label_tool'

ReactDOM.render(
  <div style={{background:'#fff'}}>
    <LabelTool />
  </div>,
  document.getElementById('wrapper')
);


/*
class TestParent extends React.Component {
  constructor(props) {
    super(props);
    this.elem = <TestChild/>;
  }
  componentDidMount() {
    console.log('parent.componentDidMount()');
  }
  render() {
    return (
      <div>
        {this.elem}
      </div>
    );
  }
}
class TestChild extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      a: false
    };
    this.test = React.createRef();
  }
  componentDidMount() {
    console.log('child.componentDidMount()');
    $(this.test.current).append($('<div>aaa</div>'));
  }
  handle = () => {
    this.setState({a: !this.state.a});
    console.log('handle');
  }
  render() {
    return (
      <div ref={this.test} onClick={this.handle}>
        test {this.state.a.toString()}
      </div>
    );
  }
}

ReactDOM.render(
  <TestParent />,
  document.getElementById('wrapper')
);
*/
