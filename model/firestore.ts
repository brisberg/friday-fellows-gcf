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

/** Model of a Season represented by a sheet in the voting sheet */
export interface SeasonModel {
  formattedName: string;  // ex. 'WINTER 2014'
  year: number;
  season: Season;
  sheetId: number;  // id of the sheet in the source SpreadSheet
  // date of the first episode viewing this season in mills. null if not set
  startDate: number|null;
  seriesStats: {[status in VotingStatus]: number};
}

// Sub-collection for all series documents under a season document
// All sub collections will use this key so they can be queried as a collection
// group
export const SERIES_COLLECTION = 'series';

// Pulled from AniList.co schema
export enum SeriesType {
  Unknown = 'Unknown',
  Series = 'TV',
  Short = 'TV_SHORT',
}

export function genSeriesId(seasonId: number, rowIndex: number): string {
  return `${seasonId}-${String(rowIndex).padStart(3, '0')}`;
}

export interface SeriesTitle {
  raw?: string;  // from spreadsheet
  english?: string;
  romaji?: string;
  native?: string;
}

/**
 * Model of a series combining the voting record from the sheet and metadata
 * from AniList
 */
export interface SeriesModel {
  // Row Index in the voting sheet of this series. Used to uniquely identify the
  // series if a AL Id has not been set
  rowIndex: number;
  title: SeriesTitle;
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
  Unknown = 0,
  Dropped,
  Watching,
  Completed,
  Continuing,
}

export interface SeriesVotingRecord {
  msg?: string;
  episodeNum: number;
  weekNum: number;
  votesFor: number;
  votesAgainst: number;
}

// Top level collection for storing generated ondeck reports
export const ONDECK_REPORTS_COLLECTION = 'ondeck-reports';

/** Model of a report of a set of episodes to be watched on a particular date */
export interface OnDeckReport {
  lastSync: number;         // last time voting sheet was synced
  created: number;          // date this report was created
  seasonName: string;       // e.g. FALL 2019
  week: number              // week number through the season
  targetWatchDate: number;  // expected date these episodes should be watched
  series: OnDeckReportRow[];
}

export interface OnDeckReportRow {
  title: SeriesTitle;
  episode: number;
}
