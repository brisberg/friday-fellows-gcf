import {ActionsUnion, createActionPayload} from './action_utils';
import {SeasonModel} from './reducer';

export const FETCH_SEASONS = 'ACTION_FETCH_SEASONS';
export const SET_SEASON_START_DATE = 'SET_SEASON_START_DATE';

export const AppActions = {
  fetchSeasons:
      createActionPayload<typeof FETCH_SEASONS, {json: SeasonModel[]}>(
          FETCH_SEASONS),
  setSeasonStartDate: createActionPayload<
      typeof SET_SEASON_START_DATE,
      {season: SeasonModel, startDate: Date | null}>(SET_SEASON_START_DATE)
};

export type AllActions = ActionsUnion<typeof AppActions>;
