// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {GetAllSeriesRequest, GetAllSeriesResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';

const getSeries = require('./getSeries.f');

describe('getSeries', () => {
  test.only('should return all series when invoked with no arguments', () => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET');
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(req, res);
    expect(res.body!).toBe<GetAllSeriesResponse>({series: []});
  });

  test('should return all series for a season when given a seasonId', () => {
    const req = new MockRequest<GetAllSeriesRequest>().setMethod('GET').setBody(
        {seasonId: 1234});
    const res = new MockResponse<GetAllSeriesResponse>();

    getSeries(req, res);
    expect(res.body).toBe<GetAllSeriesResponse>({series: []});
  });
});
