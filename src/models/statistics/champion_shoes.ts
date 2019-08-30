import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionShoesModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  shoes: number;
  averageTimestamp: number;
}

var statisticsChampionShoesSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  shoes: Number,
  averageTimestamp: Number,
});

export default model<IStatisticsChampionShoesModel>(
  'statistics_champion_shoes',
  statisticsChampionShoesSchema
);
