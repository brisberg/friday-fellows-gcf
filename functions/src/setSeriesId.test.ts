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
import {SERIES_AL_ID_KEY} from './model/sheets';
import {MockRequest, MockResponse} from './testing/express-helpers';

const {fetchMock} = global as GlobalWithFetchMock;

const testEnv = functionsTest({projectId: PROJECT_ID});
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
import {setSeriesId} from './setSeriesId.f';
import {loadTestDataToFirestore} from './testing/loadTestData';

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
      seasonId: 12345,
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
      seasonId: 12345,
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
    // TODO: Store more than just the Anilist ID
    fetchMock.mockResponseOnce(JSON.stringify(mockAnilistQueryMediaResponse));
    const req = new MockRequest<SetSeriesIdRequest>().setMethod('GET').setBody({
      seasonId: 12345,
      row: 1,
      seriesId: 15125,  // Teekyu
    });
    const res = new MockResponse<SetSeriesIdResponse>();

    setSeriesId(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(google.sheets({version: 'v4'}).spreadsheets.batchUpdate)
        .toHaveBeenCalledWith<
            sheets_v4.Params$Resource$Spreadsheets$Batchupdate[]>({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              createDeveloperMetadata: {
                developerMetadata: {
                  metadataKey: SERIES_AL_ID_KEY,
                  metadataValue: '15125',
                  location: {
                    sheetId: 12345,
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
});
