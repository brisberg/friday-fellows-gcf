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
    const {targetDate, timeRange} = query;

    if (timeRange) {
      res.status(501).send({err: 'TimeRange query unimplemented.'});
      return;
    }

    const baseQuery: FirebaseFirestore.Query =
        firestore.collection(ONDECK_REPORTS_COLLECTION);
    let reportsQuery = baseQuery;

    if (!targetDate && !timeRange) {
      // Fetch the latest report
      // TODO: maybe fetch many reports for the frontend to display?
      reportsQuery = reportsQuery.orderBy('created', 'desc').limit(1);
    } else if (targetDate) {
      reportsQuery = reportsQuery.where('targetWatchDate', '==', targetDate);
    }

    try {
      const reportsSnap = await reportsQuery.get();

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
