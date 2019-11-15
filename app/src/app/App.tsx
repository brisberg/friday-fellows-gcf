import React, { useReducer, useEffect } from 'react';
import './App.css';
import { reducer, initialState, SeasonModel } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Switch, Redirect } from 'react-router-dom';
import SeasonList from './SeasonList';
import SeasonDetail from './SeasonDetail';
import AppHeader from './AppHeader';
import OnDeck from './OnDeck';

interface AppProps {
  backendURI: string;
}

const App: React.FC<AppProps> = ({ backendURI }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load all season data on start using effect Hook
  // https://www.robinwieruch.de/react-hooks-fetch-data
  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        dispatch(AppActions.fetchSeasonsStart());
        const resp = await axios.get<SeasonModel[]>(backendURI + '/getAllSeasons');
        dispatch(AppActions.fetchSeasonsSuccess({ json: resp.data }));
      } catch (e) {
        console.log(e);
        // this.setState({...this.state, isFetching: false});
      }
    }

    fetchSeasonData();
  }, [backendURI])

  const handleStartDateChanged = async (newDate: Date | null, season: SeasonModel) => {
    const resp = await axios.post(backendURI + '/setSeasonStartDate', {
      sheetId: season.sheetId,
      startDate: newDate ? newDate.getTime() : null,
    })
    if (resp.status === 200) {
      dispatch(AppActions.setSeasonStartDate({
        season: season,
        startDate: newDate,
      }))
    }
  }

  function AppFooter() {
    return (
      <div className="App-footer">
        <a href="https://github.com/brisberg/friday-fellows-gcf">Github</a>
      </div>
    );
  }

  return (
    <div className="App">
      <AppHeader />
      <div className="App-body">
        <Switch>
          <Route exact={true} path='/'>
            <Redirect to='/ondeck' />
          </Route>
          <Route exact={true} path='/ondeck'>
            <OnDeck />
          </Route>
          <Route exact={true} path='/seasons'>
            <SeasonList seasons={state.seasons} loading={state.loadingSeasons} onStartDateChanged={handleStartDateChanged} />
          </Route>
          <Route path='/s/:seasonId' render={({ match }) => (
            <SeasonDetail season={state.seasons.find((season) => String(season.sheetId) === match.params.seasonId)}
              onStartDateChanged={handleStartDateChanged} />
          )} />
        </Switch>
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
