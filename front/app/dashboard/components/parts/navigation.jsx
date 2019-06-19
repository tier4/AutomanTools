import React from 'react';
import { AppBar, Toolbar } from '@material-ui/core/';
import { Link } from 'react-router-dom';
import Person from '@material-ui/icons/Person';
import Menu from '@material-ui/icons/Menu';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import classNames from 'classnames';

import Sidebar from 'automan/dashboard/components/parts/sidebar';

export default class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { avatarMenuOpen: false };
  }
  handleDrawerOpen = () => {
    this.props.updateNavOpen(true);
  };
  handleDrawerClose = () => {
    this.props.updateNavOpen(false);
  };
  handleAvatarMenuOpen = () => {
    this.setState({ avatarMenuOpen: !this.state.avatarMenuOpen });
  };
  handleLogout = () => {
    this.setState({ avatarMenuOpen: !this.state.avatarMenuOpen });
    this.props.logout();
  };
  handleAvatarMenuClose = event => {
    if (this.anchorEl.contains(event.target)) {
      return;
    }
    this.setState({ avatarMenuOpen: false });
  };
  render() {
    const { open, classes } = this.props;

    return (
      <div>
        <AppBar
          position="absolute"
          className={classNames(classes.appBar, open && classes.appBarShift)}
        >
          <Toolbar disableGutters={!open} className={classes.toolbar}>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerOpen}
              className={classNames(classes.menuButton)}
            >
              <Menu className={classNames(open && classes.hide)} />
            </IconButton>
            <Link className="navbar-brand" to="/mypage/" />
            <IconButton
              className={classes.button}
              buttonRef={node => {
                this.anchorEl = node;
              }}
              aria-owns={
                this.state.avatarMenuOpen ? 'menu-list-grow' : undefined
              }
              aria-haspopup="true"
              onClick={this.handleAvatarMenuOpen}
              style={{ color: '#000', position: 'absolute', top: 8, right: 18 }}
            >
              <Person />
            </IconButton>
            <Popper
              open={this.state.avatarMenuOpen}
              anchorEl={this.anchorEl}
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  id="menu-list-grow"
                  style={{
                    transformOrigin:
                      placement === 'bottom' ? 'center top' : 'center bottom'
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={this.handleAvatarMenuClose}>
                      <MenuList>
                        <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Toolbar>
        </AppBar>
        <CssBaseline />
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={open}
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={this.handleDrawerClose}>
              <ChevronLeft />
            </IconButton>
          </div>
          <Divider />
          <Sidebar />
        </Drawer>
      </div>
    );
  }
}
