import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalItemBuildModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  items: number[];
  itemCount: number;
}

var statisticsChampionRivalItemBuildSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  items: [Number],
  itemCount: Number,
});

export default model<IStatisticsChampionRivalItemBuildModel>(
  'statistics_champion_rival_item_build',
  statisticsChampionRivalItemBuildSchema
);
