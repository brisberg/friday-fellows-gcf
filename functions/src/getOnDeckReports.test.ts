// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
// tslint:disable-next-line: no-implicit-dependencies
import {Query} from '@google-cloud/firestore';
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
import {StandardReport, RecentReport, TwoHundredReport} from './testing/test-data/mockOnDeckReportsData';
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

  afterEach(async () => {
    testEnv.cleanup();
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
  });

  test('should return unimplemented if given timerange', async () => {
    await loadReportDocsToFirestore(firestore, []);
    const req = new MockRequest<GetOnDeckReportsRequest>().setMethod('GET');
    req.setQuery({
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

  test('given targetDate should return all reports for that date', async () => {
    const reports = [StandardReport, TwoHundredReport, TwoHundredReport];
    await loadReportDocsToFirestore(firestore, reports);
    const req = new MockRequest<GetOnDeckReportsRequest>().setMethod('GET');
    req.setQuery({
      targetDate: 200,
    });
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.reports!.length).toEqual(2);
    expect(res.body!.reports!).toEqual([TwoHundredReport, TwoHundredReport]);
  });

  test('no arguments returns the latest report', async () => {
    await loadReportDocsToFirestore(firestore, [StandardReport, RecentReport]);
    const req = new MockRequest<GetOnDeckReportsRequest>().setMethod('GET');
    const res = new MockResponse<GetOnDeckReportsResponse>();

    getOnDeckReports(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.reports!.length).toEqual(1);
    expect(res.body!.reports!).toEqual([RecentReport]);
  });

  test('should return an error if Firebase returns one', async () => {
    const spy = jest.spyOn(Query.prototype, 'get');
    spy.mockImplementation(() => {
      throw new FirebaseError(400, 'firebase error');
    });
    const req = new MockRequest<GetOnDeckReportsRequest>().setMethod('GET');
    req.setQuery({
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

    spy.mockRestore();
  });
});
