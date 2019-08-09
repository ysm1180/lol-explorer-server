import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionPurchasedItemModel extends Document {
  championKey: number;
  position: POSITION;
  tier: string;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
  itemCount: number;
}

var statisticsChampionPurchasedItemSchema = new Schema({
  championKey: Number,
  position: Number,
  tier: String,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
  itemCount: Number,
});

export default model<IStatisticsChampionPurchasedItemModel>(
  'statistics_champion_purchased_item',
  statisticsChampionPurchasedItemSchema
);
