/**
 * Export all Cloud Functions
 *
 */
import admin from 'firebase-admin';

import {getAllSeasons} from './getAllSeasons.f';
import {getSeries} from './getSeries.f';
import {setSeasonStartDate} from './setSeasonStartDate.f';
import {syncFromVotingSheet} from './syncFromVotingSheet.f';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

export {
  getAllSeasons,
  getSeries,
  setSeasonStartDate,
  syncFromVotingSheet,
};
