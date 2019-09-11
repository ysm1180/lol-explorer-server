import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionFinalItemModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  item: number;
}

var statisticsChampionFinalItemSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  item: Number,
});

export default model<IStatisticsChampionFinalItemModel>(
  'statistics_champion_final_item',
  statisticsChampionFinalItemSchema
);
