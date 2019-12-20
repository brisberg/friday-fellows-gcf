import React, { useEffect, useState, ChangeEvent } from 'react';
import './SeasonDetail.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Tooltip, Icon, Paper, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, Button, DialogActions, DialogContent, TextField } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { SeasonModel, SeriesModel } from '../../../model/firestore';
import { AppActions } from '../state/actions';
import { GetAllSeriesResponse } from '../../../model/service';

// TODO: This is copied from model/firestore due to Webpack not being able to transplie files across
// symlinks. We should find a way to share this file between the projects/
// Current voting status of a show
enum VotingStatus {
  Unknown = 0,
  Dropped,
  Watching,
  Completed,
  Continuing,
}

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

export interface SetSeriesIdDialog {
  open: boolean;
  series: SeriesModel | null;
  onClose: (value: number) => void;
}

function SetSeriesIdDialog(props: SetSeriesIdDialog) {
  const { onClose, open, series } = props;
  const [value, setValue] = useState<number>(series ? series.idAL || 0 : 0);

  const handleClose = () => {
    onClose(value);
  };

  useEffect(() => {
    if (open) {
      setValue(series ? series.idAL || 0 : 0);
    }
  }, [open, series]);

  const valueChanged = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value));
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="set-id-dialog-title"
      aria-describedby="set-id-dialog-description"
    >
      <DialogTitle id="set-id-dialog-title">{"Set AniList.co Id for Series"}</DialogTitle>
      <DialogContent>
        <TextField
          id="id-input"
          label="AniList Id"
          type="number"
          variant="outlined"
          // className={classes.textField}
          InputLabelProps={{
            shrink: true,
          }}
          margin="normal"
          value={value}
          onChange={valueChanged}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Confirm
          </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SeasonDetailProps {
  dispatch: Function;
  backendURI: string;
  season: SeasonModel | undefined;
  seriesList: SeriesModel[];
  onStartDateChanged: (newDate: Date | null, season: SeasonModel) => void;
  onSeriesIdChanged: (series: SeriesModel, seasonId: number, seriesId: number) => void;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ dispatch, backendURI, season, seriesList = [], onStartDateChanged, onSeriesIdChanged }) => {
  const { seasonId } = useParams();
  const [idDialogOpen, setDialogOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesModel | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
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

  const openSeriesIdDialog = (series: SeriesModel) => {
    setSelectedSeries(series);
    setDialogOpen(true);
  }

  const handleSeriesIdDialogConfirm = (seriesId: number) => {
    setDialogOpen(false);
    if (selectedSeries && selectedSeries.idAL !== seriesId) {
      onSeriesIdChanged(selectedSeries, season.sheetId, seriesId);
    }
    setSelectedSeries(null);
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
        <ToggleButton
          value="debug"
          selected={showDebug}
          onChange={() => {
            setShowDebug(!showDebug);
          }}>
          {/* <BugReportIcon /> */}
          Debug
        </ToggleButton>
      </Paper>
      {showDebug && <SeriesDebugGrid seriesList={seriesList} openIDDialog={openSeriesIdDialog}></SeriesDebugGrid>}
      {!showDebug && <SeriesVotingGrid seriesList={seriesList}></SeriesVotingGrid>}

      <SetSeriesIdDialog open={idDialogOpen} onClose={handleSeriesIdDialogConfirm} series={selectedSeries}></SetSeriesIdDialog>
    </div>
  );
}

function SeriesVotingGrid({ seriesList }: { seriesList: SeriesModel[] }) {
  const classes = useStyles();

  const maxWeeks = seriesList.reduce((max, series) => {
    const weekNum = series.votingRecord[series.votingRecord.length - 1].weekNum;
    if (weekNum > max) {
      return weekNum;
    } else {
      return max;
    }
  }, 0);

  const headers = [];
  for (let i = 1; i <= maxWeeks; i++) {
    headers.push(<TableCell key={i} align="right">Week {i}</TableCell>)
  }

  return (
    <Paper className={classes.root}>
      <Table className={classes.table} aria-label="series voting grid">
        <TableHead>
          <TableRow>
            <TableCell>Series Name</TableCell>
            <TableCell>Status</TableCell>
            {headers}
          </TableRow>
        </TableHead>
        <TableBody>
          {seriesList.map((series) => (
            <TableRow key={series.rowIndex}>
              <TableCell component="th" scope="row">
                {series.titleRaw}
              </TableCell>
              <TableCell>{VotingStatus[series.votingStatus]}</TableCell>
              {series.votingRecord.map((record) => (
                <TableCell align="right">{
                  record.msg ? record.msg : [
                    'Ep', record.episodeNum, ':',
                    record.votesFor, '-', record.votesAgainst]
                    .join(' ')}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function SeriesDebugGrid({ seriesList, openIDDialog }: { seriesList: SeriesModel[], openIDDialog: (series: SeriesModel) => void }) {
  const classes = useStyles();

  const DialogButton = ({ onClick, series }: { onClick: Function, series: SeriesModel }) => {
    const handleClick = () => {
      onClick(series);
    };

    return (<Button onClick={handleClick}>Edit</Button>);
  }

  return (
    <Paper className={classes.root}>
      <Table className={classes.table} aria-label="series debug grid">
        <TableHead>
          <TableRow>
            <TableCell>Series Name&nbsp;(Raw)</TableCell>
            <TableCell>Series Name&nbsp;(AniList)</TableCell>
            <TableCell align="right">AniList&nbsp;ID</TableCell>
            <TableCell align="right">MAL&nbsp;ID</TableCell>
            <TableCell align="right">Type</TableCell>
            <TableCell align="right">Episodes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seriesList.map((series) => (
            <TableRow key={series.rowIndex}>
              <TableCell component="th" scope="row">
                {series.titleRaw}
              </TableCell>
              <TableCell>{series.titleEn}</TableCell>
              <TableCell align="right">{series.idAL}</TableCell>
              <TableCell align="right">{series.idMal}</TableCell>
              <TableCell align="right">{series.type}</TableCell>
              <TableCell align="right">{series.episodes}</TableCell>
              <TableCell>
                <DialogButton onClick={openIDDialog} series={series} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default SeasonDetail;
