import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionMainItemModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
}

var statisticsChampionMainItemSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
});

export default model<IStatisticsChampionMainItemModel>(
  'statistics_champion_main_item',
  statisticsChampionMainItemSchema
);
