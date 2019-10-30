/**
 * Set of type definitions for FridayFellows domain models. These will be used
 * internally in Firestore and act as the common storage medium between the
 * different service models.
 */

// Top level collection for all season documents
export const SEASONS_COLLECTION = 'seasons';

export enum Season {
  UNKNOWN = 0,
  SPRING,
  SUMMER,
  FALL,
  WINTER,
}

export const START_DATE_METADATA_KEY = 'season-start-date';
export interface SeasonModel {
  formattedName: string;  // ex. 'WINTER 2014'
  year: number;
  season: Season;
  sheetId: number;  // id of the sheet in the source SpreadSheet
  startDate: string;
}

// Top level collection for all series documents
export const SERIES_COLLECTION = 'series';

export enum SeriesType {
  Series,
  Short,
}

export interface SeriesModel {
  titleEn: string;
  type: SeriesType;
  idMal?: number;
  idAL?: number;
  episodes: number;
  seasonIds: number[];
}

// Top level collection for all series documents
export const VOTING_RECORDS_COLLECTION = 'voting-records';

// Current voting status of a show
export enum VotingStatus {
  Watching = 0,
  Dropped,
  Completed,
  Continuing,
}

export interface SeriesVotingRecord {
  series: SeriesModel;
  status: VotingStatus;
  startedWeek: number;
  completedWeek?: number;
}


/// Export to List Service models
export enum WatchStatus {
  Watching = 0,
  Dropped,
  Completed,
}

export interface AnimeListRecord {
  series: SeriesModel;
  status: WatchStatus;
  startDate: Date;
  completedDate?: Date;
  tags: string[];
  score?: number;
  progress: number;
}
