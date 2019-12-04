import React, { useEffect } from 'react';
import './SeasonDetail.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Tooltip, Icon, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { SeasonModel, SeriesModel } from '../../../model/firestore';
import { AppActions } from '../state/actions';
import { GetAllSeriesResponse } from '../../../model/service';

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
      fontSize: '20px',
    },
    datePicker: {
      margin: 0,
    },
    paperBody: {
      margin: 'auto',
      maxWidth: '60vw',
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

interface SeasonDetailProps {
  dispatch: Function;
  backendURI: string;
  season: SeasonModel | undefined;
  seriesList: SeriesModel[];
  onStartDateChanged: Function;
  onSeriesIdChanged: Function;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ dispatch, backendURI, season, seriesList = [], onStartDateChanged, onSeriesIdChanged }) => {
  const { seasonId } = useParams();
  const classes = useStyles();

  // Load all season data on start using effect Hook
  // https://www.robinwieruch.de/react-hooks-fetch-data
  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        dispatch(AppActions.fetchSeriesStart());
        const resp = await axios.get<GetAllSeriesResponse>(backendURI + '/getSeries?seasonId=' + seasonId);

        dispatch(AppActions.fetchSeriesSuccess({ json: resp.data.series }));
      } catch (e) {
        console.log(e);
        // this.setState({...this.state, isFetching: false});
      }
    }

    fetchSeriesData();
  }, [dispatch, backendURI, seasonId])

  if (!season) {
    return null;
  }

  return (
    <div>
      <Paper className={classes.header}>
        <span className={classes.title}>{season.formattedName}</span>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            className={classes.datePicker}
            label="Start Date"
            disableToolbar
            inputVariant="outlined"
            variant="inline"
            format="MM/dd/yyyy"
            autoOk={true}
            value={season.startDate}
            onChange={(date) => { onStartDateChanged(date, season); }}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
            margin="dense"
          />
        </MuiPickersUtilsProvider>
        {season.startDate === null && <Tooltip title="Missing Start Date">
          <Icon className="push-left warning-icon text-top">warning</Icon>
        </Tooltip>}
      </Paper>
      <Paper className={classes.root}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Series Name</TableCell>
              <TableCell align="right">AniList&nbsp;ID</TableCell>
              <TableCell align="right">MAL&nbsp;ID</TableCell>
              <TableCell align="right">Type</TableCell>
              <TableCell align="right">Episodes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seriesList.map((series) => (
              <TableRow key={series.titleEn}>
                <TableCell component="th" scope="row">
                  {series.titleEn}
                </TableCell>
                <TableCell align="right">{series.idAL}</TableCell>
                <TableCell align="right">{series.idMal}</TableCell>
                <TableCell align="right">{series.type}</TableCell>
                <TableCell align="right">{series.episodes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}

export default SeasonDetail;
