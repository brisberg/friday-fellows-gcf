// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
// tslint:disable-next-line: no-implicit-dependencies
import {Query} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

import {PROJECT_ID} from './config';
import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
import {FirebaseError} from './testing/errors';
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

  test('should return all series for a given seasonId', async () => {
    const req = new MockRequest<GetAllSeriesRequest>();
    req.setMethod('GET').setQuery({seasonId: 281991772});  // WINTER 2018
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.series.length).toEqual(22);
  });

  test('should return an empty list for an invalid seasonId', async () => {
    const req = new MockRequest<GetAllSeriesRequest>();
    req.setMethod('GET').setQuery({seasonId: 12345});
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body).toStrictEqual<GetAllSeriesResponse>({series: []});
  });

  test('should return an error if Firebase returns one', async () => {
    const spy = jest.spyOn(Query.prototype, 'get');
    spy.mockImplementation(() => {
      throw new FirebaseError(400, 'firebase error');
    });

    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body).toStrictEqual(
        {err: new FirebaseError(400, 'firebase error')});

    spy.mockRestore();
  });
});
