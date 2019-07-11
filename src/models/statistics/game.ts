import { Document, model, Schema } from 'mongoose';
import * as models from '../../lib/demacia/models';

export interface IStatisticsGameModel extends models.IGameApiData, Document {
  seasonId: number;
  isAnalyze: boolean[];
}

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
  isAnalyze: [Boolean],
});

export default model<IStatisticsGameModel>('statistics_game', gameSchema);
