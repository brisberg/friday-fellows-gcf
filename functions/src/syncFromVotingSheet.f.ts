import {Firestore} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import {GaxiosResponse} from 'gaxios';
import {sheets_v4} from 'googleapis';

import {PROJECT_ID, SCOPES_READONLY, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {CONFIG_COLLECTION, Season, SeasonModel, SEASONS_COLLECTION, SERIES_COLLECTION, SeriesModel, SeriesType, SYNC_STATE_KEY, VotingStatus} from './model/firestore';
import {SyncFromVotingSheetResponse} from './model/service';
import {SpreadsheetModel, START_DATE_METADATA_KEY, WorksheetModel, WorksheetRowModel} from './model/sheets';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

exports = module.exports = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES_READONLY);

  const metadataFields = [
    'spreadsheetId',
    'properties.title',
    'sheets.data.rowData.values.effectiveValue',
    'sheets.data.rowMetadata.developerMetadata',
    'sheets.developerMetadata',  // Metadata for the sheet
    'sheets.properties.sheetId',
    'sheets.properties.title',
    'sheets.properties.gridProperties',
  ].join(',');

  // 'sheets.data.rowMetadata' // Metadata for the specific row

  const request = api.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: metadataFields,
  });
  try {
    const resp = await request;

    const sheetModel = handleSpreadsheetsGetResponse(resp);
    const allDocuments = extractFirestoreDocuments(sheetModel);

    const batch = firestore.batch();
    const seasonCollection = firestore.collection(SEASONS_COLLECTION);

    for (const docsTuple of allDocuments) {
      const {season, seriesList} = docsTuple;
      const seasonRef = seasonCollection.doc(String(season.sheetId));
      batch.set(seasonRef, season);

      for (const series of seriesList) {
        const seriesRef = seasonRef.collection(SERIES_COLLECTION).doc();
        batch.set(seriesRef, series);
      }
    }

    // Record the timestamp of the latest sync
    const syncTimestamp = new Date().getTime();
    batch.set(
        firestore.doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY),
        {lastSync: syncTimestamp});

    await batch.commit();

    const payload: SyncFromVotingSheetResponse = {
      data: resp.data,
    };
    res.status(200).send(payload);
  } catch (err) {
    res.status(500).send({err});
  }
});

/**
 * Convert a response from spreadsheets.get into a SpreadsheetModel domain
 * object.
 */
function handleSpreadsheetsGetResponse(
    res: GaxiosResponse<sheets_v4.Schema$Spreadsheet>): SpreadsheetModel {
  const data = res.data;

  const sheetModel: SpreadsheetModel = {
    spreadsheetId: data.spreadsheetId || '',
    title: data.properties!.title || '',
    sheets: [],
  };

  let sheets: WorksheetModel[] = [];
  if (data.sheets) {
    sheets = data.sheets.map((sheet): WorksheetModel => {
      // Extract the developer metadata into key-value pairs
      const metadataMap: {[key: string]: string} = {};
      if (sheet.developerMetadata) {
        sheet.developerMetadata.map((metadata) => {
          if (metadata.metadataKey && metadata.metadataValue) {
            metadataMap[metadata.metadataKey] = metadata.metadataValue;
          }
        })
      }

      let rows: WorksheetRowModel[] = [];
      rows = handleSheetRowData(sheet.data![0]);

      return {
        title: sheet.properties!.title || '',
        sheetId: sheet.properties!.sheetId || 0,
        gridProperties: {
          rowCount: sheet.properties!.gridProperties!.rowCount || 0,
          columnCount: sheet.properties!.gridProperties!.columnCount || 0,
        },
        data: rows,
        metadata: metadataMap,
      };
    });
  }

  sheetModel.sheets = sheets.reverse();
  return sheetModel;
}

/**
 * Extract a set of WorksheetRowModels from the gridData portion of a
 * SpreadSheets.get response
 */
function handleSheetRowData(data: sheets_v4.Schema$GridData):
    WorksheetRowModel[] {
  const result: WorksheetRowModel[] = [];
  if (data.rowData && data.rowMetadata) {
    const metadataByRow: MetadataMapByRow =
        extractMetadataByRowIndex(data.rowMetadata);

    data.rowData.shift();  // Remove the title row
    for (let i = 0; i < data.rowData.length; i++) {
      const row = data.rowData[i];
      const rowMeta = metadataByRow[i + 1] || {};

      result.push({
        cells: row.values!.map((cell) => {
          if (!cell.effectiveValue) {
            return '';
          } else {
            return cell.effectiveValue.stringValue || '';
          }
        }),
        metadata: rowMeta,
      });
    }
  }
  return result;
}

type MetadataMapByRow = {
  [key: number]: {[key: string]: string}
};

function extractMetadataByRowIndex(
    dimProps: sheets_v4.Schema$DimensionProperties[]): MetadataMapByRow {
  const metadataMap: MetadataMapByRow = {};
  dimProps.forEach((rowMetadata) => {
    if (!rowMetadata.developerMetadata) {
      return;
    }

    for (const metadata of rowMetadata.developerMetadata) {
      const rowIndex = metadata.location!.dimensionRange!.startIndex!;
      if (!metadataMap[rowIndex]) {
        metadataMap[rowIndex] = {};
      }
      if (metadata.metadataKey && metadata.metadataValue) {
        metadataMap[rowIndex][metadata.metadataKey] = metadata.metadataValue;
      }
    }
  })

  return metadataMap;
}

interface SeasonSeriesDocuments {
  season: SeasonModel;
  seriesList: SeriesModel[];
}
/**
 * Extracts Season domain documents from a SpreadsheetModel suitable for storage
 * in Firestore.
 * @param model Domain model of a Voting Spreadsheet from GoogleSheets
 */
function extractFirestoreDocuments(model: SpreadsheetModel) {
  const results: SeasonSeriesDocuments[] = [];

  model.sheets.map((sheet: WorksheetModel) => {
    const startDateString = sheet.metadata[START_DATE_METADATA_KEY] || null;
    const startDateMs = parseInt(startDateString || '') || null;

    results.push({
      season: {
        sheetId: sheet.sheetId,
        formattedName: sheet.title,
        year: extractYear(sheet.title),
        season: extractSeason(sheet.title),
        startDate: startDateMs,
      },
      seriesList: extractSeriesDocuments(sheet.data),
    });
  });

  return results;
}

/** Extracts Firestore Series documents from a worksheet row */
function extractSeriesDocuments(rows: WorksheetRowModel[]): SeriesModel[] {
  return rows.map((row) => {
    return {
      titleEn: row.cells[0],
      seasonId: null,
      type: SeriesType.Series,
      episodes: -1,
      votingStatus: VotingStatus.Watching,
      votingRecord: [],
    };
  });
}


/// Utils

/**
 * Extracts the numerical year from a season sheet title.
 * @param title Sheet title (Ex. 'WINTER 2015')
 */
function extractYear(title: string): number {
  return parseInt(title.split(' ')[1]);
}

/**
 * Extracts the numerical year from a season sheet title.
 * @param title Sheet title (Ex. 'WINTER 2015')
 */
function extractSeason(title: string): Season {
  try {
    return Season[title.split(' ')[0] as keyof typeof Season];
  } catch (e) {
    console.warn('Could not parse season name from: ' + title);
    return Season.UNKNOWN;
  }
}

export interface ParsedCellInfo {
  episode: number;
  votesFor: number;
  votesAgainst: number;
}

/**
 * @param {number} index column index of this cell
 * @param {string} value string of the form "Ep. <epNum>: <votesFor> to
 * <votesAgainst>" to parse into its variable parts.
 * @return {ParsedCellInfo} Wrapper for episodes, votesFor and
 * VotesAgainst.
 */
export function parseVoteCell(value: string): ParsedCellInfo {
  const parts = value.split(' ');
  const episode = parseInt(parts[1].slice(0, -1));
  const votesFor = parseInt(parts[2]);
  const votesAgainst = parseInt(parts[4]);
  return {episode, votesFor, votesAgainst};
}
