// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import {PROJECT_ID} from './config';
import {CONFIG_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {GetAllSeasonsRequest, GetAllSeasonsResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';
import {loadTestDataToFirestore} from './testing/loadTestData';

const testEnv = require('firebase-functions-test')({projectId: PROJECT_ID});
import {getAllSeasons} from './getAllSeasons.f';

describe('getAllSeasons', () => {
  beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
    await loadTestDataToFirestore();
  });
  afterEach(() => {
    testEnv.cleanup();
  });

  test('should return all season documents and the last sync date', (done) => {
    const req = new MockRequest<GetAllSeasonsRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeasonsResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body!.seasons.length).toEqual(2);
      expect(res.body!.lastSyncMs).toEqual(1574413847579);
      done();
    });

    getAllSeasons(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
  });

  test('should undefined for last sync if it is missing', async (done) => {
    await admin.firestore()
        .collection(CONFIG_COLLECTION)
        .doc(SYNC_STATE_KEY)
        .delete();
    const req = new MockRequest<GetAllSeasonsRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeasonsResponse>().onSend(() => {
      expect(res.statusCode).toEqual(200);
      expect(res.body!.lastSyncMs).toEqual(undefined);
      done();
    });

    getAllSeasons(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
  });

  class FirebaseError extends Error {
    constructor(readonly status: number, readonly message: string) {
      super(message);
    }
  }

  test('should return an error if Firebase returns one', (done) => {
    const oldCollection = admin.firestore().collection;
    admin.firestore().collection = jest.fn(() => {
      throw new FirebaseError(400, 'firebase error');
    });

    const req = new MockRequest<GetAllSeasonsRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeasonsResponse>().onSend(() => {
      expect(res.statusCode).toEqual(400);
      expect(res.body).toStrictEqual(
          {err: new FirebaseError(400, 'firebase error')});
      done();
    });

    getAllSeasons(
        req as unknown as functions.Request,
        res as unknown as functions.Response);

    admin.firestore().collection = oldCollection;
  });
});
