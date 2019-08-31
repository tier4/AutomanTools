import React from 'react';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Close from '@material-ui/icons/Close';
import FormControl from '@material-ui/core/FormControl';
import { makeStyles } from '@material-ui/core/styles';
import FilledInput from '@material-ui/core/FilledInput';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Send from '@material-ui/icons/Send';
import { SUPPORT_LABEL_TYPES } from 'automan/services/const';

export default class Popup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            requesting: false,
            result: 'Requesting',
            name: '',
            description: '',
            labelType: null,
            name_null_err: false,
            des_null_err: false,
            label_null_err: false,
            name_len_err: false,
            des_len_err: false,
        };
    }
    handleNameFieldChange = e => {
        this.setState({name: e.target.value });
    };

    handleDescriptionFieldChange = e => {
        this.setState({ description: e.target.value });
    };
    handleChangeLabelType = e => {
        this.setState({ labelType: e.target.value });
    };
    request = () => {
        this.setState({ requesting: true });
        const data = {
            name: this.state.name,
            description: this.state.description,
            label_type: this.state.labelType
        };
        name_null_err = {this.state.name === ''};
        name_len_err = {this.state.name.length > 127};
        this.setState({ name_null_err: name_null_err,
                        name_len_err: name_len_err});
        
        des_null_err = {this.state.description ===''};
        des_len_err = {this.state.description.length > 127};
        this.setState({des_null_err: des_null_err, 
                       des_len_err: des_len_err});
        
        label_null_err = {this.state.labelType === null};
        this.setState({label_null_err: label_null_err});
        
        if(!this.state.name_null_err && !this.state.name_len_err && !this.state.des_null_err && !this.state.des_len_err && !this.state.label_null_err){
            RequestClient.post(
                '/projects/',
                data,
                res => {
                    this.setState({ result: 'Success' });
                    this.props.handlePostSubmit();
                },
                res => {
                    this.setState({ result: 'Failed' });
                }
            );
        }
    };
    render() {
        const title = 'New Project';
        const clickEv = () => {
            this.props.hide();
        };
        const closeButton = (
                <Button onClick={clickEv}>
                <Close />
                </Button>
                );
        const labelTypeMenu = SUPPORT_LABEL_TYPES.map(function(labelType, index) {
            return (
                    <MenuItem key={labelType} value={labelType}>
                    {labelType}
                    </MenuItem>
                   );
        });
        let name_form;
        let des_form;
        let label_form;
        if (this.state.name_null_err){
            name_form = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Project Name</InputLabel>
                    <Input
                    autoFocus
                    value={this.state.name}
                    id="name"
                    margin="dense"
                    type="name"
                    onChange={this.handleNameFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please enter a valid project name.</FormHelperText>
                    </FormControl>
                   );
        }else if(this.state.name_len_err){
            name_form = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Project Name</InputLabel>
                    <Input
                    autoFocus
                    value={this.state.name}
                    id="name"
                    margin="dense"
                    type="name"
                    onChange={this.handleNameFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please only use 127 characters.</FormHelperText>
                    </FormControl>
                   );
        }else{
            name_form = (
                    <TextField
                    autoFocus
                    value={this.state.name}
                    margin="dense"
                    id="name"
                    label="Project Name"
                    type="name"
                    onChange={this.handleNameFieldChange}
                    fullWidth
                    />
                    );
        }
        if(this.state.des_null_err){
            des_form = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Description</InputLabel>
                    <Input
                    autoFocus
                    value={this.state.description}
                    id="description"
                    margin="dense"
                    type="description"
                    onChange={this.handleDescriptionFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please enter a valid description.</FormHelperText>
                    </FormControl>
                    );
        }else if(this.state.des_len_err){
            des_form = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Description</InputLabel>
                    <Input
                    autoFocus
                    value={this.state.description}
                    id="description"
                    margin="dense"
                    type="description"
                    onChange={this.handleDescriptionFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please only use 127 characters.</FormHelperText>
                    </FormControl>
                    );
        }else{
            des_form = (
                    <TextField
                    margin="dense"
                    value={this.state.description}
                    id="description"
                    label="Description"
                    type="description"
                    onChange={this.handleDescriptionFieldChange}
                    fullWidth
                    />
                    );
        }
        if(this.state.label_null_err){
            label_form = (
                    <FormControl
                    error
                    >
                    <InputLabel 
                    htmlFor="name-error"
                    margin="dense">Label Type</InputLabel>
                    <Select
                    autoFocus
                    name="name"
                    value={this.state.labelType || false}
                    onChange={this.handleChangeLabelType}
                    input={<Input id="name-error"/>}
                    >
                    {labelTypeMenu}
                    </Select>
                    <FormHelperText>Please choose a label.</FormHelperText>
                    </FormControl>
                    );
        }else{
            label_form = (
                    <FormControl>
                    <InputLabel>
                    LabelType
                    </InputLabel>
                    <Select
                    autoWidth
                    value={this.state.labelType || false}
                    onChange={this.handleChangeLabelType}
                    >
                    {labelTypeMenu}
                    </Select>
                    </FormControl>
                    );
        }
        return (
                <Dialog
                open={this.props.open}
                onClose={this.props.hide}
                aria-labelledby="form-dialog-title"
                >
                <CardHeader action={closeButton} title={title} />
                <DialogContent>
                {name_form}
                {des_form}
                {label_form}  
                <br />
                <Fab color="primary" onClick={this.request}>
                <Send />
                </Fab>
                </DialogContent>
                </Dialog>
                );
    }
}
