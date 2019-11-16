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
  metadata: {[key: string]: string}
}

export interface WorksheetRowModel {
  cells: string[];
  metadata: {[key: string]: string}
}
