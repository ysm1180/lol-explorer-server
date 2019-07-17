import { Document, model, Schema } from 'mongoose';

export interface IGameChampionModel extends Document {
  championKey: number;
  summonerAccountId: string;
  platformId: string;
  queueId: number;
  mapId: number;
  seasonId: number;
  gameVersion: string;
  wins: number;
  losses: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCS: number;
  averageEarnedGold: number;
  averageGameDuration: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  predictPosition: Position;
}

var gameChampionSchema = new Schema({
  championKey: Number,
  summonerAccountId: String,
  platformId: String,
  queueId: Number,
  mapId: Number,
  seasonId: Number,
  gameVersion: String,
  wins: Number,
  losses: Number,
  averageKills: Number,
  averageDeaths: Number,
  averageAssists: Number,
  averageCS: Number,
  averageEarnedGold: Number,
  averageGameDuration: Number,
  doubleKills: Number,
  tripleKills: Number,
  quadraKills: Number,
  pentaKills: Number,
  predictPosition: Number,
});

export default model<IGameChampionModel>('game_champion', gameChampionSchema);
