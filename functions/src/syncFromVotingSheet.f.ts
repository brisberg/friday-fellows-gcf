import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {SCOPES_READONLY, SPREADSHEET_ID} from './config';
import {getSheetsClient} from './google.auth';
import {extractFirestoreDocuments} from './helpers/firestoreDocumentHelpers';
import {extractSheetModelFromSpreadsheetData} from './helpers/spreadsheetModelHelpers';
import {CONFIG_COLLECTION, genSeriesId, SEASONS_COLLECTION, SERIES_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {SyncFromVotingSheetResponse} from './model/service';

const firestore = admin.firestore();

export const syncFromVotingSheet = functions.https.onRequest(async (_, res) => {
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

    const sheetModel = extractSheetModelFromSpreadsheetData(resp.data);
    const allDocuments = extractFirestoreDocuments(sheetModel);

    const batch = firestore.batch();
    const seasonCollection = firestore.collection(SEASONS_COLLECTION);

    for (const docsTuple of allDocuments) {
      const {season, seriesList} = docsTuple;
      const seasonRef = seasonCollection.doc(String(season.sheetId));
      batch.set(seasonRef, season);

      for (const series of seriesList) {
        // Using seasonId + index as a stable ID
        const seriesRef =
            seasonRef.collection(SERIES_COLLECTION)
                .doc(genSeriesId(season.sheetId, series.rowIndex));
        batch.set(seriesRef, series);
      }
    }

    // Record the timestamp of the latest sync
    const syncTimestamp = new Date(Date.now()).getTime();
    batch.set(
        firestore.doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY),
        {lastSync: syncTimestamp});

    await batch.commit();

    const payload: SyncFromVotingSheetResponse = {
      data: resp.data,
    };
    res.status(200).send(payload);
  } catch (err) {
    console.warn(err);
    res.status(500).send({err});
  }
});
