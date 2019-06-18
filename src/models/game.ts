import { Document, model, Schema } from 'mongoose';
import { IGameApiData } from '../lib/demacia/models';

export interface IGameModel extends IGameApiData, Document {}

var gameSchema = new Schema({
  gameId: Number,
  platformId: String,
  gameCreation: Number,
  gameDuration: Number,
  queueId: Number,
  mapId: Number,
  seasonId: Number,
  gameVersion: String,
  gameMode: String,
  gameType: String,
  teams: {
    type: ['Mixed'],
  },
  participants: {
    type: ['Mixed'],
  },
  participantIdentities: {
    type: ['Mixed'],
  },
});

export default model<IGameModel>('game', gameSchema);
