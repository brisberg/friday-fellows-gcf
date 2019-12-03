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

    // Here we define our query as a multi-line string
    // Storing it in a separate .graphql/.gql file is also possible
    const query = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    title {
      romaji
      english
      native
    }
    id
    idMal
    format
    episodes
    season
    seasonInt
  }
}
`;

    // Define our query variables and values that will be used in the query
    // request
    const variables = {id: seriesId};

    // Define the config we'll need for our Api request
    const url = 'https://graphql.anilist.co', options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({query: query, variables: variables})
    };

    try {
      // Make the HTTP Api request
      const data = await fetch(url, options).then(resp => resp.json());
      const payload: SetSeriesIdResponse = {
        data: data,
      };
      res.status(200).send(payload);
    } catch (err) {
      res.status(500).send({err});
    }
  });
});
