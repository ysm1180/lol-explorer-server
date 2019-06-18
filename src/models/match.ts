import { Document, model, Schema } from 'mongoose';
import { IMatchApiData } from '../lib/demacia/models';

export interface IMatchModel extends IMatchApiData, Document {}

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
});

export default model<IMatchModel>('match', matchSchema);
