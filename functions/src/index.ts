/**
 * Export all Cloud Functions
 *
 */
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

import {getAllSeasons} from './getAllSeasons.f';
import {getOnDeckReports} from './getOnDeckReports.f';
import {getSeries} from './getSeries.f';
import {setSeasonStartDate} from './setSeasonStartDate.f';
import {setSeriesId} from './setSeriesId.f';
import {syncFromVotingSheet, syncFromVotingSheetCron} from './syncFromVotingSheet.f';

export {
  getAllSeasons,
  getOnDeckReports,
  getSeries,
  setSeasonStartDate,
  setSeriesId,
  syncFromVotingSheet,
  syncFromVotingSheetCron,
};
