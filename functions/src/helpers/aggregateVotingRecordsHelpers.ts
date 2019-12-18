import {SeasonModel, SeriesModel, SeriesVotingRecord, VotingStatus} from '../model/firestore';

/**
 * Calculate and update the voting status of all series and aggregate voting
 * stats of the given season.
 *
 * This take into account the current date relative to the start of the season.
 */
export function aggregateVotingStatus(
    season: SeasonModel, series: SeriesModel[]) {
  if (!season.startDate) {
    // TODO: Log a warning
    return;
  }
  const seasonStartDate = new Date(season.startDate);
  const weekNum = weeksBetween(seasonStartDate, new Date(Date.now()));

  if (weekNum > 13) {
    aggregateOlderSeason(season, series);
  } else {
    aggregateCurrentSeason(season, series, weekNum);
  }
}

/**
 * Calculate and update the voting status of all series for this season
 * assuming that the season has already passed.
 *
 * TODO: Apply the aggregate watching/completed/dropped stats to season model
 */
function aggregateOlderSeason(season: SeasonModel, series: SeriesModel[]) {
  series.forEach((model: SeriesModel) => {
    model.votingStatus = calculateOlderVotingStatus(model);
  });
}

/**
 * Calculates the voting status of a series assuming the watch period has
 * expired
 */
function calculateOlderVotingStatus(series: SeriesModel): VotingStatus {
  const lastRecord = series.votingRecord[series.votingRecord.length - 1];
  if (lastRecord.votesAgainst > lastRecord.votesFor) {
    return VotingStatus.Dropped;
  } else {
    return VotingStatus.Completed;
  }
}

/**
 * Calculate and update the voting status of all series for the season
 * assuming the given number of weeks have passed since the start of the season.
 *
 * weekNum is the 1-index number of weeks since the start of the season.
 *
 * TODO: Apply the aggregate watching/completed/dropped stats to season model
 */
function aggregateCurrentSeason(
    season: SeasonModel, series: SeriesModel[], weekNum: number) {
  series.forEach((model: SeriesModel) => {
    model.votingStatus = calculateCurrentVotingStatus(model, weekNum);
  });
}

/**
 * Calculates the current VotingStatus of the series from it's voting records,
 * and the number of weeks it has been since the season start and the episode
 * length of the series.
 *
 *
 * If record not passing = DROPPED
 * If passing
 *    If record/episode = series/episodes = COMPLETED
 *    record week number matches current week = WATCHING
 *
 *    We are likely in the final 6, assume that we watch one episode a week
 *      Iteratively add a PASS record, until we hit series.episode or weekNum
 */
function calculateCurrentVotingStatus(
    series: SeriesModel, weekNum: number): VotingStatus {
  const records = series.votingRecord;

  if (!records || records.length === 0) {
    return VotingStatus.Unknown;
  }

  const lastRecord = records[records.length - 1];
  if (!didPass(lastRecord)) {
    return VotingStatus.Dropped;
  }

  // We passed the last episode of the series
  if (lastRecord.episodeNum === series.episodes) {
    return VotingStatus.Completed;
  }

  if (lastRecord.weekNum > weekNum) {
    // We have a record from the future which shouldn't happen
    // TODO: log a warning
    return VotingStatus.Unknown;
  }

  if (lastRecord.weekNum === weekNum) {
    return VotingStatus.Watching;
  }

  const weeksSinceLastRecord = weekNum - lastRecord.weekNum;
  let nextEp = lastRecord.episodeNum + 1;
  for (let i = 1; i <= weeksSinceLastRecord; i++) {
    const passRecord: SeriesVotingRecord = {
      weekNum: i + lastRecord.weekNum,
      episodeNum: nextEp,
      votesFor: 0,
      votesAgainst: 0,
    };
    nextEp++;

    series.votingRecord.push(passRecord);
    if (passRecord.episodeNum === series.episodes) {
      return VotingStatus.Completed;
    }
  }

  // TODO: Save this series to the OnDeck report as this is an ongoing series
  return VotingStatus.Watching;
}


// Utilities

/** Calculate the number of weeks between two dates */
function weeksBetween(d1: Date, d2: Date) {
  return Math.round((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/** Did this vote pass */
function didPass(record: SeriesVotingRecord) {
  return record.votesFor >= record.votesAgainst;
}
