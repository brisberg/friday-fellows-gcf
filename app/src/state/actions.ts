import {ActionsUnion, createActionPayload} from './action_utils';
import {SeasonModel} from './reducer';

export const FETCH_SEASONS = 'ACTION_FETCH_SEASONS';

export const AppActions = {
  fetchSeasons:
      createActionPayload<typeof FETCH_SEASONS, {json: SeasonModel[]}>(
          FETCH_SEASONS),
};

export type AllActions = ActionsUnion<typeof AppActions>;
