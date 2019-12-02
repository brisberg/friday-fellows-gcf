import {sheets_v4} from 'googleapis';

export const mockSetStartDateMetadataResponse:
    sheets_v4.Schema$BatchUpdateSpreadsheetResponse = {
  'spreadsheetId': '1w9ADt88UpKwZigx6xrP_Oohc3VTPVLWqC3-ATLCyExg',
  'replies': [{
    'updateDeveloperMetadata': {
      'developerMetadata': [
        {
          'metadataId': 178253474,
          'metadataKey': 'season-start-date',
          'metadataValue': '1573600020000',
          'location': {'locationType': 'SHEET', 'sheetId': 1242888778},
          'visibility': 'PROJECT'
        },
        {
          'metadataId': 1967694573,
          'metadataKey': 'season-start-date',
          'metadataValue': '1573600020000',
          'location': {'locationType': 'SHEET', 'sheetId': 281991772},
          'visibility': 'PROJECT'
        }
      ]
    }
  }]
};
