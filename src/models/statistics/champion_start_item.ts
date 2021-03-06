import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionStartItemModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
}

var statisticsChampionStartItemSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
});

export default model<IStatisticsChampionStartItemModel>(
  'statistics_champion_start_item',
  statisticsChampionStartItemSchema
);
