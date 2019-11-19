import * as functions from 'firebase-functions';

export const makePayment = functions.https.onRequest((req, res) => {
  if (!req.body.card) {
    res.send('Missing card!');
  } else {
    res.send('Payment processed!');
  }
});
