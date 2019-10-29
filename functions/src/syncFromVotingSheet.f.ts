import {Firestore} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import {GaxiosResponse} from 'gaxios';
import {sheets_v4} from 'googleapis';

import {PROJECT_ID, SCOPES, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {SpreadsheetModel, WorksheetModel} from './model/sheets';

const COLLECTION_NAME = 'sheets-collection';
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

exports = module.exports = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES);

  const metadataFields = [
    'spreadsheetId',
    'properties.title',
    'sheets.properties.sheetId',
    'sheets.properties.title',
    'sheets.properties.gridProperties',
  ].join(',');

  const request = api.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: metadataFields,
  });
  try {
    const sheetModel = await request.then(handleSpreadsheetsGetResponse);

    await firestore.collection(COLLECTION_NAME).add({sheetsData: sheetModel});

    res.status(200).send({sheetModel});
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
      return {
        title: sheet.properties!.title || '',
        sheetId: sheet.properties!.sheetId || 0,
        gridProperties: {
          rowCount: sheet.properties!.gridProperties!.rowCount || 0,
          columnCount: sheet.properties!.gridProperties!.columnCount || 0,
        },
        data: [],
      };
    });
  }

  sheetModel.sheets = sheets.reverse();
  return sheetModel;
}
