import React, { useReducer } from 'react';
import logo from './logo.svg';
import './App.css';
import { reducer, initialState, SeasonModel } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Switch, Link } from 'react-router-dom';
import SeasonList from './SeasonList';
import SeasonDetail from './SeasonDetail';
import OnDeck from './OnDeck';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

interface AppProps {
  backendURI: string;
}

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      flexGrow: 1,
    },
    logo: {
      marginRight: theme.spacing(2),
    },
    grow: {
      flexGrow: 1,
    },
  });
});

function AppHeader() {
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
          <Typography variant="h6">
            Friday Fellows Updater
          </Typography>
          <div className={classes.grow} />
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    </div>
  );
}

const App: React.FC<AppProps> = ({ backendURI }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchSeasonData = async () => {
    const resp = await axios.get<SeasonModel[]>(backendURI + '/getAllSeasons');
    dispatch(AppActions.fetchSeasons({ json: resp.data }));
  };

  const handleStartDateChanged = async (newDate: Date | null, season: SeasonModel, index: number) => {
    const resp = await axios.post(backendURI + '/setSeasonStartDate', {
      sheetId: season.sheetId,
      startDate: newDate ? newDate.getTime() : null,
    })
    if (resp.status === 200) {
      dispatch(AppActions.setSeasonStartDate({
        seasonIdx: index,
        startDate: newDate,
      }))
    }
  }

  function AppFooter() {
    return (
      <div className="App-footer">
        <button onClick={fetchSeasonData}>Fetch Season Data</button>
      </div>
    );
  }

  return (
    <div className="App">
      <AppHeader />
      <div className="App-body">
        <Switch>
          <Route exact={true} path="/">
            <OnDeck />
          </Route>
          <Route exact={true} path="/seasons">
            <SeasonList seasons={state.seasons} onStartDateChanged={handleStartDateChanged} />
          </Route>
          <Route path="/s/:seasonId" render={({ match }) => (
            <SeasonDetail season={state.seasons.find((season) => String(season.sheetId) === match.params.seasonId)} />
          )} />
        </Switch>
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
