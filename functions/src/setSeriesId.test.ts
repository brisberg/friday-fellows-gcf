// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';
import {google, sheets_v4} from 'googleapis';
import {GlobalWithFetchMock} from 'jest-fetch-mock';

import {PROJECT_ID, SPREADSHEET_ID} from './config';
import {mockAnilistQueryMediaResponse} from './helpers/testing/mockAnilistQueryMediaResponse';
import {SetSeriesIdRequest, SetSeriesIdResponse} from './model/service';
import {SERIES_AL_ID_KEY, SeriesMetadataPayload} from './model/sheets';
import {MockRequest, MockResponse} from './testing/express-helpers';

const {fetchMock} = global as GlobalWithFetchMock;

const testEnv = functionsTest({projectId: PROJECT_ID});
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
import {setSeriesId} from './setSeriesId.f';
import {loadTestDataToFirestore} from './testing/loadTestData';
import {SeriesType, SERIES_COLLECTION, SEASONS_COLLECTION, SeriesModel} from './model/firestore';

describe('setSeriesId', () => {
  beforeEach(async () => {
    await loadTestDataToFirestore();
  });
  afterEach(async () => {
    testEnv.cleanup();
    fetchMock.resetMocks();
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
  });

  test('should return a 400 if seasonId missing', async () => {
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET');
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body!.err).toEqual('seasonId must be set and a number');
  });

  test('should return a 400 if row missing', async () => {
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 1242888778,
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body!.err).toEqual('row must be set and a number');
  });

  test('should return a 400 if seriesId missing', async () => {
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 12345,
      row: 1,
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body!.err).toEqual('seriesId must be set and a number');
  });

  test('should return a successful response from AniList', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockAnilistQueryMediaResponse));
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 1242888778,
      row: 1,
      seriesId: 15125,  // Teekyu
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.data).toEqual(mockAnilistQueryMediaResponse);
  });

  test('should store the AniList metadata into Voting Sheet', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockAnilistQueryMediaResponse));
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 1242888778,
      row: 1,
      seriesId: 15125,  // Teekyu
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    const expectedPayload: SeriesMetadataPayload = {
      titleEn: 'Teekyuu',
      alId: 15125,
      malId: 15125,
      type: SeriesType.Short,
      episodes: 12,
    };
    expect(google.sheets({version: 'v4'}).spreadsheets.batchUpdate)
        .toHaveBeenCalledWith<
            sheets_v4.Params$Resource$Spreadsheets$Batchupdate[]>({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              createDeveloperMetadata: {
                developerMetadata: {
                  metadataKey: SERIES_AL_ID_KEY,
                  metadataValue: JSON.stringify(expectedPayload),
                  location: {
                    sheetId: 1242888778,
                    dimensionRange: {
                      startIndex: 1,
                      endIndex: 2,
                    },
                  },
                  visibility: 'PROJECT',
                },
              },
            }],
          },
        });
  });

  test('should store the AniList metadata into Firestore', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockAnilistQueryMediaResponse));
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 1242888778,
      row: 1,
      seriesId: 15125,  // Teekyu
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    const seriesSnap = await admin.firestore()
                           .collection(SEASONS_COLLECTION)
                           .doc(String(1242888778))
                           .collection(SERIES_COLLECTION)
                           .doc('1242888778-1')
                           .get();
    const series = seriesSnap.data() as SeriesModel;

    expect(series.titleEn).toBe('Teekyuu');
    expect(series.idAL).toBe(15125);
    expect(series.idMal).toBe(15125);
    expect(series.type).toBe('TV_SHORT');
    expect(series.episodes).toBe(12);
    expect(series.seasonId).toBe(1242888778);
  });
});
