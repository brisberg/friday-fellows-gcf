import React from 'react';
import './SeasonList.css';
import { SeasonModel } from '../state/reducer';
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
import { Link } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    overflowX: 'auto',
    margin: '0 10px',
  },
  table: {
    minWidth: 650,
  },
});

interface SeasonListProps {
  seasons: SeasonModel[];
  onStartDateChanged: (date: Date | null, season: SeasonModel, index: number) => void;
}

const SeasonList: React.FC<SeasonListProps> = ({ seasons, onStartDateChanged }) => {
  const classes = useStyles({});

  return (
    <div>
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
            {seasons.map((season, index) => (
              <TableRow key={season.sheetId}>
                <TableCell component="th" scope="row">
                  <Link to={'/s/' + season.sheetId}>
                    {season.formattedName}
                  </Link>
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
                      onChange={(date) => { onStartDateChanged(date, season, index); }}
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
  );
}

export default SeasonList;
