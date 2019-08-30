import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionFinalItemBuildModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
  itemCount: number;
}

var statisticsChampionFinalItemBuildSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
  itemCount: Number,
});

export default model<IStatisticsChampionFinalItemBuildModel>(
  'statistics_champion_final_item_build',
  statisticsChampionFinalItemBuildSchema
);
