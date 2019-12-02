// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

import {PROJECT_ID} from './config';
import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';
import {loadTestDataToFirestore} from './testing/loadTestData';

const testEnv = functionsTest({projectId: PROJECT_ID});
import {getSeries} from './getSeries.f';

describe('getSeries', () => {
  beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
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

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
  });

  test('should return all series for a given seasonId', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET').setBody(
        {seasonId: 281991772});  // WINTER 2018
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body!.series.length).toEqual(22);
      done();
    });

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
  });

  test('should return an empty list for an invalid seasonId', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET').setBody(
        {seasonId: 12345});
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body).toStrictEqual<GetAllSeriesResponse>({series: []});
      done();
    });

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
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

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);

    admin.firestore().collectionGroup = oldCollectionGroup;
  });
});
