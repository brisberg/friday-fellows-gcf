import React, { useReducer, useEffect, useState } from 'react';
import './App.css';
import { reducer, initialState } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Switch, Redirect } from 'react-router-dom';
import SeasonList from './SeasonList';
import SeasonDetail from './SeasonDetail';
import AppHeader from './AppHeader';
import { SuccessSnackbar, ErrorSnackbar } from './Snackbars';
import OnDeck from './OnDeck';
import { SeasonModel, SeriesModel } from '../../../model/firestore';
import { SetSeasonStartDateRequest, SetSeriesIdRequest, GetOnDeckReportsResponse } from '../../../model/service';

interface AppProps {
  backendURI: string;
}

interface GetAllSeasonsResponse {
  seasons: SeasonModel[];
  lastSyncMs?: number;
}

const App: React.FC<AppProps> = ({ backendURI }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  useEffect(() => {
    const fetchOnDeckData = async () => {
      try {
        dispatch(AppActions.fetchOnDeckStart());
        const resp = await axios.get<GetOnDeckReportsResponse>(backendURI + '/getOnDeckReports');

        const { reports } = resp.data;
        if (reports && reports.length > 0) {
          dispatch(AppActions.fetchOnDeckSuccess({ report: reports[0] }));
        }
      } catch (e) {
        console.log(e);
        // TODO: dispatch fail action and log the error
      }
    }

    fetchOnDeckData();
  }, [backendURI]);

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
    try {
      const resp = await axios.post(backendURI + '/setSeriesId', payload)
      if (resp.status === 200) {
        dispatch(AppActions.setSeriesId({
          series: series,
          data: resp.data.data,
        }));
        setSuccessMsg(`Updated AniList ID for ${series.title.raw}`);
        setSuccessOpen(true);
      }
    } catch (e) {
      // console.log(e); // log the error
      setErrorMsg(`Error when updating AniList ID for ${series.title.raw}`);
      setErrorOpen(true);
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
            <OnDeck report={state.ondeck} loading={state.loadingOnDeck} />
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
      <SuccessSnackbar open={successOpen} msg={successMsg} handleClose={setSuccessOpen} />
      <ErrorSnackbar open={errorOpen} msg={errorMsg} handleClose={setErrorOpen} />
    </div>
  );
}

export default App;
