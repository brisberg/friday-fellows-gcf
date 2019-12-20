import {OnDeckReport, SeasonModel, SeriesModel} from '../../../model/firestore';

import {ActionsUnion, createAction, createActionPayload} from './action_utils';


export const FETCH_SEASONS_START = 'ACTION_FETCH_SEASONS_START'
export const FETCH_SEASONS_SUCCESS = 'ACTION_FETCH_SEASONS_SUCCESS';
export const FETCH_SERIES_START = 'ACTION_FETCH_SERIES_START'
export const FETCH_SERIES_SUCCESS = 'ACTION_FETCH_SERIES_SUCCESS';
export const FETCH_ONDECK_START = 'ACTION_FETCH_ONDECK_START'
export const FETCH_ONDECK_SUCCESS = 'ACTION_FETCH_ONDECK_SUCCESS';
export const SET_SEASON_START_DATE = 'ACTION_SET_SEASON_START_DATE';
export const SET_SERIES_ID = 'SET_SERIES_ID';

export const AppActions = {
  fetchSeasonsStart:
      createAction<typeof FETCH_SEASONS_START>(FETCH_SEASONS_START),
  fetchSeasonsSuccess: createActionPayload<
      typeof FETCH_SEASONS_SUCCESS,
      {json: SeasonModel[], lastSync: Date | undefined}>(FETCH_SEASONS_SUCCESS),
  fetchSeriesStart: createAction<typeof FETCH_SERIES_START>(FETCH_SERIES_START),
  fetchSeriesSuccess:
      createActionPayload<typeof FETCH_SERIES_SUCCESS, {json: SeriesModel[]}>(
          FETCH_SERIES_SUCCESS),
  fetchOnDeckStart: createAction<typeof FETCH_ONDECK_START>(FETCH_ONDECK_START),
  fetchOnDeckSuccess:
      createActionPayload<typeof FETCH_ONDECK_SUCCESS, {report: OnDeckReport}>(
          FETCH_ONDECK_SUCCESS),
  setSeasonStartDate: createActionPayload<
      typeof SET_SEASON_START_DATE,
      {season: SeasonModel, startDate: Date | null}>(SET_SEASON_START_DATE),
  setSeriesId: createActionPayload<
      typeof SET_SERIES_ID, {series: SeriesModel, seriesId: number}>(
      SET_SERIES_ID)
};

export type AllActions = ActionsUnion<typeof AppActions>;
