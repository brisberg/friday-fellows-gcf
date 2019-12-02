import {mockResponse} from '../helpers/testing/mockSpreadsheetResponse';

export const google = {
  auth: {
    getClient: jest.fn(() => Promise.resolve({auth: {}})),
  },
  sheets: () => {
    return {
      spreadsheets: {
        get: jest.fn(() => Promise.resolve({data: mockResponse})),
      },
    };
  },
};
