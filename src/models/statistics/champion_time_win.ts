import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionTimeWinModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  gameMinutes: number;
}

var statisticsChampionTimeWinSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  gameMinutes: Number,
});

export default model<IStatisticsChampionTimeWinModel>(
  'statistics_champion_time_win',
  statisticsChampionTimeWinSchema
);
