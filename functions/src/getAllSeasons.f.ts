import {Firestore} from '@google-cloud/firestore';
import * as Cors from 'cors';
import * as functions from 'firebase-functions';

import {PROJECT_ID} from './config'
import {SEASONS_COLLECTION} from './model/fridayfellows';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

const cors = Cors({
  origin: true,
});

/**
 * Query Firestore for the list of all seasons.
 */
exports = module.exports = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const snapshot = await firestore.collection(SEASONS_COLLECTION).get();
      res.status(200).send(snapshot.docs.map((docSnap) => docSnap.data()));
    } catch (err) {
      res.status(err.status).send({err});
    }
  });
});
