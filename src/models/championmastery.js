import { model, Schema } from 'mongoose';

var championMasterySchema = new Schema({
  summonerId: String,
  championKey: Number,
  level: Number,
  points: Number,
  tokensEarend: Number,
  lastPlayTime: Number,
});

export default model('champion_mastery', championMasterySchema);
