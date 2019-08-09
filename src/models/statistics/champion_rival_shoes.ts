import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalShoesModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  shoes: number;
  averageTimestamp: number;
}

var statisticsChampionRivalShoesSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  shoes: Number,
  averageTimestamp: Number,
});

export default model<IStatisticsChampionRivalShoesModel>(
  'statistics_champion_rival_shoes',
  statisticsChampionRivalShoesSchema
);
