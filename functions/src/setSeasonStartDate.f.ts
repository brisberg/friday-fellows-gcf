import * as functions from 'firebase-functions';

import {SCOPES} from './config'
import {getSheetsClient} from './google.auth';
import {START_DATE_METADATA_KEY} from './model/fridayfellows';

exports = module.exports = functions.https.onRequest(async (req, res) => {
  const {sheetId, startDate} = req.body.data;

  console.log(sheetId);
  console.log(startDate);

  const api = await getSheetsClient(SCOPES);

  // Look up metadata for the sheet by the key
  // Update all values in place (including the new start date)
  // This will create the metadata if none is found
  const request = api.spreadsheets.batchUpdate({
    requestBody: {
      requests: [{
        updateDeveloperMetadata: {
          dataFilters: [{
            developerMetadataLookup: {
              metadataKey: START_DATE_METADATA_KEY,
            },
          }],
          developerMetadata: {
            metadataKey: START_DATE_METADATA_KEY,
            metadataValue: startDate,
            location: {
              sheetId,
            },
            visibility: 'PROJECT',
          },
          fields: '*',
        },
      }],
    },
  })
  try {
    const resp = await request;

    // Maybe update fire store here?
    // Or trigger a sync again just for this sheet?

    res.status(200).send({data: resp.data});
  } catch (err) {
    res.status(500).send({err});
  }
});
