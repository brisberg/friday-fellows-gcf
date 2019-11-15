import {AllActions, FETCH_SEASONS_START, FETCH_SEASONS_SUCCESS, SET_SEASON_START_DATE} from './actions';

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
  seasons: SeasonModel[];
  lastSync: Date|undefined;
  loadingSeasons: boolean;
}

export const initialState: AppState = {
  seasons: [],
  lastSync: undefined,
  loadingSeasons: false,
}

export function reducer(state: AppState = initialState, action: AllActions) {
  switch (action.type) {
    case FETCH_SEASONS_START:
      return {
        ...state, loadingSeasons: true,
      }
    case FETCH_SEASONS_SUCCESS:
      return {
        ...state, seasons: action.payload.json,
            lastSync: action.payload.lastSync, loadingSeasons: false,
      }
    case SET_SEASON_START_DATE:
      const index = state.seasons.indexOf(action.payload.season);
      return {
        ...state, seasons: state.seasons.map((season, idx) => {
          if (idx !== index) {
            // This isn't the item we care about - keep it as-is
            return season
          }

          // Otherwise, this is the one we want - return an updated value
          const startDate = action.payload.startDate;
          return {
            ...season, startDate: startDate ? startDate.getTime() : null,
          }
        })
      }
    default:
      return state;
  }
}
