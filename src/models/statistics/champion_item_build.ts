import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionItemBuildModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
}

var statisticsChampionItemBuildSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
});

export default model<IStatisticsChampionItemBuildModel>(
  'statistics_champion_item_build',
  statisticsChampionItemBuildSchema
);
