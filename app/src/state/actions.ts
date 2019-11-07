import {ActionsUnion, createActionPayload} from './action_utils';

export const FETCH_SEASONS = 'ACTION_FETCH_SEASONS';

export const AppActions = {
  fetchSeasons:
      createActionPayload<typeof FETCH_SEASONS, {json: []}>(FETCH_SEASONS),
};

export type AllActions = ActionsUnion<typeof AppActions>;
