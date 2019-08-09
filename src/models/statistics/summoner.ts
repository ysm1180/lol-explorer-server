import { Document, model, Schema } from 'mongoose';

export interface IStatisticsSummonerModel extends Document {
  name: string;
  queue: string;
  tier: string;
  rank: string;
  isReady: boolean;
}

var summonerSchema = new Schema({
  name: String,
  queue: String,
  tier: String,
  rank: String,
  isReady: Boolean,
});

export default model<IStatisticsSummonerModel>('statistics_summoner', summonerSchema);
