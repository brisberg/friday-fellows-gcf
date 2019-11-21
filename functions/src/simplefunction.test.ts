// tslint:disable-next-line: no-import-side-effect
import 'jest';
import {MockRequest, MockResponse} from './testing/express-helpers';

const makePayment = require('./simpleFunction');

/// HTTP
describe('makePayment', () => {
  test('it returns a successful response with a valid card', () => {
    const req =
        new MockRequest().setMethod('GET').setBody({card: '4242424242424242'});
    const res = new MockResponse();

    makePayment(req, res);
    expect(res.body).toBe('Payment processed!');
  });

  test('it returns a successful response warning of a missing card', () => {
    const req = new MockRequest().setBody({});
    const res = new MockResponse().send((payload: any) => {
      expect(payload).toBe('Missing card!');
    });

    makePayment(req, res);
  });
});
