import {OnDeckReport, SeasonModel, SeriesModel, SeriesVotingRecord, VotingStatus} from '../model/firestore';

/**
 * Calculate and update the voting status of all series and aggregate voting
 * stats of the given season.
 *
 * This take into account the current date relative to the start of the season.
 *
 * Returns a report of the next episodes to watch if this is the current season.
 */
export function aggregateVotingStatus(
    season: SeasonModel, series: SeriesModel[]): OnDeckReport|undefined {
  if (!season.startDate) {
    // TODO: Log a warning
    return;
  }
  const seasonStartDate = new Date(season.startDate);
  const weekNum = weeksBetween(seasonStartDate, new Date(Date.now())) + 1;

  if (weekNum > 13) {
    aggregateOlderSeason(season, series);
    return;
  } else {
    return aggregateCurrentSeason(season, series, weekNum);
  }
}

/**
 * Calculate and update the voting status of all series for this season
 * assuming that the season has already passed.
 */
function aggregateOlderSeason(season: SeasonModel, series: SeriesModel[]) {
  let remainingShows = 0;
  let lastVotingWeek = 0;

  series.forEach((model: SeriesModel) => {
    model.votingStatus = calculateOlderVotingStatus(model);
    season.seriesStats[model.votingStatus]++;

    if (model.votingStatus === VotingStatus.Watching ||
        model.votingStatus === VotingStatus.Completed) {
      remainingShows++;
    }

    const lastVote = model.votingRecord[model.votingRecord.length - 1];
    if (lastVote && lastVote.weekNum > lastVotingWeek) {
      lastVotingWeek = lastVote.weekNum;
    }
  });


  // Ensure we have at least 6 active shows. If not, bring back the ones with
  // the best records.
  reviveShowsIfLessThanSix(
      season, series, remainingShows, lastVotingWeek, VotingStatus.Completed);
}

/**
 * Calculates the voting status of a series assuming the watch period has
 * expired
 */
function calculateOlderVotingStatus(series: SeriesModel): VotingStatus {
  const lastRecord = series.votingRecord[series.votingRecord.length - 1];
  if (!didPass(lastRecord)) {
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
 */
function aggregateCurrentSeason(
    season: SeasonModel, series: SeriesModel[], weekNum: number): OnDeckReport {
  const targetDate = new Date(season.startDate!);
  targetDate.setDate(targetDate.getDate() + weekNum * 7);

  // Calculate voting status
  let remainingShows = 0;
  let lastVotingWeek = 0;
  series.forEach((model: SeriesModel) => {
    model.votingStatus = calculateCurrentVotingStatus(model, weekNum);
    season.seriesStats[model.votingStatus]++;

    if (model.votingStatus === VotingStatus.Watching ||
        model.votingStatus === VotingStatus.Completed) {
      remainingShows++;
    }

    const lastVote = model.votingRecord[model.votingRecord.length - 1];
    if (lastVote && lastVote.weekNum > lastVotingWeek) {
      lastVotingWeek = lastVote.weekNum;
    }
  });

  // Ensure we have at least 6 active shows. If not, bring back the ones with
  // the best records.
  reviveShowsIfLessThanSix(
      season, series, remainingShows, lastVotingWeek, VotingStatus.Watching);

  /*
   * Pad out PASS records for watching shows
   *
   *    We are likely in the final 6, assume that we watch one episode a week
   *      Iteratively add a PASS record, until we hit series.episode or weekNum
   */
  series.forEach((model: SeriesModel) => {
    if (model.votingStatus !== VotingStatus.Watching) {
      return;
    }

    const lastRecord = model.votingRecord[model.votingRecord.length - 1];
    const weeksSinceLastRecord = weekNum - lastRecord.weekNum;
    let nextEp = lastRecord.episodeNum + 1;
    for (let i = 1; i <= weeksSinceLastRecord; i++) {
      const passRecord: SeriesVotingRecord = {
        msg: 'PASS',
        weekNum: i + lastRecord.weekNum,
        episodeNum: nextEp,
        votesFor: 0,
        votesAgainst: 0,
      };
      nextEp++;

      // If we have finished the show, mark as Completed
      model.votingRecord.push(passRecord);
      if (passRecord.episodeNum === model.episodes) {
        model.votingStatus = VotingStatus.Completed;
        break;
      }
    }
  });

  // Compile report
  const report: OnDeckReport = {
    lastSync: -1,
    created: Date.now(),
    targetWatchDate: targetDate.getTime(),
    seasonName: season.formattedName,
    week: weekNum + 1,
    series: [],
  };
  report.series = series
                      .filter((model: SeriesModel) => {
                        return model.votingStatus === VotingStatus.Watching;
                      })
                      .map((model: SeriesModel) => {
                        return {
                          title: {raw: model.title.raw},
                          episode: calculateNextEpisode(model),
                        };
                      });

  return report;
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

  return VotingStatus.Watching;
}

/**
 * Ensure we have at least 6 active shows. If not, bring back the ones with
 * the best records.
 *
 * Mutates the series list by overwriting their Voting Status.
 */
function reviveShowsIfLessThanSix(
    season: SeasonModel, series: SeriesModel[], remaining: number,
    lastVotingWeek: number, status: VotingStatus) {
  let remainingShows = remaining;
  while (remainingShows < 6) {
    // Calculate the least bad or list of tied least bad dropped shows
    const leastBad = series.reduce((prev: SeriesModel[], model) => {
      if (model.votingStatus !== VotingStatus.Dropped) {
        return prev;
      }

      const lastVote = model.votingRecord[model.votingRecord.length - 1];
      const score = lastVote.votesFor / (lastVote.votesAgainst || 1);

      // Only consider shows still being voted on this week
      if (lastVote.weekNum !== lastVotingWeek) {
        return prev;
      }

      // If there are no prevously considered shows, use this one as base
      if (prev.length === 0) {
        return [model];
      }

      const prevVote = prev[0].votingRecord[prev[0].votingRecord.length - 1];
      const prevScore = prevVote.votesFor / (prevVote.votesAgainst || 1);
      if (score > prevScore) {
        // Only consider this show if it has a better score
        return [model];
      } else if (score === prevScore) {
        // If it matches exactly, we have a tie so return both
        prev.push(model);
        return prev;
      }

      return prev;
    }, []);

    if (leastBad.length === 0) {
      // There are no other dropped shows. This might mean we watched less than
      // 6 total shows in the first week, or some other data issue. Break out of
      // the loop to avoid inifinite.
      break;
    }

    // Resurrect them, keep going until we are above 6
    leastBad.forEach((model: SeriesModel) => {
      season.seriesStats[model.votingStatus]--;
      model.votingStatus = status;
      season.seriesStats[status]++;
      remainingShows++;
    });
  }
}


// Utilities

/** Calculate the number of weeks (rounded down) between two dates */
function weeksBetween(d1: Date, d2: Date) {
  return Math.floor((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/** Did this vote pass */
function didPass(record: SeriesVotingRecord) {
  return record.votesFor >= record.votesAgainst;
}

/** Determine the next episode to watch for a series given its voting record */
function calculateNextEpisode(series: SeriesModel) {
  const lastRecord = series.votingRecord[series.votingRecord.length - 1];
  return lastRecord.episodeNum + 1;
}
