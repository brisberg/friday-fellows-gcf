import React from 'react';
import './SeasonList.css';
import { SeasonModel } from '../state/reducer';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, CircularProgress, Tooltip } from '@material-ui/core';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    header: {
      ...theme.typography.button,
      padding: theme.spacing(1),
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: theme.spacing(2),
      width: 'fit-content',
      display: 'flex',
      alignItems: 'center',
    },
    title: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(2),
    },
    lastSync: {
      marginRight: theme.spacing(3),
    },
    root: {
      overflowX: 'auto',
      margin: '0 10px',
    },
    table: {
      minWidth: 650,
    },
  }),
);

interface SeasonListProps {
  seasons: SeasonModel[];
  lastSyncDate: Date | undefined;
  loading: boolean;
  onStartDateChanged: (date: Date | null, season: SeasonModel, index: number) => void;
}

function formatLastSyncDate(lastSyncDate: Date | undefined) {
  if (!lastSyncDate) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).format(lastSyncDate);
}

const SeasonList: React.FC<SeasonListProps> = ({ seasons, lastSyncDate, loading }) => {
  const classes = useStyles();

  return (
    <div>
      <Paper className={classes.header}>
        <span className={classes.title}>All Seasons</span>
        <Tooltip title="Last time data was read from GoogleSheets">
          <span className={classes.lastSync}>Last Sync:&nbsp;{formatLastSyncDate(lastSyncDate)}</span>
        </Tooltip>
      </Paper>
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
          {!loading &&
            <TableBody>
              {seasons.map((season) => (
                <TableRow key={season.sheetId}>
                  <TableCell component="th" scope="row">
                    <Link to={'/s/' + season.sheetId}>
                      {season.formattedName}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{season.season}</TableCell>
                  <TableCell align="right">{season.year}</TableCell>
                  <TableCell align="right">{season.startDate}</TableCell>
                  <TableCell align="right">{season.sheetId}</TableCell>
                </TableRow>
              ))}
            </TableBody>}
        </Table>
        {loading && <CircularProgress size={60} />}
      </Paper>
    </div>
  );
}

export default SeasonList;
