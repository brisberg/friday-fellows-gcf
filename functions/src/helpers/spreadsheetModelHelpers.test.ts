// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {sheets_v4} from 'googleapis';

import {extractSheetModelFromSpreadsheetData} from './spreadsheetModelHelpers';
import {mockResponse} from './testing/mockSpreadsheetResponse';

describe('extractSheetModelFromSpreadsheetData', () => {
  test('should extract spreadsheet title and id from response', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    expect(model.title).toBe('Dev Version Anime Voting.xlsx');
    expect(model.spreadsheetId)
        .toBe('1w9ADt88UpKwZigx6xrP_Oohc3VTPVLWqC3-ATLCyExg');
  });

  test('should extract the a season model for each sheet', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    expect(model.sheets.length).toBe(2);
    expect(model.sheets[1].title).toBe('SPRING 2018');
    expect(model.sheets[1].sheetId).toBe(1242888778);
    expect(model.sheets[1].gridProperties).toStrictEqual({
      rowCount: 20,
      columnCount: 11,
    });
  });

  test('should reverse the order of sheet models to be chronological', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    expect(model.sheets.length).toBe(2);
    expect(model.sheets[0].title).toBe('WINTER 2018');
    expect(model.sheets[1].title).toBe('SPRING 2018');
  });

  test('should extract the sheet dev-metadata into a key-value map', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    expect(model.sheets[1].metadata).toStrictEqual({
      'foo': 'bar sheet',
      'season-start-date': '1573772820000',
      'SPRING 2018 Start Date': 'Sat, 14 Apr 2018 07:00:00 GMT',
    });
  });

  test('should extract a row model for each row of the sheet', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    const rowData = model.sheets[1].data;
    expect(rowData.length).toBe(14);
    expect(rowData[0].cells).toEqual([
      'Ginga Eiyuu Densetsu: Die Neue These - Kaikou', 'Ep. 01: 4 to 4', 'BYE',
      'Ep. 02: 3 to 7'
    ]);
    expect(rowData[0].metadata).toStrictEqual({
      'foobar key': 'barbaz val',
      'barbar key': 'bebe val',
    });
  });

  test('should provide safe default values for missing fields', () => {
    const mockEmptyRes: sheets_v4.Schema$Spreadsheet = {
      properties: {},
      sheets: [{
        properties: {gridProperties: {}},
        data: [{
          rowData: [{} /* title row */, {values: [{}, {effectiveValue: {}}]}],
          rowMetadata: [{}],
        }],
      }]
    };
    const model = extractSheetModelFromSpreadsheetData(mockEmptyRes);

    expect(model.title).toBe('');
    expect(model.spreadsheetId).toBe('');
    expect(model.sheets[0].title).toBe('');
    expect(model.sheets[0].sheetId).toBe(0);
    expect(model.sheets[0].gridProperties.rowCount).toBe(0);
    expect(model.sheets[0].gridProperties.columnCount).toBe(0);
    expect(model.sheets[0].metadata).toStrictEqual({});
    const rowData = model.sheets[0].data;
    expect(rowData[0].cells).toStrictEqual(['', '']);
    expect(rowData[0].metadata).toStrictEqual({});
  });

  test('should return empty sheets list if missing sheet data', () => {
    const mockRes: sheets_v4.Schema$Spreadsheet = {
      properties: {},
    };
    const model = extractSheetModelFromSpreadsheetData(mockRes);

    expect(model.sheets).toEqual([]);
  });

  test('should return empty row list if missing row data or metadata', () => {
    const mockRes: sheets_v4.Schema$Spreadsheet = {
      properties: {},
      sheets: [{
        properties: {gridProperties: {}},
        data: [{}],
      }],
    };
    const model = extractSheetModelFromSpreadsheetData(mockRes);

    expect(model.sheets[0].data).toEqual([]);
  });

  test('should drop metadata if metadataKey or metadataValue missing', () => {
    const mockRes: sheets_v4.Schema$Spreadsheet = {
      properties: {},
      sheets: [{
        properties: {gridProperties: {}},
        developerMetadata: [{metadataId: 1234}]
      }]
    };
    const model = extractSheetModelFromSpreadsheetData(mockRes);

    expect(model.sheets[0].metadata).toEqual({});
  });

  test('should drop row metadata if missing key or value', () => {
    const mockRes: sheets_v4.Schema$Spreadsheet = {
      properties: {},
      sheets: [{
        properties: {gridProperties: {}},
        developerMetadata: [],
        data: [{
          rowData: [{}, {values:[]}],  // includes title row
          rowMetadata: [
            {},
            {
              developerMetadata: [
                {location: {dimensionRange: {dimension: 'ROWS', startIndex:0}}},
              ],
            },
          ],
        }],
      }]
    };
    const model = extractSheetModelFromSpreadsheetData(mockRes);

    expect(model.sheets[0].data[0].metadata).toEqual({});
  });
});
