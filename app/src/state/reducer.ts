import {AllActions, FETCH_SEASONS} from './actions';

interface AppState {
  seasonsJson: string
}

export const initialState: AppState = {
  seasonsJson: '{}'
}

export function reducer(state: AppState = initialState, action: AllActions) {
  switch (action.type) {
    case FETCH_SEASONS:
      return {
        ...state, seasonsJson: action.payload.json,
      }
    default:
      return state;
  }
}
