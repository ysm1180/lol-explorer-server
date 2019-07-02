import { Document, model, Schema } from 'mongoose';
import * as models from '../lib/demacia/models';

export interface IMatchModel extends models.IMatchApiData, Document {}

var matchSchema = new Schema({
  summonerAccountId: String,
  platformId: String,
  gameId: Number,
  champion: Number,
  queue: Number,
  season: Number,
  timestamp: Number,
  role: String,
  lane: String,
  first: Boolean,
});

export default model<IMatchModel>('match', matchSchema);
