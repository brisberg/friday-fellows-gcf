// tslint:disable-next-line: no-implicit-dependencies
import {Scopes} from 'contrib/googleapis';

/**
 * Configuration options for FridayFellowsUpdater and client services. Suitable
 * to override per environment
 */

/// General configs
export const LOGS_PATH = 'logs/';

/// GCP and Firebase configs
export const PROJECT_ID = 'driven-utility-202807';

/// Google Sheets client configs
export const SCOPES: Scopes = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];
export const TOKEN_PATH = 'credentials.json';
export const SECRET_PATH = 'client_secret.json';
// development sheet id
export const SPREADSHEET_ID = '1uKWMRmtN5R0Lf3iNMVmwenZCNeDntGRK7is6Jl8wi6M';

/// MAL client configs
export const MAL_CRED_PATH = 'mal_credentials.json';

/// AniList client configs
