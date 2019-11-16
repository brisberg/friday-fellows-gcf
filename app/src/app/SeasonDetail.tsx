import React from 'react';
import './SeasonDetail.css';
import { useParams } from 'react-router-dom';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Tooltip, Icon, Paper } from '@material-ui/core';
import { SeasonModel } from '../../../model/firestore';

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
    table: {
      minWidth: 650,
    },
  }),
);

interface SeasonDetailProps {
  season: SeasonModel | undefined;
  onStartDateChanged: Function;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ season, onStartDateChanged }) => {
  const { seasonId } = useParams();
  const classes = useStyles();

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
      <p>{seasonId}</p>
      <p>{JSON.stringify(season)}</p>
    </div>
  );
}

export default SeasonDetail;
