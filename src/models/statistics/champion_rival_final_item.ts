import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalFinalItemModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  item: number;
}

var statisticsChampionRivalFinalItemSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  item: Number,
});

export default model<IStatisticsChampionRivalFinalItemModel>(
  'statistics_champion_rival_final_item',
  statisticsChampionRivalFinalItemSchema
);
