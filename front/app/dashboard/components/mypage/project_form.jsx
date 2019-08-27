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
            name_errform: false,
            des_errform: false,
            label_errform: false,
        };
    }

    handleTextFieldChange = e => {
        this.setState({ [e.target.id]: e.target.value });
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
        if(this.state.name === ''){
            this.setState({ name_errform: true});
        }else{
            this.setState({ name_errform: false});
        }
        if(this.state.description === ''){
            this.setState({ des_errform: true});
        }else{
            this.setState({ des_errform: false});
        }
        if(this.state.description === null){
            this.setState({ label_errform: true});
        }else{
            this.setState({ label_errform: false})
        }
        if(!this.state.name_errform && !this.state.des_errform && !this.state.label_errform){
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
        if (this.state.name_errform){
            form_name = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Project Name</InputLabel>
                    <Input
                    autoFocus
                    id="name"
                    margin="dense"
                    type="name"
                    onChange={this.handleTextFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please enter a valid project name.</FormHelperText>
                    </FormControl>
                    );
        }else{
            form_name = (
                    <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Project Name"
                    type="name"
                    onChange={this.handleTextFieldChange}
                    fullWidth
                    />
                    );
        }
        if(this.state.des_errform){
            des_form = ( 
                    <FormControl 
                    error
                    fullWidth>
                    <InputLabel htmlFor="component-error">Description</InputLabel>
                    <Input
                    autoFocus
                    id="description"
                    margin="dense"
                    type="description"
                    onChange={this.handleTextFieldChange}
                    fullWidth
                    aria-describedby="component-error-text"
                    />
                    <FormHelperText id="component-error-text">Please enter a valid description.</FormHelperText>
                    </FormControl>
    
                    );
        }else{
            des_form = (
                    <TextField
                    margin="dense"
                    id="description"
                    label="Description"
                    type="description"
                    onChange={this.handleTextFieldChange}
                    fullWidth
                    />
                    );
        }
        if(this.state.label_errform){
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
                    <FormControl >
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
