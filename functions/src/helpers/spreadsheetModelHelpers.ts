import {GaxiosResponse} from 'gaxios';
import {sheets_v4} from 'googleapis';

import {SpreadsheetModel, WorksheetModel, WorksheetRowModel} from '../model/sheets';


/**
 * Convert a response from spreadsheets.get into a SpreadsheetModel domain
 * object.
 */
export function extractSheetModelFromSpreadsheetResponse(
    res: GaxiosResponse<sheets_v4.Schema$Spreadsheet>): SpreadsheetModel {
  const data = res.data;

  const sheetModel: SpreadsheetModel = {
    spreadsheetId: data.spreadsheetId || '',
    title: data.properties!.title || '',
    sheets: [],
  };

  let sheets: WorksheetModel[] = [];
  if (data.sheets) {
    sheets = data.sheets.map((sheet): WorksheetModel => {
      // Extract the developer metadata into key-value pairs
      const metadataMap: {[key: string]: string} = {};
      if (sheet.developerMetadata) {
        sheet.developerMetadata.map((metadata) => {
          if (metadata.metadataKey && metadata.metadataValue) {
            metadataMap[metadata.metadataKey] = metadata.metadataValue;
          }
        })
      }

      let rows: WorksheetRowModel[] = [];
      rows = handleSheetRowData(sheet.data![0]);

      return {
        title: sheet.properties!.title || '',
        sheetId: sheet.properties!.sheetId || 0,
        gridProperties: {
          rowCount: sheet.properties!.gridProperties!.rowCount || 0,
          columnCount: sheet.properties!.gridProperties!.columnCount || 0,
        },
        data: rows,
        metadata: metadataMap,
      };
    });
  }

  sheetModel.sheets = sheets.reverse();
  return sheetModel;
}

/**
 * Extract a set of WorksheetRowModels from the gridData portion of a
 * SpreadSheets.get response
 */
function handleSheetRowData(data: sheets_v4.Schema$GridData):
    WorksheetRowModel[] {
  const result: WorksheetRowModel[] = [];
  if (data.rowData && data.rowMetadata) {
    const metadataByRow: MetadataMapByRow =
        extractMetadataByRowIndex(data.rowMetadata);

    data.rowData.shift();  // Remove the title row
    for (let i = 0; i < data.rowData.length; i++) {
      const row = data.rowData[i];
      const rowMeta = metadataByRow[i + 1] || {};

      result.push({
        cells: row.values!.map((cell) => {
          if (!cell.effectiveValue) {
            return '';
          } else {
            return cell.effectiveValue.stringValue || '';
          }
        }),
        metadata: rowMeta,
      });
    }
  }
  return result;
}

/** Map of RowIndex -> MetadataKey -> MetadataValue */
type MetadataMapByRow = {
  [key: number]: {[key: string]: string}
};

function extractMetadataByRowIndex(
    dimProps: sheets_v4.Schema$DimensionProperties[]): MetadataMapByRow {
  const metadataMap: MetadataMapByRow = {};
  dimProps.forEach((rowMetadata) => {
    if (!rowMetadata.developerMetadata) {
      return;
    }

    for (const metadata of rowMetadata.developerMetadata) {
      const rowIndex = metadata.location!.dimensionRange!.startIndex!;
      if (!metadataMap[rowIndex]) {
        metadataMap[rowIndex] = {};
      }
      if (metadata.metadataKey && metadata.metadataValue) {
        metadataMap[rowIndex][metadata.metadataKey] = metadata.metadataValue;
      }
    }
  })

  return metadataMap;
}
