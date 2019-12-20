// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

import {PROJECT_ID} from './config';
import {GetOnDeckReportsRequest, GetOnDeckReportsResponse} from './model/service';
import {FirebaseError} from './testing/errors';
import {MockRequest, MockResponse} from './testing/express-helpers';

const testEnv = functionsTest({projectId: PROJECT_ID});

if (!admin.apps.find((app: admin.app.App|null) => {
      return app ? app.name === '[DEFAULT]' : false;
    })) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
import {OnDeckReport, ONDECK_REPORTS_COLLECTION} from './model/firestore';
import {StandardReport} from './testing/test-data/mockOnDeckReportsData';
import {getOnDeckReports} from './getOnDeckReports.f';

async function loadReportDocsToFirestore(
    firestore: FirebaseFirestore.Firestore, reports: OnDeckReport[]) {
  const batch = firestore.batch();

  reports.forEach((report) => {
    batch.set(firestore.collection(ONDECK_REPORTS_COLLECTION).doc(), report);
  });

  await batch.commit();
}

describe('getOnDeckReports', () => {
  const firestore = admin.firestore();
  const reports: OnDeckReport[] = [
    StandardReport,
    {...StandardReport, targetWatchDate: 200},
    StandardReport,
  ];

  beforeEach(async () => {
    await loadReportDocsToFirestore(firestore, reports);
  });
  afterEach(async () => {
    testEnv.cleanup();
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
  });

  test('should return unimplemented if given timerange', async () => {
    const req =
        new MockRequest<GetOnDeckReportsRequest>().setMethod('GET').setQuery({
          timeRange: {startDate: 100, endDate: 200},
        });
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(501);
    expect(res.body!.err).toEqual('TimeRange query unimplemented.');
  });

  test('should all reports with the given targetDate', async () => {
    const req =
        new MockRequest<GetOnDeckReportsRequest>().setMethod('GET').setQuery({
          targetDate: 100,
        });
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.reports!.length).toEqual(2);
    expect(res.body!.reports!).toEqual([StandardReport, StandardReport]);
  });

  test('no arguments returns all reports with targetDate of Now', async () => {
    jest.spyOn(Date, 'now').mockImplementation(() => 200);
    // TODO: improve this to calculare the next showing date
    const req = new MockRequest<GetOnDeckReportsRequest>().setMethod('GET');
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.reports!.length).toEqual(1);
    expect(res.body!.reports!).toEqual([
      {...StandardReport, targetWatchDate: 200}
    ]);
    (Date.now as unknown as jest.SpyInstance).mockRestore();
  });

  test('should return an error if Firebase returns one', async () => {
    const oldCollection = admin.firestore().collection;
    admin.firestore().collection = jest.fn(() => {
      throw new FirebaseError(400, 'firebase error');
    });
    const req =
        new MockRequest<GetOnDeckReportsRequest>().setMethod('GET').setQuery({
          targetDate: 100,
        });
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body).toStrictEqual(
        {err: new FirebaseError(400, 'firebase error')});

    admin.firestore().collectionGroup = oldCollection;
  });
});
