// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {Season, SeriesType, SeriesVotingRecord, VotingStatus} from '../model/firestore';
import {SERIES_AL_ID_KEY, SeriesMetadataPayload, SpreadsheetModel, START_DATE_METADATA_KEY} from '../model/sheets';

import {extractFirestoreDocuments} from './firestoreDocumentHelpers';

describe('extractFirestoreDocuments', () => {
  test('should build a season model for each sheet', () => {
    const mockData: SpreadsheetModel = {
      spreadsheetId: 'foobar',
      title: 'MockSpreadSheet',
      sheets: [{
        sheetId: 12345,
        title: 'SPRING 2018',
        gridProperties: {},
        metadata: {
          [START_DATE_METADATA_KEY]: '123456789',
        },
        data: [],
      }],
    };

    const docs = extractFirestoreDocuments(mockData);

    expect(docs.length).toEqual(1);
    const season = docs[0].season;
    expect(season.sheetId).toEqual(12345);
    expect(season.formattedName).toEqual('SPRING 2018');
    expect(season.year).toEqual(2018);
    expect(season.season).toEqual(Season.SPRING);
    expect(season.startDate).toEqual(123456789);
  });

  test('should build a series model for row model in the sheet', () => {
    const metaPayload: SeriesMetadataPayload = {
      titleEn: 'Teekyuu English',
      alId: 12345,
      malId: 54321,
      type: SeriesType.Short,
      episodes: 12,
    };
    const mockData: SpreadsheetModel = {
      spreadsheetId: 'foobar',
      title: 'MockSpreadSheet',
      sheets: [{
        sheetId: 12345,
        title: 'SPRING 2018',
        gridProperties: {},
        metadata: {},
        data: [{
          metadata: {
            [SERIES_AL_ID_KEY]: JSON.stringify(metaPayload),
          },
          cells: ['Teekyuu', 'Ep 1: 4 to 2']
        }],
      }],
    };

    const docs = extractFirestoreDocuments(mockData);
    const seriesList = docs[0].seriesList;

    expect(seriesList.length).toEqual(1);
    const series = seriesList[0];
    expect(series.titleRaw).toEqual('Teekyuu');
    expect(series.titleEn).toEqual('Teekyuu English');
    expect(series.episodes).toEqual(12);
    expect(series.idAL).toEqual(12345);
    expect(series.idMal).toEqual(54321);
    expect(series.votingStatus).toEqual(VotingStatus.Unknown);
    expect(series.votingRecord).toEqual<SeriesVotingRecord[]>([{
      episodeNum: 1,
      weekNum: 1,
      votesFor: 4,
      votesAgainst: 2,
    }]);
  });

  test('should produce a BYE record for \'BYE\' cells in a series row', () => {
    const mockData: SpreadsheetModel = {
      spreadsheetId: 'foobar',
      title: 'MockSpreadSheet',
      sheets: [{
        sheetId: 12345,
        title: 'SPRING 2018',
        gridProperties: {},
        metadata: {},
        data: [{
          metadata: {},
          cells: [
            'Teekyuu',
            'BYE',
            'Ep 1: 0 to 0',
            'BYE',
          ]
        }],
      }],
    };

    const docs = extractFirestoreDocuments(mockData);
    const seriesList = docs[0].seriesList;

    expect(seriesList.length).toEqual(1);
    const series = seriesList[0];
    expect(series.votingRecord.length).toEqual(3);
    expect(series.votingRecord[0]).toEqual<SeriesVotingRecord>({
      msg: 'BYE',
      episodeNum: 0,
      weekNum: 1,
      votesFor: 0,
      votesAgainst: 0,
    });
    expect(series.votingRecord[2]).toEqual<SeriesVotingRecord>({
      msg: 'BYE',
      episodeNum: 1,
      weekNum: 3,
      votesFor: 0,
      votesAgainst: 0,
    });
  });
});
