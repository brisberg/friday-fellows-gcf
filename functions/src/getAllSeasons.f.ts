import Cors from 'cors';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {CONFIG_COLLECTION, SeasonModel, SEASONS_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {GetAllSeasonsResponse} from './model/service';

const firestore = admin.firestore();

const cors = Cors({
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
