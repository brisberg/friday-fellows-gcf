/**
 * Database "schema" for the Friday Fellows Firestore instance.
 *
 * Because Firestore is a NoSQL database it does not enforce any kind of schema.
 * However, it helps to keep things consistent to allow for simple, efficient
 * queries.
 *
 * These domain models will also be used in cloud functions and throughout other
 * client portions of the system.
 */

// Top level collection for singleton config and status values
export const CONFIG_COLLECTION = 'config';
export const SYNC_STATE_KEY = 'sync-status';

// Top level collection for all season documents
export const SEASONS_COLLECTION = 'seasons';

export enum Season {
  UNKNOWN = 0,
  SPRING,
  SUMMER,
  FALL,
  WINTER,
}

export interface SeasonModel {
  formattedName: string;  // ex. 'WINTER 2014'
  year: number;
  season: Season;
  sheetId: number;  // id of the sheet in the source SpreadSheet
  // date of the first episode viewing this season in mills. null if not set
  startDate: number|null;
  // TODO: {aggregate: totals}
}

// Sub-collection for all series documents under a season document
// All sub collections will use this key so they can be queried as a collection
// group
export const SERIES_COLLECTION = 'series';

export enum SeriesType {
  Unknown = 'Unknown',
  Series = 'Series',
  Short = 'Short',
}

export interface SeriesModel {
  titleEn: string;
  type: SeriesType;
  idMal?: number;
  idAL?: number;
  episodes: number;
  seasonId: number|null;
  votingStatus: VotingStatus;
  votingRecord: SeriesVotingRecord[];
}

// Current voting status of a show
export const enum VotingStatus {
  Watching = 0,
  Dropped,
  Completed,
  Continuing,
}

export interface SeriesVotingRecord {
  seriesId: number;
  episodeNum: number;
  weekNum: number;
  votesFor: number;
  votesAgainst: number;
}
