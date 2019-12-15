// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {Season} from '../model/firestore';
import {SpreadsheetModel, START_DATE_METADATA_KEY} from '../model/sheets';

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
});
