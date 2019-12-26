import {OnDeckReport} from '../../model/firestore';

export const StandardReport: OnDeckReport = {
  created: 50,
  lastSync: 50,
  targetWatchDate: 100,
  seasonName: 'FALL 2019',
  week: 3,
  series: [
    {title: {raw: 'Teekyuu'}, episode: 3},
    {title: {raw: 'Aldnoah Zero'}, episode: 9},
    {title: {raw: 'Absolute Duo'}, episode: 10},
  ],
};

export const TwoHundredReport: OnDeckReport = {
  ...StandardReport,
  created: 200,
  targetWatchDate: 200,
};

export const RecentReport: OnDeckReport = {
  ...StandardReport,
  created: 250,
  targetWatchDate: 300,
};

export const OlderReport: OnDeckReport = {
  ...StandardReport,
  created: 10,
  lastSync: 10,
  targetWatchDate: 20,
};

export const EmptyReport: OnDeckReport = {
  ...StandardReport,
  series: [],
};
