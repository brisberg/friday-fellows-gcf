import React from 'react';
import { SeasonModel } from '../state/reducer';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@material-ui/core';
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
  onStartDateChanged: (date: Date | null, season: SeasonModel, index: number) => void;
}

const SeasonList: React.FC<SeasonListProps> = ({ seasons }) => {
  const classes = useStyles();

  return (
    <div>
      <Paper className={classes.header}>
        <span className={classes.title}>All Seasons</span>
        <span className={classes.lastSync}>Last Sync:</span>
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
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}

export default SeasonList;
