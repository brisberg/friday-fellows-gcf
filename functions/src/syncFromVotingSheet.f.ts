import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {SCOPES_READONLY, SPREADSHEET_ID} from './config';
import {getSheetsClient} from './google.auth';
import {aggregateVotingStatus} from './helpers/aggregateVotingRecordsHelpers';
import {extractFirestoreDocuments} from './helpers/firestoreDocumentHelpers';
import {extractSheetModelFromSpreadsheetData} from './helpers/spreadsheetModelHelpers';
import {CONFIG_COLLECTION, genSeriesId, ONDECK_REPORTS_COLLECTION, OnDeckReport, SEASONS_COLLECTION, SERIES_COLLECTION, SeriesModel, SYNC_STATE_KEY} from './model/firestore';
import {SyncFromVotingSheetResponse} from './model/service';

const firestore = admin.firestore();

/**
 * Scheduled version of the sync cloud function. It will run every day at 3:15
 * AM Pacific.
 */
export const syncFromVotingSheetCron = functions.pubsub.schedule('15 3 * * *')
                                           .timeZone('America/Los_Angeles')
                                           .onRun(async (context) => {
                                             try {
                                               await syncFromVotingSheetImpl();
                                             } catch (err) {
                                               console.warn(err);
                                             }
                                           });

/**
 * Manual verion of the sync cloud function. Will read the Google Voting Sheet
 * and update Firestore with all series/voting contents. Also aggregates total
 * voting status and produces a new OnDeck report
 */
export const syncFromVotingSheet = functions.https.onRequest(async (_, res) => {
  try {
    const payload = await syncFromVotingSheetImpl();
    res.status(200).send(payload);
  } catch (err) {
    console.warn(err);
    res.status(500).send({err});
  }
});

async function syncFromVotingSheetImpl(): Promise<SyncFromVotingSheetResponse> {
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

  const resp = await request;

  const sheetModel = extractSheetModelFromSpreadsheetData(resp.data);
  const allDocuments = extractFirestoreDocuments(sheetModel);
  let onDeckReport: OnDeckReport|undefined;
  allDocuments.forEach((docsTuples) => {
    const report =
        aggregateVotingStatus(docsTuples.season, docsTuples.seriesList);
    if (report) {
      onDeckReport = report;
    }
  });


  const seriesRefs: FirebaseFirestore.DocumentReference[] = [];
  let allSeries: SeriesModel[] = [];
  const batch = firestore.batch();  // Main batch for seasons/metadata
  const seasonCollection = firestore.collection(SEASONS_COLLECTION);

  for (const docsTuple of allDocuments) {
    const {season, seriesList} = docsTuple;
    const seasonRef = seasonCollection.doc(String(season.sheetId));
    batch.set(seasonRef, season);

    for (const series of seriesList) {
      // Using seasonId + index as a stable ID
      const seriesRef = seasonRef.collection(SERIES_COLLECTION)
                            .doc(genSeriesId(season.sheetId, series.rowIndex));
      seriesRefs.push(seriesRef);
    }
    allSeries = allSeries.concat(seriesList);
  }

  // Record the timestamp of the latest sync
  const syncTimestamp = new Date(Date.now()).getTime();
  batch.set(
      firestore.doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY),
      {lastSync: syncTimestamp});

  // Record the generated OnDeckReport
  if (onDeckReport) {
    onDeckReport.lastSync = syncTimestamp;
    const docRef = firestore.collection(ONDECK_REPORTS_COLLECTION).doc();
    batch.set(docRef, onDeckReport);
  }

  await batch.commit();

  const CHUNK_SIZE = 450;
  while (seriesRefs.length > 0) {
    const seriesBatch = firestore.batch();
    const refChunk = seriesRefs.splice(0, CHUNK_SIZE);
    const seriesChunk = allSeries.splice(0, CHUNK_SIZE);

    for (let i = 0; i < seriesChunk.length; i++) {
      seriesBatch.set(refChunk[i], seriesChunk[i]);
    }
    await seriesBatch.commit();
  }

  const payload: SyncFromVotingSheetResponse = {
    data: resp.data,
  };
  return payload;
}
