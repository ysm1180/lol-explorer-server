import { Document, model, Schema } from 'mongoose';

export interface IStatisticsChampionBanModel extends Document {
  championKey: number;
  count: number;
  countByGame: number;
  gameVersion: string;
}

var statisticsChampionBanSchema = new Schema({
  championKey: Number,
  count: Number,
  countByGame: Number,
  gameVersion: String,
});

export default model<IStatisticsChampionBanModel>(
  'statistics_champion_ban',
  statisticsChampionBanSchema
);
