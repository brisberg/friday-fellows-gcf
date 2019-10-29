// tslint:disable-next-line: no-implicit-dependencies
import {Scopes} from 'contrib/googleapis';
import {google} from 'googleapis';

async function getAuth(scopes: Scopes) {
  return await google.auth.getClient({scopes});
};

export async function getSheetsClient(scopes: Scopes) {
  const auth = await getAuth(scopes);
  return google.sheets({version: 'v4', auth});
}
