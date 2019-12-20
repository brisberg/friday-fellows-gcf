import Cors from 'cors';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {ONDECK_REPORTS_COLLECTION, OnDeckReport} from './model/firestore';
import {GetOnDeckReportsRequest, GetOnDeckReportsResponse} from './model/service';

const firestore = admin.firestore();

const cors = Cors({
  origin: true,
});

/**
 * Query Firestore for all OnDeck reports for the given timespan or target week.
 *
 * If no parameters are specified it will default to all reports targetting next
 * Friday.
 */
export const getOnDeckReports = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const query: GetOnDeckReportsRequest = req.query;
    const {timeRange} = query;
    let {targetDate} = query;

    if (timeRange) {
      res.status(501).send({err: 'TimeRange query unimplemented.'});
      return;
    }

    if (!targetDate && !timeRange) {
      // TODO: calculate next Friday
      targetDate = new Date(Date.now()).getTime();
    }

    try {
      const reportsQuery = firestore.collection(ONDECK_REPORTS_COLLECTION)
                               .where('targetWatchDate', '==', targetDate)
                               .get();
      const reportsSnap = await reportsQuery;

      const reports: OnDeckReport[] = reportsSnap.docs.map(
          (reportSnap) => reportSnap.data() as OnDeckReport);

      const payload: GetOnDeckReportsResponse = {
        reports: reports,
      };
      res.status(200).send(payload);
    } catch (err) {
      res.status(err.status).send({err});
    }
  });
});
