import {SeasonModel} from '../../../model/firestore';

import {ActionsUnion, createAction, createActionPayload} from './action_utils';


export const FETCH_SEASONS_START = 'ACTION_FETCH_SEASONS_START'
export const FETCH_SEASONS_SUCCESS = 'ACTION_FETCH_SEASONS_SUCCESS';
export const SET_SEASON_START_DATE = 'SET_SEASON_START_DATE';

export const AppActions = {
  fetchSeasonsStart:
      createAction<typeof FETCH_SEASONS_START>(FETCH_SEASONS_START),
  fetchSeasonsSuccess: createActionPayload<
      typeof FETCH_SEASONS_SUCCESS,
      {json: SeasonModel[], lastSync: Date | undefined}>(FETCH_SEASONS_SUCCESS),
  setSeasonStartDate: createActionPayload<
      typeof SET_SEASON_START_DATE,
      {season: SeasonModel, startDate: Date | null}>(SET_SEASON_START_DATE)
};

export type AllActions = ActionsUnion<typeof AppActions>;
