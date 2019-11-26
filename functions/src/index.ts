/**
 * Export all Cloud Functions
 *
 */
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

import {getAllSeasons} from './getAllSeasons.f';
import {getSeries} from './getSeries.f';
import {setSeasonStartDate} from './setSeasonStartDate.f';
import {syncFromVotingSheet} from './syncFromVotingSheet.f';

export {
  getAllSeasons,
  getSeries,
  setSeasonStartDate,
  syncFromVotingSheet,
};
