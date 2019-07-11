import { Document, model, Schema } from 'mongoose';

export interface IStatisticsSummonerModel extends Document {
  name: string;
  queue: string;
  tier: string;
  rank: string;
}

var summonerSchema = new Schema({
  name: String,
  queue: String,
  tier: String,
  rank: String,
});

export default model<IStatisticsSummonerModel>('statistics_summoner', summonerSchema);
