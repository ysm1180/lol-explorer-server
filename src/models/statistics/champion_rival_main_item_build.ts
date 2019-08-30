import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalMainItemBuildModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
}

var statisticsChampionRivalMainItemBuildSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
});

export default model<IStatisticsChampionRivalMainItemBuildModel>(
  'statistics_champion_rival_main_item_build',
  statisticsChampionRivalMainItemBuildSchema
);
