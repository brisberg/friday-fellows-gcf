import {Firestore} from '@google-cloud/firestore';
import * as Cors from 'cors';
import * as functions from 'firebase-functions';

import {PROJECT_ID} from './config'
import {CONFIG_COLLECTION, SeasonModel, SEASONS_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {GetAllSeasonsResponse} from './model/service';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

const cors = Cors.default({
  origin: true,
});

/**
 * Query Firestore for the list of all seasons and the timestamp of the last
 * sync from sheets.
 */
exports = module.exports = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const seasonsQuery = firestore.collection(SEASONS_COLLECTION).get();
      const lastSyncQuery =
          firestore.doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY).get();
      const [snapshot, lastSync] =
          await Promise.all([seasonsQuery, lastSyncQuery])

      const seasons = snapshot.docs.map((docSnap) => docSnap.data());
      const lastSyncMs =
          lastSync.exists ? lastSync.data()!.lastSync : undefined;

      const payload: GetAllSeasonsResponse = {
        seasons: seasons as SeasonModel[],
        lastSyncMs,
      };
      res.status(200).send(payload);
    } catch (err) {
      res.status(err.status).send({err});
    }
  });
});
