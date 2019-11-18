import {Firestore} from '@google-cloud/firestore';
import * as functions from 'firebase-functions';

import {PROJECT_ID, SCOPES_READONLY, SPREADSHEET_ID} from './config'
import {getSheetsClient} from './google.auth';
import {extractSheetModelFromSpreadsheetData} from './helpers/spreadsheetModelHelpers';
import {CONFIG_COLLECTION, Season, SeasonModel, SEASONS_COLLECTION, SERIES_COLLECTION, SeriesModel, SeriesType, SeriesVotingRecord, SYNC_STATE_KEY, VotingStatus} from './model/firestore';
import {SyncFromVotingSheetResponse} from './model/service';
import {SERIES_AL_ID_KEY, SERIES_EPISODE_COUNT_KEY, SERIES_TYPE_KEY, SpreadsheetModel, START_DATE_METADATA_KEY, WorksheetModel, WorksheetRowModel} from './model/sheets';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

exports = module.exports = functions.https.onRequest(async (_, res) => {
  const api = await getSheetsClient(SCOPES_READONLY);

  const metadataFields = [
    'spreadsheetId',
    'properties.title',
    'sheets.data.rowData.values.effectiveValue',
    'sheets.data.rowMetadata.developerMetadata',
    'sheets.developerMetadata',  // Metadata for the sheet
    'sheets.properties.sheetId',
    'sheets.properties.title',
    'sheets.properties.gridProperties',
  ].join(',');

  // 'sheets.data.rowMetadata' // Metadata for the specific row

  const request = api.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: metadataFields,
  });
  try {
    const resp = await request;

    const sheetModel = extractSheetModelFromSpreadsheetData(resp.data);
    const allDocuments = extractFirestoreDocuments(sheetModel);

    const batch = firestore.batch();
    const seasonCollection = firestore.collection(SEASONS_COLLECTION);

    for (const docsTuple of allDocuments) {
      const {season, seriesList} = docsTuple;
      const seasonRef = seasonCollection.doc(String(season.sheetId));
      batch.set(seasonRef, season);

      for (const series of seriesList) {
        const seriesRef = seasonRef.collection(SERIES_COLLECTION).doc();
        batch.set(seriesRef, series);
      }
    }

    // Record the timestamp of the latest sync
    const syncTimestamp = new Date().getTime();
    batch.set(
        firestore.doc(CONFIG_COLLECTION + '/' + SYNC_STATE_KEY),
        {lastSync: syncTimestamp});

    await batch.commit();

    const payload: SyncFromVotingSheetResponse = {
      data: resp.data,
    };
    res.status(200).send(payload);
  } catch (err) {
    console.warn(err);
    res.status(500).send({err});
  }
});

interface SeasonSeriesDocuments {
  season: SeasonModel;
  seriesList: SeriesModel[];
}
/**
 * Extracts Season domain documents from a SpreadsheetModel suitable for storage
 * in Firestore.
 * @param model Domain model of a Voting Spreadsheet from GoogleSheets
 */
function extractFirestoreDocuments(model: SpreadsheetModel) {
  const results: SeasonSeriesDocuments[] = [];

  model.sheets.map((sheet: WorksheetModel) => {
    const startDateString = sheet.metadata[START_DATE_METADATA_KEY] || null;
    const startDateMs = parseInt(startDateString || '') || null;

    results.push({
      season: {
        sheetId: sheet.sheetId,
        formattedName: sheet.title,
        year: extractYear(sheet.title),
        season: extractSeason(sheet.title),
        startDate: startDateMs,
      },
      seriesList: extractSeriesDocuments(sheet.data),
    });
  });

  return results;
}

/** Extracts Firestore Series documents from a worksheet row */
function extractSeriesDocuments(rows: WorksheetRowModel[]): SeriesModel[] {
  return rows.map((row) => {
    const anilistId = parseInt(row.metadata[SERIES_AL_ID_KEY]);
    const episodes = parseInt(row.metadata[SERIES_EPISODE_COUNT_KEY]);
    let seriesType = SeriesType.Unknown;
    const typeMetadata = row.metadata[SERIES_TYPE_KEY];
    switch (typeMetadata) {
      case SeriesType.Series:
        seriesType = SeriesType.Series;
        break;
      case SeriesType.Short:
        seriesType = SeriesType.Short;
        break;
    }

    return {
      titleEn: row.cells[0],
      seasonId: anilistId || null,
      type: seriesType,
      episodes: episodes || -1,
      votingStatus: VotingStatus.Watching,
      votingRecord: extractSeriesVotingRecord(row.cells.slice(1)),
    };
  });
}

/**
 * Extracts a list of VotingRecord objects from the raw cell strings from
 * Google Sheets.
 */
function extractSeriesVotingRecord(cells: string[]): SeriesVotingRecord[] {
  return cells.map((cell) => {
    const parsedCell = parseVoteCell(cell);
    return {
      seriesId: -1,
      episodeNum: parsedCell.episode,
      weekNum: -1,
      votesFor: parsedCell.votesFor,
      votesAgainst: parsedCell.votesAgainst,
    };
  });
}


/// Utils

/**
 * Extracts the numerical year from a season sheet title.
 * @param title Sheet title (Ex. 'WINTER 2015')
 */
function extractYear(title: string): number {
  return parseInt(title.split(' ')[1]);
}

/**
 * Extracts the numerical year from a season sheet title.
 * @param title Sheet title (Ex. 'WINTER 2015')
 */
function extractSeason(title: string): Season {
  try {
    return Season[title.split(' ')[0] as keyof typeof Season];
  } catch (e) {
    console.warn('Could not parse season name from: ' + title);
    return Season.UNKNOWN;
  }
}

export interface ParsedCellInfo {
  episode: number;
  votesFor: number;
  votesAgainst: number;
}

/**
 * @param {number} index column index of this cell
 * @param {string} value string of the form "Ep. <epNum>: <votesFor> to
 * <votesAgainst>" to parse into its variable parts.
 * @return {ParsedCellInfo} Wrapper for episodes, votesFor and
 * VotesAgainst.
 */
export function parseVoteCell(value: string): ParsedCellInfo {
  const parts = value.split(' ');
  if (parts.length !== 5) {
    // console.warn('Could not parse voting cell: ' + value);
    // TODO: Batch together parse errors for reporting
    return {episode: -1, votesFor: -1, votesAgainst: -1};
  }
  const episode = parseInt(parts[1].slice(0, -1));
  const votesFor = parseInt(parts[2]);
  const votesAgainst = parseInt(parts[4]);
  return {episode, votesFor, votesAgainst};
}
