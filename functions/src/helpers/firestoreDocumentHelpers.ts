import {Season, SeasonModel, SeriesModel, SeriesType, SeriesVotingRecord, VotingStatus} from '../model/firestore';
import {SERIES_AL_ID_KEY, SeriesMetadataPayload, SpreadsheetModel, START_DATE_METADATA_KEY, WorksheetModel, WorksheetRowModel} from '../model/sheets';

/**
 * Tuple of a season model and series models returned from Firestore Document
 * helpers.
 */
interface SeasonSeriesDocuments {
  season: SeasonModel;
  seriesList: SeriesModel[];
}
/**
 * Extracts Season domain documents from a SpreadsheetModel suitable for
 * storage in Firestore.
 * @param model Domain model of a Voting Spreadsheet from GoogleSheets
 */
export function extractFirestoreDocuments(model: SpreadsheetModel) {
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
      seriesList: extractSeriesDocuments(sheet.sheetId, sheet.data),
    });
  });

  return results;
}

/** Extracts Firestore Series documents from a worksheet row */
function extractSeriesDocuments(
    seasonId: number, rows: WorksheetRowModel[]): SeriesModel[] {
  return rows.map((row, index): SeriesModel => {
    const metadataPayload: SeriesMetadataPayload =
        JSON.parse(row.metadata[SERIES_AL_ID_KEY] || '{}');
    const {alId, malId, episodes, titleEn, type} = metadataPayload;

    let seriesType = SeriesType.Unknown;
    switch (type) {
      case SeriesType.Series:
        seriesType = SeriesType.Series;
        break;
      case SeriesType.Short:
        seriesType = SeriesType.Short;
        break;
    }

    const votingRecords = extractSeriesVotingRecord(row.cells.slice(1));

    return {
      titleRaw: row.cells[0] || '',
      titleEn: titleEn || '',
      rowIndex: index + 1,  // offset for Title row being dropped
      idAL: alId || -1,
      idMal: malId || -1,
      seasonId: seasonId,
      type: seriesType || '',
      episodes: episodes || -1,
      votingStatus: VotingStatus.Unknown,
      votingRecord: votingRecords,
    };
  });
}

/**
 * Extracts a list of VotingRecord objects from the raw cell strings from
 * Google Sheets.
 */
function extractSeriesVotingRecord(cells: string[]): SeriesVotingRecord[] {
  return cells.map((cell, index): SeriesVotingRecord => {
    const parsedCell = parseVoteCell(cell);
    return {
      episodeNum: parsedCell.episode,
      weekNum: index + 1,
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

interface ParsedCellInfo {
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
function parseVoteCell(value: string): ParsedCellInfo {
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
