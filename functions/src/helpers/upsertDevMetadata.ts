import {sheets_v4} from 'googleapis';
import {SPREADSHEET_ID} from '../config';

export interface UpsertMetadataOptions {
  spreadsheetId: string;
  metadataKey: string;
  metadataValue: string;
  location: sheets_v4.Schema$DeveloperMetadataLocation;
  visibility: 'PROJECT'|'DOCUMENT';
}

/** Convenience wrapper to upsert metadata on the whole spreadsheet. */
export function getUpsertSpreadsheetMetadata(
    api: sheets_v4.Sheets, key: string, value: string) {
  return getUpsertMetadataRequest(api, {
    spreadsheetId: SPREADSHEET_ID,
    metadataKey: key,
    metadataValue: value,
    location: {
      spreadsheet: true,
    },
    visibility: 'PROJECT',
  });
}

/** Convenience wrapper to upsert metadata on a specific sheet. */
export function getUpsertSheetMetadata(
    api: sheets_v4.Sheets, sheetId: number, key: string, value: string) {
  return getUpsertMetadataRequest(api, {
    spreadsheetId: SPREADSHEET_ID,
    metadataKey: key,
    metadataValue: value,
    location: {
      sheetId,
    },
    visibility: 'PROJECT',
  });
}

/** Convenience wrapper to upsert metadata on a specific sheet row. */
export function getUpsertSheetRowMetadata(
    api: sheets_v4.Sheets, sheetId: number, row: number, key: string,
    value: string) {
  return getUpsertMetadataRequest(api, {
    spreadsheetId: SPREADSHEET_ID,
    metadataKey: key,
    metadataValue: value,
    location: {
      sheetId,
      dimensionRange: {
        startIndex: row,
        endIndex: row + 1,
      }
    },
    visibility: 'PROJECT',
  });
}

/**
 * Implements Upsert sementics for developer metadata. First queries for the
 * metadata by key and location and updates it if found. If not creates a new
 * metadata with the specified value.
 */
export async function getUpsertMetadataRequest(
    api: sheets_v4.Sheets, options: UpsertMetadataOptions) {
  const lookupReq = api.spreadsheets.developerMetadata.search({
    spreadsheetId: options.spreadsheetId,
    requestBody: {
      dataFilters: [{
        developerMetadataLookup: {
          metadataKey: options.metadataKey,
          metadataLocation: options.location,
        }
      }],
    },
  });

  const existingMetadata = await lookupReq;

  let metadataId;
  const matchedMetadata = existingMetadata.data.matchedDeveloperMetadata;
  // TODO: Maybe we should log an error if more than one metadata match?
  if (matchedMetadata && matchedMetadata.length > 0) {
    metadataId = matchedMetadata[0].developerMetadata!.metadataId;
  }

  const requests: sheets_v4.Schema$Request[] = [];
  if (metadataId) {
    // Metadata exists, update it
    requests.push({
      updateDeveloperMetadata: {
        dataFilters: [{
          developerMetadataLookup: {
            metadataKey: options.metadataKey,
          },
        }],
        developerMetadata: {
          metadataKey: options.metadataKey,
          metadataValue: options.metadataValue,
          location: options.location,
          visibility: options.visibility,
        },
        fields: 'metadataValue',
      },
    });
  } else {
    // No metadata exists, need to create it
    requests.push({
      createDeveloperMetadata: {
        developerMetadata: {
          metadataKey: options.metadataKey,
          metadataValue: options.metadataValue,
          location: options.location,
          visibility: options.visibility,
        }
      }
    });
  }

  return requests;
}
