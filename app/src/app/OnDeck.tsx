import React from 'react';
import './OnDeck.css';
import Paper from '@material-ui/core/Paper';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';

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

const OnDeck: React.FC = () => {
  const classes = useStyles();

  const mockSeries = [
    { id: 1, title: 'Violet Evergarden', ep: 9 },
    { id: 2, title: 'One Piece', ep: 619 },
    { id: 3, title: 'Kyoukai no Kanata', ep: 10 },
    { id: 4, title: 'White Album 2', ep: 9 },
    { id: 5, title: 'My Hero Academia', ep: 8 },
    { id: 6, title: 'One Punch Man', ep: 10 },
  ];

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
          {/* TODO Add an empty state message and a loading spinner */}
          <TableBody>
            {mockSeries.map((series) => (
              <TableRow key={series.id}>
                <TableCell component="th" scope="row">{series.title}</TableCell>
                <TableCell align="right">{series.ep}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}

export default OnDeck;
