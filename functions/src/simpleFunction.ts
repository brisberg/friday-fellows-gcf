import * as Cors from 'cors';
import * as functions from 'firebase-functions';

const cors = Cors({
  origin: true,
});

exports = module.exports = functions.https.onRequest((req, res) => {
  // res.setHeader('Access-Control-Allow-Origin', '*');
  return cors(req, res, () => {
    if (!req.body.card) {
      res.send('Missing card!');
    } else {
      res.send('Payment processed!');
    }
  });
});
