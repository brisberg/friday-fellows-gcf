// tslint:disable-next-line: no-import-side-effect
import 'jest';

import * as firebase from '@firebase/testing';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

import {PROJECT_ID} from './config';
import {mockSpreadsheetGetResponse} from './helpers/testing/mockSpreadsheetResponse';
import {CONFIG_COLLECTION, ONDECK_REPORTS_COLLECTION, SeasonModel, SEASONS_COLLECTION, SYNC_STATE_KEY} from './model/firestore';
import {SyncFromVotingSheetRequest, SyncFromVotingSheetResponse} from './model/service';
import {MockRequest, MockResponse} from './testing/express-helpers';

const testEnv = functionsTest({projectId: PROJECT_ID});
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
import {syncFromVotingSheet} from './syncFromVotingSheet.f';

describe('syncFromVotingSheet', () => {
  beforeEach(async () => {
    await firebase.clearFirestoreData({projectId: PROJECT_ID});
  });
  afterEach(() => {
    testEnv.cleanup();
  });

  test('should echo back the response from Google Sheets', async () => {
    const req = new MockRequest<SyncFromVotingSheetRequest>().setMethod('GET');
    const res = new MockResponse<SyncFromVotingSheetResponse>();

    syncFromVotingSheet(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    expect(res.statusCode).toEqual(200);
    expect(res.body!.data).toEqual(mockSpreadsheetGetResponse);
  });

  test('should save last sync date to Firestore', async () => {
    const timestamp = new Date('2019-05-14T11:01:58.135Z').getTime();
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const req = new MockRequest<SyncFromVotingSheetRequest>().setMethod('GET');
    const res = new MockResponse<SyncFromVotingSheetResponse>();

    syncFromVotingSheet(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    const docSnap = await admin.firestore()
                        .doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY)
                        .get();
    const doc = docSnap.data();
    expect(doc).toEqual({lastSync: timestamp});

    spy.mockRestore();
  });

  test('should save two seasons to Firestore', async () => {
    const req = new MockRequest<SyncFromVotingSheetRequest>().setMethod('GET');
    const res = new MockResponse<SyncFromVotingSheetResponse>();

    syncFromVotingSheet(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    const seasonsSnap =
        await admin.firestore().collection(SEASONS_COLLECTION).get();
    const seasons = seasonsSnap.docs.map((snap) => snap.data() as SeasonModel);


    const expected: SeasonModel[] = [
      {
        formattedName: 'SPRING 2018',
        season: 1,
        sheetId: 1242888778,
        startDate: 1573772820000,
        year: 2018,
      },
      {
        formattedName: 'WINTER 2018',
        season: 4,
        sheetId: 281991772,
        startDate: 1573772820000,
        year: 2018,
      },
    ];
    expect(seasons).toEqual(expected);
  });

  test('should save ondeck report with timestamp to Firestore', async () => {
    // Set time to week 7 of first mock season
    const mockNow = new Date('2019-12-11T11:01:58.135Z').getTime();
    const spy = jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
    const req = new MockRequest<SyncFromVotingSheetRequest>().setMethod('GET');
    const res = new MockResponse<SyncFromVotingSheetResponse>();

    syncFromVotingSheet(
        req as unknown as functions.Request,
        res as unknown as functions.Response);
    await res.sent;

    const reportSnap =
        await admin.firestore().collection(ONDECK_REPORTS_COLLECTION).get();

    expect(reportSnap.size).toEqual(1);
    const report = reportSnap.docs[0].data();
    expect(report.lastSync).toEqual(mockNow);

    spy.mockRestore();
  });
});
