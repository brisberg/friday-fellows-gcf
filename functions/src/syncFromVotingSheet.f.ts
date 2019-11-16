import {Firestore} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import {GaxiosResponse} from 'gaxios';
import {sheets_v4} from 'googleapis';

import {PROJECT_ID, SCOPES_READONLY, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {CONFIG_COLLECTION, Season, SeasonModel, SEASONS_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {SyncFromVotingSheetResponse} from './model/service';
import {SpreadsheetModel, START_DATE_METADATA_KEY, WorksheetModel} from './model/sheets';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

exports = module.exports = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES_READONLY);

  const metadataFields = [
    'spreadsheetId',
    'properties.title',
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
    const seasonModels = extractSeasonDocuments(sheetModel);

    const batch = firestore.batch();
    const seasonCollection = firestore.collection(SEASONS_COLLECTION);

    for (const season of seasonModels) {
      const docRef = seasonCollection.doc(String(season.sheetId));
      batch.set(docRef, season);
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
    console.log(err);
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
      const metadataMap: {[key: string]: string} = {};
      if (sheet.developerMetadata) {
        sheet.developerMetadata.map((metadata) => {
          if (metadata.metadataKey && metadata.metadataValue) {
            metadataMap[metadata.metadataKey] = metadata.metadataValue;
          }
        })
      }

      return {
        title: sheet.properties!.title || '',
        sheetId: sheet.properties!.sheetId || 0,
        gridProperties: {
          rowCount: sheet.properties!.gridProperties!.rowCount || 0,
          columnCount: sheet.properties!.gridProperties!.columnCount || 0,
        },
        data: [],
        metadata: metadataMap,
      };
    });
  }

  sheetModel.sheets = sheets.reverse();
  return sheetModel;
}

/**
 * Extracts Season domain documents from a SpreadsheetModel suitable for storage
 * in Firestore.
 * @param model Domain model of a Voting Spreadsheet from GoogleSheets
 */
function extractSeasonDocuments(model: SpreadsheetModel) {
  const seasonDocs: SeasonModel[] = [];

  model.sheets.map((sheet: WorksheetModel) => {
    const startDateString = sheet.metadata[START_DATE_METADATA_KEY] || null;
    const startDateMs = parseInt(startDateString || '') || null;

    seasonDocs.push({
      sheetId: sheet.sheetId,
      formattedName: sheet.title,
      year: extractYear(sheet.title),
      season: extractSeason(sheet.title),
      startDate: startDateMs,
    });
  });

  return seasonDocs;
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
