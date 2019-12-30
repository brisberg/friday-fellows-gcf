/* istanbul ignore file */

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
];
export const SCOPES_READONLY: Scopes = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];
export const TOKEN_PATH = 'credentials.json';
export const SECRET_PATH = 'client_secret.json';
// development test sheet id
export const DEV_SPREADSHEET_ID =
    '1w9ADt88UpKwZigx6xrP_Oohc3VTPVLWqC3-ATLCyExg';
// staging sheet id
export const STAGING_SPREADSHEET_ID =
    '11Fo3g9KmR51HxEqDOMzsGZLeq5fU3q6lwxgpl6IH7cE';
// prod sheet id
export const PROD_SPREADSHEET_ID =
    '1HN0dYPEet-Zkx_9AQGCKDZGU8ygNmpymLT3y6szp0UY';
// spreadsheet id config variable actually used by the project
export const SPREADSHEET_ID = PROD_SPREADSHEET_ID;

/// MAL client configs
export const MAL_CRED_PATH = 'mal_credentials.json';

/// AniList client configs
