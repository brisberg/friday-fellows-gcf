import React, { useReducer, useEffect } from 'react';
import './App.css';
import { reducer, initialState } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Switch, Redirect } from 'react-router-dom';
import SeasonList from './SeasonList';
import SeasonDetail from './SeasonDetail';
import AppHeader from './AppHeader';
import OnDeck from './OnDeck';
import { SeasonModel, SeriesModel } from '../../../model/firestore';
import { SetSeasonStartDateRequest, SetSeriesIdRequest } from '../../../model/service';

interface AppProps {
  backendURI: string;
}

interface GetAllSeasonsResponse {
  seasons: SeasonModel[];
  lastSyncMs?: number;
}

const App: React.FC<AppProps> = ({ backendURI }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load all season data on start using effect Hook
  // https://www.robinwieruch.de/react-hooks-fetch-data
  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        dispatch(AppActions.fetchSeasonsStart());
        const resp = await axios.get<GetAllSeasonsResponse>(backendURI + '/getAllSeasons');

        const lastSyncMs = resp.data.lastSyncMs;
        const lastSync = lastSyncMs ? new Date(lastSyncMs) : undefined
        dispatch(AppActions.fetchSeasonsSuccess({ json: resp.data.seasons, lastSync }));
      } catch (e) {
        console.log(e);
        // this.setState({...this.state, isFetching: false});
      }
    }

    fetchSeasonData();
  }, [backendURI])

  const handleStartDateChanged = async (newDate: Date | null, season: SeasonModel) => {
    const payload: SetSeasonStartDateRequest = {
      sheetId: season.sheetId,
      startDate: newDate ? newDate.getTime() : null,
    }
    const resp = await axios.post(backendURI + '/setSeasonStartDate', payload)
    if (resp.status === 200) {
      dispatch(AppActions.setSeasonStartDate({
        season: season,
        startDate: newDate,
      }))
    }
  }

  const handleSeriesIdChanged = async (series: SeriesModel, seasonId: number, seriesId: number) => {
    const payload: SetSeriesIdRequest = {
      seasonId: seasonId,
      row: series.rowIndex,
      seriesId: seriesId,
    }
    const resp = await axios.post(backendURI + '/setSeriesId', payload)
    if (resp.status === 200) {
      dispatch(AppActions.setSeriesId({
        series: series,
        seriesId: seriesId,
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
            <SeasonList seasons={state.seasons} lastSyncDate={state.lastSync} loading={state.loadingSeasons} onStartDateChanged={handleStartDateChanged} />
          </Route>
          <Route path='/s/:seasonId' render={({ match }) => (
            <SeasonDetail
              dispatch={dispatch}
              backendURI={backendURI}
              season={state.seasons.find((season) => String(season.sheetId) === match.params.seasonId)}
              seriesList={state.seriesForSeason}
              onStartDateChanged={handleStartDateChanged}
              onSeriesIdChanged={handleSeriesIdChanged} />
          )} />
        </Switch>
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
