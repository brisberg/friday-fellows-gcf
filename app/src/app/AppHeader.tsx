import React from 'react';
import logo from './logo.svg';
import './AppHeader.css';
import { Link, NavLink } from 'react-router-dom';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      flexGrow: 1,
    },
    logo: {
      marginRight: theme.spacing(2),
    },
    title: {
      marginRight: theme.spacing(3),
    },
    navButton: {
      marginRight: theme.spacing(1),
    },
    grow: {
      flexGrow: 1,
    },
  });
});

const AppHeader: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.logo} color="inherit" aria-label="logo">
            <Link to={'/'}>
              <img src={logo} className="App-logo" alt="logo" />
            </Link>
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Friday Fellows Updater
          </Typography>
          <MenuItem disableRipple component={NavLink} to={'/'} activeClassName={'activeLink'} exact={true}>
            <Button variant="contained" className={classes.navButton}>On Deck</Button>
          </MenuItem>
          <MenuItem disableRipple component={NavLink} to={'/seasons'} activeClassName={'activeLink'}>
            <Button variant="contained" className={classes.navButton}>Seasons</Button>
          </MenuItem>
          <MenuItem disableRipple component={NavLink} to={'/admin'} activeClassName={'activeLink'}>
            <Button variant="contained" className={classes.navButton} disabled={true}>Admin</Button>
          </MenuItem>
          <div className={classes.grow} />
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default AppHeader;
