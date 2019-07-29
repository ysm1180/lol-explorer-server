import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalStartItemModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
}

var statisticsChampionRivalStartItemSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
});

export default model<IStatisticsChampionRivalStartItemModel>(
  'statistics_champion_rival_start_item',
  statisticsChampionRivalStartItemSchema
);
