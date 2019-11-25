// tslint:disable-next-line: no-import-side-effect
import 'jest';
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
    expect(model.sheets[1].gridProperties).toEqual({
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

    expect(model.sheets[1].metadata).toEqual({
      'foo': 'bar sheet',
      'season-start-date': '1573772820000',
      'SPRING 2018 Start Date': 'Sat, 14 Apr 2018 07:00:00 GMT',
    });
  });

  test('should extract a row model for each row of the sheet', () => {
    const model = extractSheetModelFromSpreadsheetData(mockResponse);

    const rowData = model.sheets[0].data;
    expect(rowData.length).toBe(17);
    expect(rowData[0].cells).toEqual([
      'Gakuen Babysitters',
      'Ep. 01: 0 to 7',
    ]);
    expect(rowData[0].metadata).toEqual({});  // TODO: fill once we have data
  });
});
