import {OnDeckReport} from '../../model/firestore';

export const StandardReport: OnDeckReport = {
  lastSync: 0,
  targetWatchDate: 0,
  created: 0,
  series: [
    {seriesTitle: 'Teekyuu', episode: 3},
    {seriesTitle: 'Aldnoah Zero', episode: 9},
    {seriesTitle: 'Absolute Duo', episode: 10},
  ],
};
