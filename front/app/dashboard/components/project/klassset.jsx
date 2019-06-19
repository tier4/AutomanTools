import React from 'react';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Close from '@material-ui/icons/Close';

import KlasssetKlassTable from 'automan/dashboard/components/project/klassset_klass_table';

export default class KlasssetPart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { dialogOpen: false, submitData: [], error_string: '' };
  }
  handleClickPlus = () => {
    this.setState({ dialogOpen: true });
  };
  handleCloseDialog = () => {
    this.setState({ dialogOpen: false });
  };
  render() {
    const { klassset } = this.props;
    let klasses, readOnlyTable, mainContent;
    if (klassset == undefined || klassset.count == 0) {
      readOnlyTable = false;
      klasses = [];
    } else {
      readOnlyTable = true;
      klasses = klassset.records;
    }
    const klasssetKlassTableProps = {
      handleCloseDialog: this.handleCloseDialog.bind(this),
      readOnly: readOnlyTable,
      klasses: klasses
    };

    const title = 'ClassSet Settings';
    const closeButton = (
      <Button
        onClick={this.handleCloseDialog}
      >
        <Close />
      </Button>
    );

    if (klassset != undefined && klassset.count != 0) {
      mainContent = (
        <div className="container">
          <KlasssetKlassTable {...klasssetKlassTableProps} />
        </div>
      );
    } else {
      mainContent = (
        <div className="container">
          <Dialog
            open={this.state.dialogOpen}
            onClose={this.handleClickHideForm}
            aria-labelledby="form-dialog-title"
          >
            <CardHeader action={closeButton} title={title} />
            <DialogContent>
              <div>
                <KlasssetKlassTable {...klasssetKlassTableProps} />
              </div>
            </DialogContent>
          </Dialog>
          <div className="panel panel-default">
            <div className="panel-heading">
              <div className="panel-right-button">
                <button
                  onClick={this.handleClickPlus}
                  type="button"
                  className="btn btn-xs size-30x30-green"
                >
                  <i className="glyphicon glyphicon-plus color-white" />
                </button>
              </div>
            </div>
            <div className="panel-body">
              <p>ClassSet is not registered.</p>
            </div>
          </div>
        </div>
      );
    }
    return <div>{mainContent}</div>;
  }
}
