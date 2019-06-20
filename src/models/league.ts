import { Document, model, Schema } from 'mongoose';
import * as models from '../lib/demacia/models';

export interface ILeagueModel extends models.ILeagueApiData, Document {}

var leagueSchema = new Schema({
  leagueId: String,
  queueType: String,
  tier: String,
  rank: String,
  summonerId: String,
  summonerName: String,
  leaguePoints: Number,
  wins: Number,
  losses: Number,
  veteran: Boolean,
  inactive: Boolean,
  freshBlood: Boolean,
  hotStreak: Boolean,
  season: Number,
  miniSeries: {
    type: ['Mixed'],
    required: false,
  },
});

export default model<ILeagueModel>('league', leagueSchema);
