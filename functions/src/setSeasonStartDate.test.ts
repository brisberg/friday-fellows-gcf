// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';
import {google, sheets_v4} from 'googleapis';

import {PROJECT_ID, SPREADSHEET_ID} from './config';
import {SetSeasonStartDateRequest, SetSeasonStartDateResponse} from './model/service';
import {FirebaseError} from './testing/errors';
import {MockRequest, MockResponse} from './testing/express-helpers';

const testEnv = functionsTest({projectId: PROJECT_ID});
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
import {setSeasonStartDate} from './setSeasonStartDate.f';
import {loadTestDataToFirestore} from './testing/loadTestData';
import {mockSetStartDateMetadataResponse} from './helpers/testing/mockSetStartDateResponse';
import {START_DATE_METADATA_KEY} from './model/sheets';


describe('setSeasonStartDate', () => {
  beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
    await loadTestDataToFirestore();
  });
  afterEach(() => {
    testEnv.cleanup();
  });

  test('should return a 400 if startDate missing', async () => {
    const req = new MockRequest<SetSeasonStartDateRequest>().setMethod('GET');
    const res = new MockResponse<SetSeasonStartDateResponse>();

    setSeasonStartDate(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body!.err).toEqual('startDate must be set and a number');
  });

  test('should return a 400 if sheetId missing', async () => {
    const req =
        new MockRequest<SetSeasonStartDateRequest>().setMethod('GET').setBody(
            {startDate: 12345} as SetSeasonStartDateRequest);
    const res = new MockResponse<SetSeasonStartDateResponse>();

    setSeasonStartDate(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(400);
    expect(res.body!.err).toEqual('sheetId must be set and a number');
  });

  test('should send createMetadata to GoogleSheets', async () => {
    const req =
        new MockRequest<SetSeasonStartDateRequest>().setMethod('GET').setBody(
            {sheetId: 1242888778, startDate: 12345});
    const res = new MockResponse<SetSeasonStartDateResponse>();

    setSeasonStartDate(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({data: mockSetStartDateMetadataResponse});
    expect(google.sheets({version: 'v4'}).spreadsheets.batchUpdate)
        .toHaveBeenCalledWith<
            sheets_v4.Params$Resource$Spreadsheets$Batchupdate[]>({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              createDeveloperMetadata: {
                developerMetadata: {
                  metadataKey: START_DATE_METADATA_KEY,
                  metadataValue: '12345',
                  location: {
                    sheetId: 1242888778,
                  },
                  visibility: 'PROJECT',
                },
              },
            }],
          },
        });
  });

  test('should return a 400 and an error if Firebase returns one', async () => {
    const oldCollection = admin.firestore().collection;
    admin.firestore().collection = jest.fn(() => {
      throw new FirebaseError(400, 'firebase error');
    });

    const req =
        new MockRequest<SetSeasonStartDateRequest>().setMethod('GET').setBody(
            {sheetId: 1242888778, startDate: 12345});
    const res = new MockResponse<SetSeasonStartDateResponse>();

    setSeasonStartDate(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(500);
    expect(res.body).toStrictEqual(
        {err: new FirebaseError(400, 'firebase error')});

    admin.firestore().collection = oldCollection;
  });
});
