import Cors from 'cors';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

import {SCOPES, SPREADSHEET_ID} from './config';
import {getSheetsClient} from './google.auth';
import {getUpsertSheetRowMetadata} from './helpers/upsertDevMetadata';
import {genSeriesId, SEASONS_COLLECTION, SERIES_COLLECTION} from './model/firestore';
import {SetSeriesIdRequest, SetSeriesIdResponse} from './model/service';
import {SERIES_AL_ID_KEY, SeriesMetadataPayload} from './model/sheets';

const cors = Cors({
  origin: true,
});

const firestore = admin.firestore();

export const setSeriesId = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const reqBody: SetSeriesIdRequest = req.body;
    const {seasonId, row, seriesId} = reqBody;

    if (seasonId === undefined) {
      res.status(400).send({err: 'seasonId must be set and a number'});
      return;
    }

    if (row === undefined) {
      res.status(400).send({err: 'row must be set and a number'});
      return;
    }

    if (seriesId === undefined) {
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

    let data: any;
    try {
      // Make the HTTP Api request
      const alResp = await fetch(url, options);
      data = await alResp.json();
    } catch (e) {
      console.log(e);
      res.status(500).send({err: e});
      return;
    }

    try {
      // Commit AniList metadata to Voting Sheet as Dev Metadata
      const api = await getSheetsClient(SCOPES);

      const metadataPayload: SeriesMetadataPayload = {
        titleEn: data.data.Media.title.english,
        alId: data.data.Media.id,
        malId: data.data.Media.idMal,
        type: data.data.Media.format,
        episodes: data.data.Media.episodes,
      };
      const sheetsReqs = await getUpsertSheetRowMetadata(
          api, seasonId, row, SERIES_AL_ID_KEY,
          JSON.stringify(metadataPayload));

      const request = api.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: sheetsReqs,
        },
      });

      await request;
    } catch (e) {
      console.log(e);
      res.status(500).send({err: e});
      return;
    }

    try {
      // Commit AniList metadata to Firestore
      await firestore.collection(SEASONS_COLLECTION)
          .doc(String(seasonId))
          .collection(SERIES_COLLECTION)
          .doc(genSeriesId(seasonId, row))
          .update({
            titleEn: data.data.Media.title.english,
            type: data.data.Media.format,
            idMal: data.data.Media.idMal,
            idAL: data.data.Media.id,
            episodes: data.data.Media.episodes,
            seasonId,
          });
    } catch (err) {
      console.log(err);
      res.status(500).send({err});
      return;
    }

    const payload: SetSeriesIdResponse = {
      data: data,
    };
    res.status(200).send(payload);
  });
});
