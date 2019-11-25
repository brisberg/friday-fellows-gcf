// tslint:disable-next-line: no-import-side-effect
import 'jest';

import admin from 'firebase-admin';

import {CONFIG_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {GetAllSeasonsRequest, GetAllSeasonsResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';
import {loadTestDataToFirestore} from './testing/loadTestData';

const testEnv = require('firebase-functions-test')({
  // credential: admin.credential.applicationDefault(),
  databaseUrl: 'https://localhost:8080',
});
let getAllSeasons: any;

describe('getAllSeasons', () => {
  beforeAll(() => {
    admin.initializeApp({});
    getAllSeasons = require('./getAllSeasons.f');
  });
  beforeEach(async () => {
    await loadTestDataToFirestore();
  });
  afterEach(() => {
    testEnv.cleanup();
  });

  test('should return all season documents and the last sync date', (done) => {
    const req = new MockRequest<GetAllSeasonsRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeasonsResponse>().onSend(() => {
      console.log(JSON.stringify(res));
      expect(res.statusCode).toEqual(200);
      expect(res.body!.seasons.length).toEqual(2);
      expect(res.body!.lastSyncMs).toEqual(1574413847579);
      done();
    });

    getAllSeasons(req, res);
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

    getAllSeasons(req, res);
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

    getAllSeasons(req, res);

    admin.firestore().collection = oldCollection;
  });
});
