import {SeasonModel, SeriesModel} from './firestore';

/**
 * Service messages for Friday Fellows Cloud Functions and client endpoints
 *
 */

// SetSeasonStartDate
export interface SetSeasonStartDateRequest {
  sheetId: number;
  startDate: number|null;
}
export interface SetSeasonStartDateResponse {
  data?: {};  // sheets_v4.Schema$BatchUpdateSpreadsheetResponse
  err?: string;
}

// GetAllSeasons
export interface GetAllSeasonsRequest {}
export interface GetAllSeasonsResponse {
  seasons: SeasonModel[];
  lastSyncMs: number|undefined;
}

// GetAllSeries
// Get all series or for a specific season if a season ID is specified
export interface GetAllSeriesRequest {
  seasonId?: number;
}
export interface GetAllSeriesResponse {
  series: SeriesModel[];
  err?: string;
}

// SyncFromVotingSheet
export interface SyncFromVotingSheetRequest {}
export interface SyncFromVotingSheetResponse {
  data?: {};  // sheets_v4.Schema$Spreadsheet
  err?: string;
}

// Set the AniList Id of a series in the voting sheet
export interface SetSeriesIdRequest {
  seasonId?: number;
  row?: number;
  seriesId?: number
}
export interface SetSeriesIdResponse {
  data?: {};  // wip
  err?: string;
}
