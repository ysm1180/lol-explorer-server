import { Document, model, Schema } from 'mongoose';
import * as models from '../lib/demacia/models';

export interface IGameModel extends models.IGameTimelineApiData, Document {
  gameId: number;
}

var gameTimelineSchema = new Schema({
  gameId: Number,
  frames: {
    type: ['Mixed'],
  },
  frameInterval: Number,
});

export default model<IGameModel>('game_timeline', gameTimelineSchema);
