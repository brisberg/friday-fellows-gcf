// tslint:disable-next-line: no-import-side-effect
import 'jest';
// import * as functions from 'firebase-functions-test';

import {makePayment} from './simpleFunction';

// const testEnv = functions();

/// HTTP
describe('makePayment', () => {
  test('it returns a successful response with a valid card', () => {
    const req = {body: {card: '4242424242424242'}};
    const res = {
      send: (payload: any) => {
        expect(payload).toBe('Payment processed!');
      },
    };

    makePayment(req as any, res as any);
  });

  test('it returns a successful response with a valid card', () => {
    const req = {body: {}};
    const res = {
      send: (payload: any) => {
        expect(payload).toBe('Missing card!');
      },
    };

    makePayment(req as any, res as any);
  });
});
