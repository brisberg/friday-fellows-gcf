// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {Season, SeasonModel, SeriesModel, SeriesType, VotingStatus} from '../model/firestore';

import {aggregateVotingStatus} from './aggregateVotingRecordsHelpers';

const staticSeason: SeasonModel = {
  formattedName: 'Mock Season',
  season: Season.FALL,
  sheetId: 12345,
  year: 2010,
  startDate: 12345,
};

const staticSeries: SeriesModel = {
  titleEn: 'Teekyuu',
  titleRaw: 'Teekyuu',
  seasonId: 12345,
  rowIndex: 1,
  type: SeriesType.Short,
  episodes: 12,
  votingStatus: VotingStatus.Unknown,
  votingRecord: [],
};

describe('aggregateVotingStatus', () => {
  beforeAll(() => {
    // Lock Time
    const timestamp = new Date('12/3/2010').getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
  });
  afterAll(() => {
    (Date.now as unknown as jest.SpyInstance).mockRestore();
  });

  test('should set all series to completed/dropped for past seasons', () => {
    const pastSeason: SeasonModel = {
      ...staticSeason,
      startDate: new Date('1/1/2009').getTime(),
    };

    const droppedSeries: SeriesModel = {
      ...staticSeries,
      votingRecord: [{
        weekNum: 0,
        episodeNum: 1,
        votesFor: 1,
        votesAgainst: 2,
      }]
    };

    const completeSeries: SeriesModel = {
      ...staticSeries,
      votingRecord: [{
        weekNum: 0,
        episodeNum: 1,
        votesFor: 2,
        votesAgainst: 1,
      }]
    };

    const seriesList: SeriesModel[] = [droppedSeries, completeSeries];

    aggregateVotingStatus(pastSeason, seriesList);

    expect(droppedSeries.votingStatus).toEqual(VotingStatus.Dropped);
    expect(completeSeries.votingStatus).toEqual(VotingStatus.Completed);
  });
});
