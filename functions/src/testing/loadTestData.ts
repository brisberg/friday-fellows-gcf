if (!process.env['FIRESTORE_EMULATOR_HOST']) {
  console.warn(
      'Error: FIRESTORE_EMULATOR_HOST must be set to avoid pushing data to production.')
  process.exit(1);
}

import {Firestore} from '@google-cloud/firestore';
import fs from 'fs';

import {PROJECT_ID} from '../config';
import {DocumentModel} from './dumpTestData';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

/**
 * Loads the test data file and pushes it into the Firestore Emulator for
 * further testing.
 */
export async function loadTestDataToFirestore() {
  process.stdout.write('Starting load of test data to Firestore Emulator....');
  const testData = JSON.parse(fs.readFileSync(
      'functions/src/testing/test-data/firestore.json', 'UTF-8'));
  const batch = firestore.batch();

  testData.map((doc: DocumentModel) => {
    const ref = firestore.doc(doc.id);
    batch.set(ref, doc.data);
  });

  await batch.commit();
  console.log('done');
}
