import React from 'react';
import './SeasonList.css';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Paper, CircularProgress, Tooltip, Card } from '@material-ui/core';
import CardActionArea from '@material-ui/core/CardActionArea';
import { Link } from 'react-router-dom';
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
    },
    lastSync: {
      marginRight: theme.spacing(3),
    },
    root: {
      overflowX: 'auto',
      margin: '0 10px',
    },
    table: {
      padding: '15px',
      minWidth: 650,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridGap: theme.spacing(3),
    },
    gridCell: {
      minWidth: '150px',
      minHeight: '150px',
      textAlign: 'center',
      color: theme.palette.text.secondary,
      whiteSpace: 'nowrap',
    },
    cellLink: {
      textDecoration: 'none',
    },
    cellBtn: {
      height: '150px',
    },
    cellTitle: {
      height: '40%',
      verticalAlign: 'middle',
      lineHeight: '70px',
      fontSize: '30px',
    },
    cellDetails: {
      height: '50%',
      display: 'grid',
      gridTemplateRows: 'repeat(2, 1fr)',
      gridTemplateColumns: 'repeat(2, 1fr)',
      margin: '10px',
    },
    unknownLabel: {
      fontSize: '15px',
      backgroundColor: '#525252',
      color: '#e29e00',
      margin: 'auto',
      padding: '10px',
      borderRadius: '40px',
    },
    droppedLabel: {
      fontSize: '15px',
      backgroundColor: '#525252',
      color: '#e83f22',
      margin: 'auto',
      padding: '10px',
      borderRadius: '40px',
    },
    watchingLabel: {
      fontSize: '15px',
      backgroundColor: '#525252',
      color: '#42af42',
      margin: 'auto',
      padding: '10px',
      borderRadius: '40px',
    },
    completedLabel: {
      fontSize: '15px',
      backgroundColor: '#525252',
      color: '#4e92f9',
      margin: 'auto',
      padding: '10px',
      borderRadius: '40px',
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

  const SeasonGridCard = ({ season }: { season: SeasonModel }) => {
    return (
      <Link to={'/s/' + season.sheetId} className={classes.cellLink}>
        <Card className={classes.gridCell}>
          <CardActionArea className={classes.cellBtn}>
            <div className={classes.cellTitle}>{season.formattedName}</div>
            <div className={classes.cellDetails}>
              {season.seriesStats[0] > 0 &&
                <div className={classes.unknownLabel}>
                  Unknown {season.seriesStats[0]}
                </div>}
              {season.seriesStats[1] > 0 &&
                <div className={classes.droppedLabel}>
                  Dropped {season.seriesStats[1]}
                </div>}
              {season.seriesStats[2] > 0 &&
                <div className={classes.watchingLabel}>
                  Watching {season.seriesStats[2]}
                </div>}
              {season.seriesStats[3] > 0 &&
                <div className={classes.completedLabel}>
                  Completed {season.seriesStats[3]}
                </div>}
            </div>
          </CardActionArea>
        </Card>
      </Link>
    );
  }

  return (
    <div>
      <Paper className={classes.header}>
        <span className={classes.title}>All Seasons</span>
        <Tooltip title="Last time data was read from GoogleSheets">
          <span className={classes.lastSync}>Last Sync:&nbsp;{formatLastSyncDate(lastSyncDate)}</span>
        </Tooltip>
      </Paper>
      {/* TODO Add an empty state message and a loading spinner */}
      <Paper className={classes.root}>
        {!loading &&
          <div className={classes.table} aria-label="seasons grid">
            {seasons.map((season) => (
              <SeasonGridCard season={season}></SeasonGridCard>
            ))}
          </div>}
        {loading && <CircularProgress size={60} />}
      </Paper>
    </div>
  );
}

export default SeasonList;
