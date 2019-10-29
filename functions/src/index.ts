import * as functions from 'firebase-functions';
import {google} from 'googleapis';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

export const syncFromVotingSheet = functions.https.onRequest(
    (_, res) => {google.auth
                     .getClient({
                       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                     })
                     .then((auth: any) => {
                       const api = google.sheets({version: 'v4', auth});
                       const request = api.spreadsheets.get({
                         spreadsheetId:
                             '1uKWMRmtN5R0Lf3iNMVmwenZCNeDntGRK7is6Jl8wi6M'
                       });
                       return request;
                     })
                     // This just prints out all Worksheet names as an example
                     .then(({data: {sheets}}: any) => {
                       res.status(200).send({sheets});
                     })
                     .catch((err: any) => {
                       res.status(500).send({err});
                     })});
