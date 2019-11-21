// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';

const testEnv = require('firebase-functions-test')({
  // credential: admin.credential.applicationDefault(),
  databaseUrl: 'https://localhost:8080',
});
const getSeries = require('./getSeries.f');

describe('getSeries', () => {
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

  test('should return an empty list for an invalid seasonId', (done) => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>().onSend(() => {
      expect(res.statusCode).toEqual(400);
      expect(res.body).toStrictEqual({err: {}});
      done();
    });

    getSeries(req, res);
  });
});
