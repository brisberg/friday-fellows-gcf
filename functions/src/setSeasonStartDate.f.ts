import {Firestore} from '@google-cloud/firestore';
import * as Cors from 'cors';
import * as functions from 'firebase-functions';
import {sheets_v4} from 'googleapis';

import {PROJECT_ID, SCOPES, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {SEASONS_COLLECTION, START_DATE_METADATA_KEY} from './model/fridayfellows';

// Global API Clients declared outside function scope
// https://cloud.google.com/functions/docs/bestpractices/tips#use_global_variables_to_reuse_objects_in_future_invocations
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

// query for the metadata, if found update it. If not create a  new metadata for
// the value.


// Testing (Made spreadsheet publicly editable for the moment)
// TODO: Figure out service account editing permissions
// curl -X POST -H 'Content-Type: application/json' -d '{"sheetId": 1242888778,
// "startDate": 5432}'
// https://us-central1-driven-utility-202807.cloudfunctions.net/setSeasonStartDate

exports = module.exports = functions.https.onRequest(async (req, res) => {
  const cors = Cors({
    origin: true,
  });

  return cors(req, res, async () => {
    const sheetId: number = req.body['sheetId'];
    const {startDate} = req.body;
    // TODO: Validate date format

    console.log('sheetId: ' + sheetId + ', startDate: ' + startDate);

    const api = await getSheetsClient(SCOPES);

    const requests = await getUpsertMetadataRequest(api, sheetId, startDate);

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

      res.status(200).send({data: resp.data});
    } catch (err) {
      console.log(JSON.stringify(err));
      res.status(500).send({err});
    }
  });
});

async function getUpsertMetadataRequest(
    api: sheets_v4.Sheets, sheetId: number, startDate: string) {
  const lookupReq = api.spreadsheets.developerMetadata.search({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      dataFilters: [{
        developerMetadataLookup: {
          metadataKey: START_DATE_METADATA_KEY,
          metadataLocation: {
            sheetId,
          }
        }
      }],
    },
  });

  const existingMetadata = await lookupReq;

  let metadataId;
  const matchedMetadata = existingMetadata.data.matchedDeveloperMetadata;
  // TODO: Maybe we should log an error if more than one metadata match?
  if (matchedMetadata && matchedMetadata.length > 0) {
    metadataId = matchedMetadata[0].developerMetadata!.metadataId;
  }

  const requests: sheets_v4.Schema$Request[] = [];
  if (metadataId) {
    // Metadata exists, update it
    requests.push({
      updateDeveloperMetadata: {
        dataFilters: [{
          developerMetadataLookup: {
            metadataKey: START_DATE_METADATA_KEY,
          },
        }],
        developerMetadata: {
          metadataKey: START_DATE_METADATA_KEY,
          metadataValue: '' + startDate,
          location: {
            sheetId,
          },
          visibility: 'PROJECT',
        },
        fields: 'metadataValue',
      },
    });
  } else {
    // No metadata exists, need to create it
    requests.push({
      createDeveloperMetadata: {
        developerMetadata: {
          metadataKey: START_DATE_METADATA_KEY,
          metadataValue: '' + startDate,
          location: {
            sheetId,
          },
          visibility: 'PROJECT',
        }
      }
    });
  }

  return requests;
}
