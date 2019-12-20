import {OnDeckReport} from '../../model/firestore';

export const StandardReport: OnDeckReport = {
  lastSync: 50,
  targetWatchDate: 100,
  created: 50,
  series: [
    {seriesTitle: 'Teekyuu', episode: 3},
    {seriesTitle: 'Aldnoah Zero', episode: 9},
    {seriesTitle: 'Absolute Duo', episode: 10},
  ],
};
