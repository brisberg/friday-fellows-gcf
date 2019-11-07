import {AllActions, FETCH_SEASONS} from './actions';

export enum Season {
  UNKNOWN = 0,
  SPRING,
  SUMMER,
  FALL,
  WINTER,
}

export interface SeasonModel {
  formattedName: string;  // ex. 'WINTER 2014'
  year: number;
  season: Season;
  sheetId: number;  // id of the sheet in the source SpreadSheet
  // date of the first episode viewing this season in mills. null if not set
  startDate: number|null;
}

interface AppState {
  seasonsJson: SeasonModel[]
}

export const initialState: AppState = {
  seasonsJson: []
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
