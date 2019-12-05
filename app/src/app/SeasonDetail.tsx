import React, { useEffect, useState, ChangeEvent } from 'react';
import './SeasonDetail.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Tooltip, Icon, Paper, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, Button, DialogActions, DialogContent, TextField } from '@material-ui/core';
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

export interface SetSeriesIdDialog {
  open: boolean;
  initialValue?: number;
  onClose: (value: number) => void;
}

function SetSeriesIdDialog(props: SetSeriesIdDialog) {
  // const classes = useStyles();
  const { onClose, open, initialValue = 0 } = props;
  const [value, setValue] = useState(initialValue);

  const handleClose = () => {
    onClose(value);
  };

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
  onSeriesIdChanged: (series: SeriesModel, seasonId: number, index: number, seriesId: number) => void;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ dispatch, backendURI, season, seriesList = [], onStartDateChanged, onSeriesIdChanged }) => {
  const { seasonId } = useParams();
  const [idDialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
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

  const openSeriesIdDialog = (row: number) => {
    setEditingIndex(row);
    setDialogOpen(true);
  }

  const handleSeriesIdDialogConfirm = (seriesId: number) => {
    setDialogOpen(false);
    const series = seriesList[editingIndex];
    onSeriesIdChanged(series, season.sheetId, editingIndex, seriesId);
    setEditingIndex(-1);
  }

  const DialogButton = ({ onClick, index }: { onClick: Function, index: number }) => {
    const handleClick = () => {
      onClick(index);
    };

    return (<Button onClick={handleClick}>Edit</Button>);
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
            {seriesList.map((series, index) => (
              <TableRow key={series.titleEn}>
                <TableCell component="th" scope="row">
                  {series.titleEn}
                </TableCell>
                <TableCell align="right">{series.idAL}</TableCell>
                <TableCell align="right">{series.idMal}</TableCell>
                <TableCell align="right">{series.type}</TableCell>
                <TableCell align="right">{series.episodes}</TableCell>
                <TableCell>
                  <DialogButton onClick={openSeriesIdDialog} index={index} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <SetSeriesIdDialog open={idDialogOpen} onClose={handleSeriesIdDialogConfirm} initialValue={0}></SetSeriesIdDialog>
    </div>
  );
}

export default SeasonDetail;
