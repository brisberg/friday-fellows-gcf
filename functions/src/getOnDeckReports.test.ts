// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
// import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

import {PROJECT_ID} from './config';
import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
// import {FirebaseError} from './testing/errors';
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

  test('should return all series when invoked with no arguments', async () => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.series.length).toEqual(41);  // 19 + 22 from both seasons
  });
});
