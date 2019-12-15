import {SeriesVotingRecord, VotingStatus} from '../model/firestore';

/**
 * Calculates the current VotingStatus of the series from it's voting records,
 * the current season start date, the current date, and episode count.
 */
export function calculateVotingStatus(
    records: SeriesVotingRecord[], startDate: Date,
    numEpisodes: number): VotingStatus {
  return VotingStatus.Watching;
}
