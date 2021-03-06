if (!process.env['FIRESTORE_EMULATOR_HOST']) {
  console.warn(
      'Error: FIRESTORE_EMULATOR_HOST must be set to avoid querying production data.');
  process.exit(1);
}

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

import {CONFIG_COLLECTION, SEASONS_COLLECTION, SERIES_COLLECTION, ONDECK_REPORTS_COLLECTION} from '../model/firestore';
import {PROJECT_ID} from '../config';

if (!admin.apps.find((app: admin.app.App|null) => {
      return app ? app.name === '[DEFAULT]' : false;
    })) {
  admin.initializeApp({projectId: PROJECT_ID});
}
const firestore = admin.firestore();

export interface DocumentModel {
  id: string;
  data: FirebaseFirestore.DocumentData;
}

/**
 * Calls out to running Firebase Emulator and queries for all config, seasons,
 * and series. Dumps them to a test data file. Will need to be updated if we add
 * more collection types.
 */
async function dumpTestDataToFile() {
  const dataFile =
      path.resolve(__dirname, '../../src/testing/test-data/firestore.json');

  const configSnap = await firestore.collection(CONFIG_COLLECTION).get();
  const configData = snapshotToJson(CONFIG_COLLECTION, configSnap);

  const seasonSnap = await firestore.collection(SEASONS_COLLECTION).get();
  const seasonData = snapshotToJson(SEASONS_COLLECTION, seasonSnap);

  let seriesData: DocumentModel[] = [];
  for (const season of seasonSnap.docs) {
    const seriesSnap =
        await firestore
            .collection(
                `${SEASONS_COLLECTION}/${season.id}/${SERIES_COLLECTION}`)
            .get();
    const seriesDocs = snapshotToJson(
        `${SEASONS_COLLECTION}/${season.id}/${SERIES_COLLECTION}`, seriesSnap);
    seriesData = seriesData.concat(seriesDocs);
  }

  const reportSnap =
      await firestore.collection(ONDECK_REPORTS_COLLECTION).get();
  const reportData = snapshotToJson(ONDECK_REPORTS_COLLECTION, reportSnap);

  const data = JSON.stringify(
      [
        ...configData,
        ...seasonData,
        ...seriesData,
        ...reportData,
      ],
      null, 2);
  fs.writeFileSync(dataFile, data);
}

/**
 * Encodes a snapshot as a DocumentModel for storage in the datafile. The ID is
 * the fully qualified document path of the document. e.g. <collection>/<docId>
 */
function snapshotToJson(
    prefix: string,
    snapshot: FirebaseFirestore.QuerySnapshot): DocumentModel[] {
  return snapshot.docs.map((doc) => {
    return {id: `${prefix}/${doc.id}`, data: doc.data()};
  });
}

// tslint:disable-next-line: no-floating-promises
dumpTestDataToFile();
