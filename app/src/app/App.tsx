import React, { useReducer } from 'react';
import './App.css';
import { reducer, initialState, SeasonModel } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Switch } from 'react-router-dom';
import SeasonList from './SeasonList';
import SeasonDetail from './SeasonDetail';
import AppHeader from './AppHeader';
import OnDeck from './OnDeck';

interface AppProps {
  backendURI: string;
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
