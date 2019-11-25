// tslint:disable-next-line: no-import-side-effect
import 'jest';
import admin from 'firebase-admin';

import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';
import {loadTestDataToFirestore} from './testing/loadTestData';

const testEnv = require('firebase-functions-test')({
  // credential: admin.credential.applicationDefault(),
  databaseUrl: 'https://localhost:8080',
});
let getSeries: any;

describe('getSeries', () => {
  beforeAll(() => {
    admin.initializeApp({});
    getSeries = require('./getSeries.f');
  });
  beforeEach(async () => {
    await loadTestDataToFirestore();
  });
  afterEach(() => {
    testEnv.cleanup();
  });

  test('should return all series when invoked with no arguments', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body!.series.length).toEqual(41);  // 19 + 22 from both seasons
      done();
    });

    getSeries(req, res);
  });

  test('should return all series for a given seasonId', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET').setBody(
        {seasonId: 281991772});  // WINTER 2018
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body!.series.length).toEqual(22);
      done();
    });

    getSeries(req, res);
  });

  test('should return an empty list for an invalid seasonId', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET').setBody(
        {seasonId: 12345});
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual<GetAllSeriesResponse>({series: []});
      done();
    });

    getSeries(req, res);
  });

  class FirebaseError extends Error {
    constructor(readonly status: number, readonly message: string) {
      super(message);
    }
  }

  test('should return an error if Firebase returns one', (done) => {
    const oldCollectionGroup = admin.firestore().collectionGroup;
    admin.firestore().collectionGroup = jest.fn(() => {
      throw new FirebaseError(400, 'firebase error');
    });

    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(400);
      expect(res.body).toStrictEqual(
          {err: new FirebaseError(400, 'firebase error')});
      done();
    });

    getSeries(req, res);

    admin.firestore().collectionGroup = oldCollectionGroup;
  });
});
