import Cors from 'cors';
import * as functions from 'firebase-functions';

import {SetSeriesIdRequest, SetSeriesIdResponse} from './model/service';

const cors = Cors({
  origin: true,
});

export const setSeriesId = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const reqBody: SetSeriesIdRequest = req.body;
    const {seasonId, row, seriesId} = reqBody;

    if (!seasonId) {
      res.status(400).send({err: 'seasonId must be set and a number'});
      return;
    }

    if (!row) {
      res.status(400).send({err: 'row must be set and a number'});
      return;
    }

    if (!seriesId) {
      res.status(400).send({err: 'seriesId must be set and a number'});
      return;
    }

    try {
      const payload: SetSeriesIdResponse = {
        data: req.body,
      };
      res.status(200).send(payload);
    } catch (err) {
      res.status(err.status).send({err});
    }
  });
});
