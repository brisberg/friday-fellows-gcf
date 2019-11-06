import {Firestore} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import {GaxiosResponse} from 'gaxios';
import {sheets_v4} from 'googleapis';

import {PROJECT_ID, SCOPES_READONLY, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {Season, SeasonModel, SEASONS_COLLECTION} from './model/fridayfellows';
import {SpreadsheetModel, WorksheetModel} from './model/sheets';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

exports = module.exports = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES_READONLY);

  const metadataFields = [
    'spreadsheetId',
    'properties.title',
    'sheets.developerMetadata',
    'sheets.properties.sheetId',
    'sheets.properties.title',
    'sheets.properties.gridProperties',
  ].join(',');

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
      const docRef = seasonCollection.doc(season.formattedName);
      batch.set(docRef, season);
    }

    await batch.commit();

    res.status(200).send({data: resp.data});
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
      const combinedMD: {[key: string]: string} = {};
      if (sheet.developerMetadata) {
        sheet.developerMetadata.map((metadata) => {
          if (metadata.metadataKey && metadata.metadataValue) {
            combinedMD[metadata.metadataKey] = metadata.metadataValue;
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
        metadata: combinedMD,
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
    let startDate = '';
    if (sheet.metadata && sheet.metadata['foobar']) {
      startDate = sheet.metadata['foobar'];
    }

    seasonDocs.push({
      sheetId: sheet.sheetId,
      formattedName: sheet.title,
      year: extractYear(sheet.title),
      season: extractSeason(sheet.title),
      startDate,
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
