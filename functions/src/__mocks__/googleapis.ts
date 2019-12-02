import {sheets_v4} from 'googleapis';
import {fn} from 'jest-mock';

import {mockSetStartDateMetadataResponse} from '../helpers/testing/mockSetStartDateResponse';
import {mockSpreadsheetGetResponse} from '../helpers/testing/mockSpreadsheetResponse';

const sheetsAPI = {
  spreadsheets: {
    get: fn(() => Promise.resolve({data: mockSpreadsheetGetResponse})),
    developerMetadata: {
      search:
          fn(() => Promise.resolve<
                   {data: sheets_v4.Schema$SearchDeveloperMetadataResponse}>({
            data: {
              matchedDeveloperMetadata: [],
            },
          })),
    },
    batchUpdate:
        fn(() => Promise.resolve({data: mockSetStartDateMetadataResponse})),
  },
};

export const google = {
  auth: {
    getClient: fn(() => Promise.resolve({auth: {}})),
  },
  sheets: () => {
    return sheetsAPI;
  },
};
