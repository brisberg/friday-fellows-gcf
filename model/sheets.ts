import {SeriesTitle} from './firestore';

/**
 * Set of type interfaces for storing and interacting with spreadsheets data.
 */

export interface SpreadsheetModel {
  spreadsheetId: string;
  title: string;
  sheets: WorksheetModel[];
}

/**
 * Metadata key for the Sheet level DeveloperMetadata to store the season start
 * date
 */
export const START_DATE_METADATA_KEY = 'season-start-date';

export interface WorksheetModel {
  sheetId: number;
  title: string;
  gridProperties: {rowCount?: number; columnCount?: number;};
  data: WorksheetRowModel[];
  metadata: {[key: string]: string};
}

/**
 * Metadata key for the Anilist.co Id for the series associated with this row.
 */
export const SERIES_AL_ID_KEY = 'series-anilist-id';
/** Payload to stringify as the value for the seriesID metadata */
export interface SeriesMetadataPayload {
  alId: number;
  malId: number;
  type: string;
  episodes: number;
  title: SeriesTitle;
}

/**
 * Metadata key for the type ('SERIES', 'SHORT') of the series associated with
 * this row.
 */
export const SERIES_TYPE_KEY = 'series-type';
/**
 * Metadata key for total episode count of the series associated with this
 * row.
 */
export const SERIES_EPISODE_COUNT_KEY = 'series-episode-count';

export interface WorksheetRowModel {
  cells: string[];
  metadata: {[key: string]: string};
}
