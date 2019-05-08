import { model, Schema } from 'mongoose';

var summonerSchema = new Schema({
  name: String,
  profileIconId: Number,
  puuid: String,
  summonerLevel: Number,
  accountId: String,
  id: String,
  revisionDate: Number,
});

export default model('summoner', summonerSchema);
