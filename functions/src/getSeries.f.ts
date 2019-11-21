import * as Cors from 'cors';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {SEASONS_COLLECTION, SERIES_COLLECTION, SeriesModel} from './model/firestore';
import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';

admin.initializeApp({});
const firestore = admin.firestore();

const cors = Cors.default({
  origin: true,
});

/**
 * Query Firestore for the list of all series.
 *
 * If a season ID is specified restrict to just series for that season.
 */
exports = module.exports = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const reqBody: GetAllSeriesRequest = req.body;
    const {seasonId} = reqBody;
    try {
      let seriesList: SeriesModel[];
      if (seasonId) {
        const snapshot = await firestore.collection(SEASONS_COLLECTION)
                             .doc(String(seasonId))
                             .collection(SERIES_COLLECTION)
                             .get()
        seriesList =
            snapshot.docs.map((docSnap) => docSnap.data() as SeriesModel);
      } else {
        const snapshot =
            await firestore.collectionGroup(SERIES_COLLECTION).get()
        seriesList =
            snapshot.docs.map((docSnap) => docSnap.data() as SeriesModel);
      }

      const payload: GetAllSeriesResponse = {
        series: seriesList,
      };
      res.status(200).send(payload);
    } catch (err) {
      res.status(err.status).send({err});
    }
  });
});