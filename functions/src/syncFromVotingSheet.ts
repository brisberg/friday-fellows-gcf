import * as functions from 'firebase-functions';

import {SCOPES, SPREADSHEET_ID} from '../config'
import {getSheetsClient} from './google.auth';

export const syncFromVotingSheet = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES);
  const request = api.spreadsheets.get({spreadsheetId: SPREADSHEET_ID});
  try {
    const {data: {sheets}} = await request
    // This just prints out all Worksheet names as an example
    res.status(200).send({sheets});
  } catch (err) {
    res.status(500).send({err});
  }
});
