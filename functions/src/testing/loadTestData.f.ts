import {Firestore} from '@google-cloud/firestore';
import * as admin from 'firebase-admin';

import {PROJECT_ID} from '../config';
import {configCollectionData} from './test-data/firestore';

const firestore = new Firestore({
  projectId: PROJECT_ID,
  host: 'localhost:8080',
});

export async function loadTestDataToFirestore() {
  const batch = firestore.batch();

  Object.keys(configCollectionData.docs).map((key) => {
    const ref = firestore.collection('config').doc();
    batch.set(ref, configCollectionData.docs[key].fields);
  });

  await batch.commit();
  console.log('Firestore data load complete.');

  const configData = await firestore.collection('seasons').get();
  console.log(configData.docs.map((docSnap) => {
    return {
      id: docSnap.id, data: docSnap.data(),
    }
  }));
}

// tslint:disable-next-line: no-floating-promises
loadTestDataToFirestore();
