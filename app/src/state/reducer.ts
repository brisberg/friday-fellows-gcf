import {SeasonModel, SeriesModel} from '../../../model/firestore';

import {AllActions, FETCH_SEASONS_START, FETCH_SEASONS_SUCCESS, FETCH_SERIES_START, FETCH_SERIES_SUCCESS, SET_SEASON_START_DATE, SET_SERIES_ID} from './actions';

export enum Season {
  UNKNOWN = 0,
  SPRING,
  SUMMER,
  FALL,
  WINTER,
}

interface AppState {
  seasons: SeasonModel[];
  loadingSeasons: boolean;
  seriesForSeason: SeriesModel[];
  loadingSeries: boolean;
  lastSync: Date|undefined;
}

export const initialState: AppState = {
  seasons: [],
  loadingSeasons: false,
  seriesForSeason: [],
  loadingSeries: false,
  lastSync: undefined,
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
    case FETCH_SERIES_START:
      return {
        ...state, loadingSeries: true,
      }
    case FETCH_SERIES_SUCCESS:
      return {
        ...state, seasons: action.payload.json, loadingSeries: false,
      }
    case SET_SEASON_START_DATE:
      const seasonIdx = state.seasons.indexOf(action.payload.season);
      return {
        ...state, seasons: state.seasons.map((season, idx) => {
          if (idx !== seasonIdx) {
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
    case SET_SERIES_ID:
      const seriesIdx = state.seriesForSeason.indexOf(action.payload.series);
      return {
        ...state, seriesForSeason: state.seriesForSeason.map((series, idx) => {
          if (idx !== seriesIdx) {
            // This isn't the item we care about - keep it as-is
            return series
          }

          // Otherwise, this is the one we want - return an updated value
          const seriesId = action.payload.seriesId;
          return {
            ...series, idAL: seriesId || null,
          }
        })
      }
    default:
      return state;
  }
}
