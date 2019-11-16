import {Firestore} from '@google-cloud/firestore';
import * as Cors from 'cors';
import * as functions from 'firebase-functions';

import {PROJECT_ID, SCOPES, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {getUpsertSheetMetadata} from './helpers/upsertDevMetadata'
import {SEASONS_COLLECTION} from './model/firestore';
import {SetSeasonStartDateRequest, SetSeasonStartDateResponse} from './model/service';
import {START_DATE_METADATA_KEY} from './model/sheets';

// Global API Clients declared outside function scope
// https://cloud.google.com/functions/docs/bestpractices/tips#use_global_variables_to_reuse_objects_in_future_invocations
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

const cors = Cors({
  origin: true,
});


// Testing (Made spreadsheet publicly editable for the moment)
// TODO: Figure out service account editing permissions
// curl -X POST -H 'Content-Type: application/json' -d '{"sheetId": 1242888778,
// "startDate": 5432}'
// https://localhost:5001/driven-utility-202807/setSeasonStartDate

exports = module.exports = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const reqBody: SetSeasonStartDateRequest = req.body;
    const {sheetId, startDate} = reqBody;

    if (!startDate) {
      res.status(400).send({err: 'startDate must be set and a number'});
      return;
    }

    console.log('sheetId: ' + sheetId + ', startDate: ' + startDate);

    const api = await getSheetsClient(SCOPES);

    const requests = await getUpsertSheetMetadata(
        api, sheetId, START_DATE_METADATA_KEY, String(startDate));

    const request = api.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    try {
      const resp = await request;

      // Update Firestore if write to sheets suceeded
      await firestore.collection(SEASONS_COLLECTION)
          .doc(String(sheetId))
          .update({startDate});

      const payload: SetSeasonStartDateResponse = {
        data: resp.data,
      };
      res.status(200).send(payload);
    } catch (err) {
      console.log(JSON.stringify(err));
      res.status(500).send({err});
    }
  });
});
