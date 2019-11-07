import React, { useReducer } from 'react';
import logo from './logo.svg';
import './App.css';
import { reducer, initialState } from '../state/reducer';
import { AppActions } from '../state/actions';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchSeasonData = async () => {
    const resp = await fetch('https://us-central1-driven-utility-202807.cloudfunctions.net/getAllSeasons')
    const data = await resp.json();
    dispatch(AppActions.fetchSeasons(data));
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Friday Fellows Updater - Season List
        </p>
      </header>
      <div className="App-body">
        <div>
          <p>Seasons JSON:</p>
          <p>{state.seasonsJson}</p>
        </div>
      </div>
      <div className="App-footer">
        <button onClick={fetchSeasonData}>Fetch Season Data</button>
      </div>
    </div>
  );
}

export default App;
