import { Document, model, Schema } from 'mongoose';

export interface ISummonerModel extends Document {
  name: string;
  accountId: string;
  id: string;
  profileIconId: number;
  updatedTs: Date;
}

var summonerSchema = new Schema({
  name: String,
  profileIconId: Number,
  puuid: String,
  summonerLevel: Number,
  accountId: String,
  id: String,
  revisionDate: Number,
  updatedTs: {
    type: Date,
    default: Date.now,
  },
});

export default model<ISummonerModel>('summoner', summonerSchema);
