import React from 'react';
import ReactDOM from 'react-dom';

export default class PopupDownload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flag: false,
      ready: false,
      label_id: -1,
      link: '',
      status: '',
      progress: 0,
      ajaxCount: 0,
      date: ''
    };
  }
  show(label) {
    this.setState({
      flag: true,
      ready: false,
      label_id: label.id,
      status: label.status,
      progress: 0,
      date: label.archiveDate,
      frameCount: label.frame_count
    });
    if (label.status == 'Archived') {
      this.getDownloadLink(label.label_id);
      this.setState({ progress: 100 });
    }
    if (label.status == 'Archiving') {
      this.setState({ progress: label.progress });
    }
    let that = this;
    var id = setInterval(function() {
      if (!that.state.flag) {
        clearInterval(id);
        return;
      }
      that.update();
    }, 1000);
  }
  hide() {
    this.setState({ flag: false, ready: false, label_id: -1 });
    if (this.props.onHide) {
      this.props.onHide();
    }
  }
  archiveLabel(label_id) {
    let that = this;
    let startFrame = ReactDOM.findDOMNode(this.refs.inputStartFrame).value;
    let endFrame = ReactDOM.findDOMNode(this.refs.inputEndFrame).value;
    let frameInterval = ReactDOM.findDOMNode(this.refs.inputFrameInterval)
      .value;
    let withLabeledImages = 0;
    if (this.refs.checkWithLabeledImages.checked) {
      withLabeledImages = 1;
    }

    let sendData = {
      label_id: label_id,
      start_frame: startFrame,
      end_frame: endFrame,
      frame_interval: frameInterval,
      with_labeled_images: withLabeledImages
    };
    RequestClient.post(
      '/submit_archive/',
      sendData,
      function() {
        that.setState({ progress: 0, ready: false, status: 'Archiving' });
      },
      function() {
        // TODO: add handling failed
      }
    );
  }
  handleClickArchive() {
    this.archiveLabel(this.state.label_id);
  }
  getDownloadLink(label_id) {
    let that = this;
    this.state.ajaxCount++;

    let data = { label_id: label_id };
    RequestClient.get(
      '/get_download_link/',
      data,
      function(res) {
        let link = res[0].link;
        let date = res[0].date;
        that.setState({ link: link, ready: true, date: date });
        that.state.ajaxCount--;
      },
      function() {
        // TODO: add handling failed
      }
    );
  }
  getArchiveProgress(label_id) {
    let that = this;
    let data = { label_id: label_id };
    RequestClient.get(
      '/get_archive_progress/',
      data,
      function(res) {
        progress = res[0].progress;
        that.setState({ progress: progress });
      },
      function() {
        // TODO: add handling failed
      }
    );
  }
  update() {
    if (this.state.status == 'Archiving' && this.state.progress < 100) {
      this.getArchiveProgress(this.state.label_id);
    }
    if (
      this.state.progress == 100 &&
      !this.state.ready &&
      this.state.ajaxCount == 0
    ) {
      this.getDownloadLink(this.state.label_id);
    }
  }

  render() {
    if (!this.state.flag) {
      return null;
    }
    let formGroup = (
      <div>
        <div className="form-group">
          <label className="col-xs-5 control-label">Frame interval</label>
          <div className="col-xs-7">
            <input
              ref="inputFrameInterval"
              type="number"
              className="form-control"
              placeholder="1"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="col-xs-5 control-label">Start frame</label>
          <div className="col-xs-7">
            <input
              ref="inputStartFrame"
              className="form-control"
              type="number"
              placeholder="1"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="col-xs-5 control-label">End frame</label>
          <div className="col-xs-7">
            <input
              ref="inputEndFrame"
              className="form-control"
              type="number"
              placeholder={this.state.frameCount}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="col-xs-5 control-label">Visualize labels</label>
          <div className="col-xs-7">
            <input
              ref="checkWithLabeledImages"
              type="checkbox"
              className="form-control"
            />
          </div>
        </div>
      </div>
    );
    let button;
    if (this.state.status == 'Archiving') {
      button = null;
    } else {
      button = (
        <button className="btn btn-primary" onClick={this.handleClickArchive}>
          Archive
        </button>
      );
    }
    let styles = {
      width: this.state.progress + '%',
      color: '#000'
    };
    let progressBar;
    if (this.state.progress < 100) {
      progressBar = (
        <div className="progress progress-striped active">
          <div className="progress-bar progress-bar-danger" style={styles} />
        </div>
      );
    } else {
      progressBar = (
        <div className="progress">
          <div className="progress-bar progress-bar-info" style={styles} />
        </div>
      );
    }
    let archive = (
      <div>
        <div className="col-xs-3">{button}</div>
        <div className="col-xs-9">{progressBar}</div>
      </div>
    );
    let download;
    if (this.state.progress != 100) {
      download = <p>No archives.</p>;
    } else if (this.state.ready) {
      let downloadString = 'Download archive at ' + this.state.date;
      download = <a href={this.state.link}>{downloadString}</a>;
    } else {
      download = <p>Getting download link...</p>;
    }
    let content = (
      <div>
        {formGroup}
        <div>{archive}</div>
        <br />
        <div className="col-xs-12">{download}</div>
      </div>
    );
    let panelBodyStyle = { height: '300px', width: '500px' };
    return (
      <div id="overlay">
        <div className="panel panel-default popup-panel" style={panelBodyStyle}>
          <div className="panel-heading">
            <div className="panel-right-button">
              <button
                onClick={this.hide}
                type="button"
                className="btn btn-xs size-30x30-red"
              >
                <i className="glyphicon glyphicon-remove color-white" />
              </button>
            </div>
            <h4 className="panel-title"> </h4>
          </div>
          <div className="panel-body">{content}</div>
        </div>
      </div>
    );
  }
}
