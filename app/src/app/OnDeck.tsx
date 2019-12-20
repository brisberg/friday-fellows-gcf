import React from 'react';
import './OnDeck.css';
import Paper from '@material-ui/core/Paper';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import { OnDeckReport } from '../../../model/firestore';
import { CircularProgress } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    header: {
      ...theme.typography.button,
      padding: theme.spacing(1),
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: theme.spacing(2),
      width: 'fit-content',
    },
    headerSegment: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    paperBody: {
      margin: 'auto',
      maxWidth: '60vw',
    },
    table: {
      minWidth: 650,
    },
  }),
);

interface OnDeckProps {
  report?: OnDeckReport;
  loading: boolean;
}

const OnDeck: React.FC<OnDeckProps> = ({ report, loading = false }) => {
  const classes = useStyles();

  return (
    <div>
      <Paper className={classes.header}>
        <span className={classes.headerSegment}>Fall 2019</span>
        <span className={classes.headerSegment}>Week 10</span>
        <span className={classes.headerSegment}>Next Session: 11/22/2019</span>
      </Paper>
      <Paper className={classes.paperBody}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Series Title (English)</TableCell>
              <TableCell align="right">Episode</TableCell>
            </TableRow>
          </TableHead>
          {!loading && report &&
            <TableBody>
              {report.series.map((series) => (
                <TableRow key={series.seriesTitle}>
                  <TableCell component="th" scope="row">{series.seriesTitle}</TableCell>
                  <TableCell align="right">{series.episode}</TableCell>
                </TableRow>
              ))}
            </TableBody>}
        </Table>
        {loading && <CircularProgress size={60} />}
      </Paper>
    </div>
  );
}

export default OnDeck;
