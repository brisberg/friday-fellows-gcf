import React, { useReducer } from 'react';
import logo from './logo.svg';
import './App.css';
import { reducer, initialState, SeasonModel } from '../state/reducer';
import { AppActions } from '../state/actions';
import axios from 'axios';
import { Route, Link, Switch, useParams } from 'react-router-dom';
import SeasonList from '../season-list/SeasonList'

interface AppProps {
  backendURI: string;
}

const App: React.FC<AppProps> = (props) => {
  const { backendURI } = props;
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchSeasonData = async () => {
    const resp = await fetch(backendURI + '/getAllSeasons')
    const data = await resp.json();
    dispatch(AppActions.fetchSeasons({ json: data }));
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Friday Fellows Updater - Season List</p>
      </header>
      <div className="App-body">
        <Switch>
          <Route exact={true} path="/">
            <SeasonList seasons={state.seasons} onStartDateChanged={handleStartDateChanged} />
          </Route>
          <Route path="/s/:seasonId" component={SeasonDetail} />
        </Switch>
      </div>
      <div className="App-footer">
        <button onClick={fetchSeasonData}>Fetch Season Data</button>
      </div>
    </div>
  );
}

function SeasonDetail() {
  const { seasonId } = useParams();
  return (
    <div>
      <Link to={"/"}>Back</Link>
      <p>{seasonId}</p>
    </div>
  );
}

export default App;
