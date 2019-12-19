// tslint:disable-next-line: no-import-side-effect
import 'jest';

import {OnDeckReportRow, Season, SeasonModel, SeriesModel, SeriesType, SeriesVotingRecord, VotingStatus} from '../model/firestore';

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

const passingRecord: SeriesVotingRecord = {
  weekNum: 1,
  episodeNum: 1,
  votesFor: 2,
  votesAgainst: 1,
};

const failedRecord: SeriesVotingRecord = {
  weekNum: 1,
  episodeNum: 1,
  votesFor: 1,
  votesAgainst: 2,
};

describe('aggregateVotingStatus', () => {
  const mockNow = new Date('6/1/2010').getTime();
  beforeAll(() => {
    // Lock Time
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
  });
  afterAll(() => {
    (Date.now as unknown as jest.SpyInstance).mockRestore();
  });

  test('should exit early if season has no start date', () => {
    const nullSeason: SeasonModel = {
      ...staticSeason,
      startDate: null,
    };

    const report = aggregateVotingStatus(nullSeason, []);

    expect(report).toBeUndefined();
    // TODO: expect an error logged
  });

  describe('for past seasons', () => {
    const pastSeason: SeasonModel = {
      ...staticSeason,
      startDate: new Date('1/1/2009').getTime(),
    };

    test('should set all series to completed/dropped for past seasons', () => {
      const droppedSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [failedRecord],
      };

      const completeSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [passingRecord],
      };

      const seriesList: SeriesModel[] = [droppedSeries, completeSeries];

      aggregateVotingStatus(pastSeason, seriesList);

      expect(droppedSeries.votingStatus).toEqual(VotingStatus.Dropped);
      expect(completeSeries.votingStatus).toEqual(VotingStatus.Completed);
    });

    test('should return no report for past seasons', () => {
      const passingSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [passingRecord],
      };
      const report = aggregateVotingStatus(pastSeason, [passingSeries]);

      expect(report).toBeUndefined();
    });
  });

  describe('for current season', () => {
    const currentSeason = {
      ...staticSeason,
      startDate: new Date('5/1/2010').getTime(),
    };

    test('should set series with a failed vote to dropped', () => {
      const droppedSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [failedRecord],
      };

      aggregateVotingStatus(currentSeason, [droppedSeries]);

      expect(droppedSeries.votingStatus).toEqual(VotingStatus.Dropped);
    });

    test('should set unknown if series has no records', () => {
      const emptySeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [],
      };

      aggregateVotingStatus(currentSeason, [emptySeries]);

      expect(emptySeries.votingStatus).toEqual(VotingStatus.Unknown);
    });

    test('should set completed if watched the last episode of series', () => {
      const completeSeries: SeriesModel = {
        ...staticSeries,
        episodes: 2,
        votingRecord: [{
          ...passingRecord,
          episodeNum: 2,
        }],
      };

      aggregateVotingStatus(currentSeason, [completeSeries]);

      expect(completeSeries.votingStatus).toEqual(VotingStatus.Completed);
    });

    test('should set unknown the voting record is from the future', () => {
      const invalidSeries: SeriesModel = {
        ...staticSeries,
        episodes: 2,
        votingRecord: [{
          ...passingRecord,
          weekNum: 5,
        }],
      };

      aggregateVotingStatus(currentSeason, [invalidSeries]);

      expect(invalidSeries.votingStatus).toEqual(VotingStatus.Unknown);
    });

    test('should set watching if voting record is from this week', () => {
      const completeSeries: SeriesModel = {
        ...staticSeries,
        episodes: 2,
        votingRecord: [{
          ...passingRecord,
          weekNum: 4,  // current week
        }],
      };

      aggregateVotingStatus(currentSeason, [completeSeries]);

      expect(completeSeries.votingStatus).toEqual(VotingStatus.Watching);
    });

    test('should append passing records if vote from previous week', () => {
      const passingSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [{
          ...passingRecord,
          weekNum: 1,
        }],
      };

      aggregateVotingStatus(currentSeason, [passingSeries]);

      expect(passingSeries.votingStatus).toEqual(VotingStatus.Watching);
      expect(passingSeries.votingRecord.length).toEqual(4);
      expect(passingSeries.votingRecord).toEqual([
        {...passingRecord, weekNum: 1},
        {msg: 'PASS', weekNum: 2, episodeNum: 2, votesFor: 0, votesAgainst: 0},
        {msg: 'PASS', weekNum: 3, episodeNum: 3, votesFor: 0, votesAgainst: 0},
        {msg: 'PASS', weekNum: 4, episodeNum: 4, votesFor: 0, votesAgainst: 0},
      ]);
    });

    test('should mark completed if last episode aired since last vote', () => {
      const passingSeries: SeriesModel = {
        ...staticSeries,
        episodes: 3,
        votingRecord: [{
          ...passingRecord,
          weekNum: 1,
        }],
      };

      aggregateVotingStatus(currentSeason, [passingSeries]);

      expect(passingSeries.votingStatus).toEqual(VotingStatus.Completed);
      expect(passingSeries.votingRecord.length).toEqual(3);
      expect(passingSeries.votingRecord).toEqual([
        {...passingRecord, weekNum: 1},
        {msg: 'PASS', weekNum: 2, episodeNum: 2, votesFor: 0, votesAgainst: 0},
        {msg: 'PASS', weekNum: 3, episodeNum: 3, votesFor: 0, votesAgainst: 0},
      ]);
    });

    test('should return a report of all WATCHING series', () => {
      const watchingSeries: SeriesModel = {
        ...staticSeries,
        votingRecord: [{
          ...passingRecord,
          weekNum: 4,  // current week
          episodeNum: 4,
        }]
      };

      const report = aggregateVotingStatus(currentSeason, [watchingSeries]);

      expect(report).toBeTruthy();
      expect(report!.lastSync).toEqual(-1);
      expect(report!.created).toEqual(mockNow);
      // TODO: calculate next friday
      expect(report!.expectedWatchDate).toEqual(mockNow);
      expect(report!.series.length).toEqual(1);
      expect(report!.series).toEqual<OnDeckReportRow[]>([
        {seriesTitle: staticSeries.titleRaw, episode: 5}
      ]);
    });
  });
});
