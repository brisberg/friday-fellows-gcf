import {Firestore} from '@google-cloud/firestore';
import * as Cors from 'cors';
import * as functions from 'firebase-functions';

import {PROJECT_ID} from './config'
import {SEASONS_COLLECTION} from './model/fridayfellows';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

/**
 * Query Firestore for the list of all seasons.
 */
exports = module.exports = functions.https.onRequest(async (req, res) => {
  const cors = Cors({
    origin: true,
  });
  try {
    const snapshot = await firestore.collection(SEASONS_COLLECTION).get();
    return cors(req, res, () => {
      res.status(200).send(snapshot.docs.map((docSnap) => docSnap.data()));
    })
  } catch (err) {
    res.status(err.status).send({err});
  }
});
