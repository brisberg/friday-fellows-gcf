import Cors from 'cors';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {SEASONS_COLLECTION, SERIES_COLLECTION, SeriesModel} from './model/firestore';
import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';

const firestore = admin.firestore();

const cors = Cors({
  origin: true,
});

/**
 * Query Firestore for the list of all series.
 *
 * If a season ID is specified restrict to just series for that season.
 */
export const getSeries = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const query: GetAllSeriesRequest = req.query;
    const {seasonId} = query;

    try {
      let seriesList: SeriesModel[];
      if (seasonId) {
        const snapshot = await firestore.collection(SEASONS_COLLECTION)
                             .doc(String(seasonId))
                             .collection(SERIES_COLLECTION)
                             .get();
        seriesList =
            snapshot.docs.map((docSnap) => docSnap.data() as SeriesModel);
      } else {
        const snapshot =
            await firestore.collectionGroup(SERIES_COLLECTION).get();
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
