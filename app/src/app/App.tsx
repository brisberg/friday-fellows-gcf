import React, { useReducer } from 'react';
import logo from './logo.svg';
import './App.css';
import { reducer, initialState, SeasonModel } from '../state/reducer';
import { AppActions } from '../state/actions';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Icon, Tooltip } from '@material-ui/core';
import axios from 'axios';

const useStyles = makeStyles({
  root: {
    overflowX: 'auto',
    margin: '0 10px',
  },
  table: {
    minWidth: 650,
  },
});

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const classes = useStyles();

  const fetchSeasonData = async () => {
    const resp = await fetch('https://us-central1-driven-utility-202807.cloudfunctions.net/getAllSeasons')
    const data = await resp.json();
    dispatch(AppActions.fetchSeasons({ json: data }));
  };

  const handleStartDateChanged = async (newDate: Date | null, season: SeasonModel, index: number) => {
    const resp = await axios.post('https://us-central1-driven-utility-202807.cloudfunctions.net/setSeasonStartDate', {
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
        <p>
          Friday Fellows Updater - Season List
        </p>
      </header>
      <div className="App-body">
        <div>
          <p>Seasons JSON:</p>
          <Paper className={classes.root}>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Season Name</TableCell>
                  <TableCell align="right">Season</TableCell>
                  <TableCell align="right">Year</TableCell>
                  <TableCell align="right">Start&nbsp;Date&nbsp;(ms)</TableCell>
                  <TableCell align="right">Sheet&nbsp;ID</TableCell>
                </TableRow>
              </TableHead>
              {/* TODO Add an empty state message and a loading spinner */}
              <TableBody>
                {state.seasons.map((season, index) => (
                  <TableRow key={season.sheetId}>
                    <TableCell component="th" scope="row">
                      {season.formattedName}
                    </TableCell>
                    <TableCell align="right">{season.season}</TableCell>
                    <TableCell align="right">{season.year}</TableCell>
                    <TableCell align="right">
                      {season.startDate === null && <Tooltip title="Missing Start Date">
                        <Icon className="push-right warning-icon text-top">warning</Icon>
                      </Tooltip>}
                      <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <KeyboardDatePicker
                          disableToolbar
                          variant="inline"
                          format="MM/dd/yyyy"
                          autoOk={true}
                          value={season.startDate}
                          onChange={(date) => { handleStartDateChanged(date, season, index); }}
                          KeyboardButtonProps={{
                            'aria-label': 'change date',
                          }}
                        />
                      </MuiPickersUtilsProvider>
                    </TableCell>
                    <TableCell align="right">{season.sheetId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </div>
      </div>
      <div className="App-footer">
        <button onClick={fetchSeasonData}>Fetch Season Data</button>
      </div>
    </div>
  );
}

export default App;
