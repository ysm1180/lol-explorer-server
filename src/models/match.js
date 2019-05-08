import { model, Schema } from 'mongoose';

var matchSchema = new Schema({
  summonerAccountId: String,
  gameId: Number,
  queue: Number,
  timestamp: Number,
  season: Number,
  platformId: String,
  role: String,
  lane: String,
});

export default model('match', matchSchema);
