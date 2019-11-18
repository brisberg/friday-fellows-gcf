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
}

// SyncFromVotingSheet
export interface SyncFromVotingSheetRequest {}
export interface SyncFromVotingSheetResponse {
  data?: {};  // sheets_v4.Schema$Spreadsheet
  err?: string;
}
