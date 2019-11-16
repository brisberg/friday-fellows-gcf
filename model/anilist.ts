import {SeriesModel} from './firestore';

/// Export to List Service models
export enum WatchStatus {
  Watching = 0,
  Dropped,
  Completed,
}

export interface AnimeListRecord {
  series: SeriesModel;
  status: WatchStatus;
  startDate: Date;
  completedDate?: Date;
  tags: string[];
  score?: number;
  progress: number;
}
