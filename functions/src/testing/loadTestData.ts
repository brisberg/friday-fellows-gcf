/* istanbul ignore file */

if (!process.env['FIRESTORE_EMULATOR_HOST']) {
  console.warn(
      'Error: FIRESTORE_EMULATOR_HOST must be set to avoid pushing data to production.');
  process.exit(1);
}

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

import {DocumentModel} from './dumpTestData';

if (!admin.apps.find((app: admin.app.App|null) => {
      return app ? app.name === '[DEFAULT]' : false;
    })) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const firestore = admin.firestore();

/**
 * Loads the test data file and pushes it into the Firestore Emulator for
 * further testing.
 */
export async function loadTestDataToFirestore() {
  const fileName =
      path.resolve(__dirname, '../../src/testing/test-data/firestore.json');
  const testData = JSON.parse(fs.readFileSync(fileName, 'UTF-8'));
  const batch = firestore.batch();

  testData.map((doc: DocumentModel) => {
    const ref = firestore.doc(doc.id);
    batch.set(ref, doc.data);
  });
  console.log('starting batch');

  await batch.commit();
  console.log('ending batch');
}
